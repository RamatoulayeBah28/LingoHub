require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const fs = require("fs");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const firebaseUsers = JSON.parse(
  fs.readFileSync("../firebase_users.json", "utf8"),
);
const firebaseExport = JSON.parse(
  fs.readFileSync("firebase_export.json", "utf8"),
);

// ─── Create users in Supabase ────────────────────────────────────────

async function migrateUsers(dryRun = false) {
  console.log("\n── Migrating users ──");
  console.log(`   Found ${firebaseUsers.users.length} Firebase auth users`);

  const uidMapping = {}; // { firebaseUid: supabaseUuid }
  const failed = [];

  for (const fbUser of firebaseUsers.users) {
    const email = fbUser.email;
    const firebaseUid = fbUser.localId;

    if (!email) {
      console.log(`  ⚠ Skipping user with no email (uid: ${firebaseUid})`);
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would create: ${email}`);
      uidMapping[firebaseUid] = `dry-run-uuid-${firebaseUid}`;
      continue;
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: randomUUID(), // random temp password — lazy migration handles real passwords
        email_confirm: true,
        user_metadata: {
          firebase_uid: firebaseUid,
          display_name: fbUser.displayName || null,
        },
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          console.log(
            `  ↩ Already exists: ${email} — looking up existing user`,
          );
          const { data: list } = await supabase.auth.admin.listUsers({
            perPage: 1000,
          });
          const existing = list.users.find((u) => u.email === email);
          if (existing) {
            uidMapping[firebaseUid] = existing.id;
            console.log(`   Mapped existing: ${email}`);
          } else {
            console.log(`   Could not find existing user: ${email}`);
            failed.push(email);
          }
        } else {
          console.log(`   Failed: ${email} — ${error.message}`);
          failed.push(email);
        }
        continue;
      }

      uidMapping[firebaseUid] = data.user.id;
      console.log(`   Created: ${email} (${firebaseUid} → ${data.user.id})`);
    } catch (e) {
      console.error(`   Error creating ${email}:`, e.message);
      failed.push(email);
    }
  }

  fs.writeFileSync("uid_mapping.json", JSON.stringify(uidMapping, null, 2));
  console.log(`\n  UID mapping saved → uid_mapping.json`);
  console.log(`  Mapped:  ${Object.keys(uidMapping).length}`);
  console.log(`  Failed:  ${failed.length}`);
  if (failed.length > 0) console.log(`  Failed users: ${failed.join(", ")}`);

  return uidMapping;
}

// ─── Insert user profiles ────────────────────────────────────────────

async function migrateUserProfiles(uidMapping, dryRun = false) {
  console.log("\n── Inserting user profiles ──");

  const profiles = Object.entries(uidMapping).map(
    ([firebaseUid, supabaseUuid]) => {
      const fbUser = firebaseUsers.users.find((u) => u.localId === firebaseUid);
      return {
        id: supabaseUuid,
        email: fbUser?.email || null,
        display_name: fbUser?.displayName || null,
        username: null,
        preferred_language: "en",
      };
    },
  );

  if (dryRun) {
    console.log(`  [DRY RUN] Would insert ${profiles.length} profiles`);
    return;
  }

  const { error } = await supabase
    .from("users")
    .upsert(profiles, { onConflict: "id" });

  if (error) {
    console.error("   Error inserting profiles:", error.message);
  } else {
    console.log(`   Inserted ${profiles.length} user profiles`);
  }
}

// ─── Insert posts ─────────────────────────────────────────────────────

async function migratePosts(uidMapping, dryRun = false) {
  console.log("\n── Migrating posts ──");

  const postIdMapping = {};
  let inserted = 0;
  let skipped = 0;

  for (const post of firebaseExport.posts) {
    const supabaseUserId = uidMapping[post.authorId] || null;

    if (!supabaseUserId && post.authorId) {
      console.log(
        `  ⚠ No Supabase user for authorId ${post.authorId} — "${post.title}" will have null user_id`,
      );
      skipped++;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would insert post: "${post.title}"`);
      postIdMapping[post.id] = `dry-run-${post.id}`;
      continue;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: supabaseUserId,
        title: post.title,
        content: post.content,
        image_url: post.imageUrl,
        is_anonymous: post.isAnonymous,
        author_name: post.authorName,
        upvotes_count: post.upvotes || 0,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
      })
      .select("id")
      .single();

    if (error) {
      console.log(`   Failed post "${post.title}": ${error.message}`);
      continue;
    }

    postIdMapping[post.id] = data.id;
    inserted++;

    if (post.tags && post.tags.length > 0) {
      await supabase
        .from("post_tags")
        .insert(
          post.tags.map((tag) => ({
            post_id: data.id,
            tag: tag.toLowerCase().trim(),
          })),
        );
    }

    console.log(
      `   "${post.title}"${post.tags?.length ? ` [${post.tags.join(", ")}]` : ""}`,
    );
  }

  fs.writeFileSync(
    "post_id_mapping.json",
    JSON.stringify(postIdMapping, null, 2),
  );
  console.log(`\n  Post ID mapping saved → post_id_mapping.json`);
  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}`);

  return postIdMapping;
}

// ─── Insert comments ──────────────────────────────────────────────────

async function migrateComments(uidMapping, postIdMapping, dryRun = false) {
  console.log("\n── Migrating comments ──");
  let inserted = 0;

  for (const post of firebaseExport.posts) {
    const supabasePostId = postIdMapping[post.id];
    if (!supabasePostId) continue;

    for (const comment of post._comments) {
      if (dryRun) {
        console.log(
          `  [DRY RUN] Would insert comment by "${comment.authorName}"`,
        );
        continue;
      }

      const { error } = await supabase.from("comments").insert({
        post_id: supabasePostId,
        user_id: uidMapping[comment.authorId] || null,
        content: comment.content,
        is_anonymous: comment.isAnonymous,
        author_name: comment.authorName,
        created_at: comment.createdAt,
      });

      if (error) {
        console.log(
          `   Failed comment by "${comment.authorName}": ${error.message}`,
        );
      } else {
        inserted++;
      }
    }
  }

  console.log(`   Inserted ${inserted} comments`);
}

// ─── Insert upvotes ───────────────────────────────────────────────────

async function migrateUpvotes(uidMapping, postIdMapping, dryRun = false) {
  console.log("\n── Migrating upvotes ──");
  let inserted = 0;
  let skipped = 0;

  for (const post of firebaseExport.posts) {
    const supabasePostId = postIdMapping[post.id];
    if (!supabasePostId) continue;

    for (const upvote of post._upvotes) {
      const supabaseUserId = uidMapping[upvote.userId];

      if (!supabaseUserId) {
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY RUN] Would insert upvote for "${post.title}"`);
        continue;
      }

      const { error } = await supabase.from("upvotes").insert({
        post_id: supabasePostId,
        user_id: supabaseUserId,
        created_at: upvote.upvotedAt,
      });

      if (error) {
        skipped++;
      } else {
        inserted++;
      }
    }
  }

  console.log(`   Inserted ${inserted} upvotes, skipped ${skipped}`);
}

// ─── Insert saved posts ───────────────────────────────────────────────

async function migrateSavedPosts(uidMapping, postIdMapping, dryRun = false) {
  console.log("\n── Migrating saved posts ──");
  let inserted = 0;
  let skipped = 0;

  for (const saved of firebaseExport.savedPosts) {
    const supabaseUserId = uidMapping[saved.userId];
    const supabasePostId = postIdMapping[saved.postId];

    if (!supabaseUserId || !supabasePostId) {
      console.log(
        `  Skipping — missing mapping (userId: ${saved.userId}, postId: ${saved.postId})`,
      );
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(
        `  [DRY RUN] Would insert saved post ${saved.postId} for user ${saved.userId}`,
      );
      continue;
    }

    const { error } = await supabase.from("saved_posts").insert({
      user_id: supabaseUserId,
      post_id: supabasePostId,
      saved_at: saved.savedAt,
    });

    if (error) {
      console.log(` Failed: ${error.message}`);
      skipped++;
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted ${inserted} saved posts, skipped ${skipped}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    console.log(" DRY RUN MODE — nothing will be written to Supabase\n");
  } else {
    console.log(" LIVE MODE — writing to Supabase\n");
  }

  const uidMapping = await migrateUsers(dryRun);
  await migrateUserProfiles(uidMapping, dryRun);
  const postIdMapping = await migratePosts(uidMapping, dryRun);
  await migrateComments(uidMapping, postIdMapping, dryRun);
  await migrateUpvotes(uidMapping, postIdMapping, dryRun);
  await migrateSavedPosts(uidMapping, postIdMapping, dryRun);

  console.log("\n Migration complete");
}

main().catch(console.error);

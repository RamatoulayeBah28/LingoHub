const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Convert Firestore timestamp to ISO string safely
function toISO(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate().toISOString();
  return null;
}

// Treat the string "null" as actual null
function cleanAuthorId(val) {
  if (!val || val === "null") return null;
  return val;
}

// Treat empty string image URLs as null
function cleanImageUrl(val) {
  if (!val || val.trim() === "") return null;
  return val;
}

async function exportPosts() {
  console.log("\nExporting posts");
  const snapshot = await db.collection("posts").get();
  const posts = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();

    // Export upvotes subcollection
    const upvotesSnap = await db
      .collection("posts")
      .doc(doc.id)
      .collection("upvotes")
      .get();
    const upvotes = upvotesSnap.docs.map((u) => ({
      userId: u.data().userId || u.id,
      upvotedAt: toISO(u.data().upvotedAt),
    }));

    // Export comments subcollection
    const commentsSnap = await db
      .collection("posts")
      .doc(doc.id)
      .collection("comments")
      .get();
    const comments = commentsSnap.docs.map((c) => {
      const cd = c.data();
      return {
        id: c.id,
        authorName: cd.authorName || "Anonymous",
        authorId: cleanAuthorId(cd.authorId),
        content: cd.content || "",
        isAnonymous: cd.isAnonymous || false,
        upvotes: cd.upvotes || 0,
        createdAt: toISO(cd.createdAt),
      };
    });

    posts.push({
      id: doc.id,
      authorId: cleanAuthorId(d.authorId),
      authorName: d.authorName || "Anonymous",
      title: d.title || "",
      content: d.content || "",
      imageUrl: cleanImageUrl(d.imageUrl),
      isAnonymous: d.isAnonymous || false,
      tags: Array.isArray(d.tags) ? d.tags.filter(Boolean) : [],
      upvotes: d.upvotes || 0,
      createdAt: toISO(d.createdAt),
      updatedAt: toISO(d.updatedAt),
      _upvotes: upvotes,
      _comments: comments,
    });

    console.log(
      `  ✓ "${d.title}" — ${comments.length} comments, ${upvotes.length} upvotes`,
    );
  }

  return posts;
}

async function exportSavedPosts() {
  console.log("\nExporting saved posts (collection group query)...");

  // collectionGroup finds ALL savedPosts subcollections across the entire database
  // even when parent user documents don't explicitly exist
  const savedSnap = await db.collectionGroup("savedPosts").get();
  const savedPosts = [];

  console.log(`  Found ${savedSnap.docs.length} total saved post entries`);

  for (const saved of savedSnap.docs) {
    const sd = saved.data();
    // The parent document ID is the userId (second-to-last path segment)
    const userId = saved.ref.parent.parent.id;

    // Skip corrupted test entries
    if (!sd.postId || sd.postId === "post") {
      console.log(`  ⚠ Skipping invalid saved post (postId: "${sd.postId}")`);
      continue;
    }

    savedPosts.push({
      userId,
      postId: sd.postId,
      savedAt: toISO(sd.savedAt),
    });
    console.log(`  ✓ user ${userId} saved post ${sd.postId}`);
  }

  return savedPosts;
}

async function main() {
  const output = {};

  output.posts = await exportPosts();
  output.savedPosts = await exportSavedPosts();

  fs.writeFileSync("firebase_export.json", JSON.stringify(output, null, 2));

  console.log("\n Export complete to firebase_export.json");
  console.log(`   Posts:       ${output.posts.length}`);
  console.log(`   Saved posts: ${output.savedPosts.length}`);

  // Summary of data quality
  const nullAuthorPosts = output.posts.filter((p) => !p.authorId).length;
  const postsWithTags = output.posts.filter((p) => p.tags.length > 0).length;
  const totalComments = output.posts.reduce(
    (sum, p) => sum + p._comments.length,
    0,
  );
  const totalUpvotes = output.posts.reduce(
    (sum, p) => sum + p._upvotes.length,
    0,
  );

  console.log(`\n Data summary:`);
  console.log(`   Posts with null authorId: ${nullAuthorPosts}`);
  console.log(`   Posts with tags:          ${postsWithTags}`);
  console.log(`   Total comments:           ${totalComments}`);
  console.log(`   Total upvote records:     ${totalUpvotes}`);
}

main().catch(console.error);

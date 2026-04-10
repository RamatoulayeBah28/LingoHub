/*
The postService module provides functions to create, update, delete, comment on, save, and upvote posts in Firestore.
*/
import { supabase } from "../supabase";

// Storing a New Post
export async function createNewPost(
  title,
  content,
  imageUrl,
  tags = [],
  isAnonymous = false,
) {
  // Get current user's info (assuming they are logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title,
        content,
        image_url: imageUrl || null,
        is_anonymous: isAnonymous,
        author_name: isAnonymous
          ? "Anonymous"
          : user.user_metadata?.full_name || user.email,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (tags.length > 0) {
      const normalizedTags = tags
        .map((tag) => tag.toLowerCase().trim())
        .filter(Boolean);
      await supabase
        .from("post_tags")
        .insert(normalizedTags.map((tag) => ({ post_id: post.id, tag })));
    }
    return post.id;
  } catch (e) {
    console.error("Error adding post: ", e);
    return undefined;
  }
}

// Storing a comment under "comments" subcollection of a post
export async function addCommentToPost(
  postId,
  commentContent,
  isAnonymous = false,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: commentContent,
      is_anonymous: isAnonymous,
      author_name: isAnonymous
        ? "Anonymous"
        : user.user_metadata?.full_name || user.email,
      // TODO fix to display name
    });
    return true;
  } catch (e) {
    console.error("Error adding comment: ", e);
    return undefined;
  }
}

// Saving a Post to a User's Dashboard
export async function savePostForUser(postId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("saved_posts")
      .insert({ post_id: postId, user_id: user.id });
  } catch (e) {
    console.error("Error saving post:", e);
  }
}

// Remove a saved post from user's dashboard
export async function removeSavedPostForUser(postId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } catch (e) {
    console.error("Error removing saved post:", e);
  }
}

export async function upvotePost(postId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("upvotes")
      .insert({ post_id: postId, user_id: user.id });
    const { count } = await supabase
      .from("upvotes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    await supabase
      .from("posts")
      .update({ upvotes_count: count })
      .eq("id", postId);
  } catch (e) {
    console.error("Error upvoting post:", e);
  }
}
export async function removeUpvotePost(postId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("upvotes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    const { count } = await supabase
      .from("upvotes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    await supabase
      .from("posts")
      .update({ upvotes_count: count })
      .eq("id", postId);
  } catch (e) {
    console.error("Error removing upvote:", e);
  }
}

export async function updatePost(postId, updatedData) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const normalizedTags = updatedData.tags
      ?.map((t) => t.toLowerCase().trim())
      .filter(Boolean);

    await supabase
      .from("posts")
      .update({
        title: updatedData.title,
        content: updatedData.content,
        image_url: updatedData.imageUrl,
        is_anonymous: updatedData.isAnonymous,
        // TODO Fix to be display name
        author_name: updatedData.isAnonymous
          ? "Anonymous"
          : user.user_metadata?.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (normalizedTags) {
      await supabase.from("post_tags").delete().eq("post_id", postId);
      await supabase
        .from("post_tags")
        .insert(normalizedTags.map((tag) => ({ post_id: postId, tag })));
    }
    return true;
  } catch (e) {
    console.error("Error updating post:", e);
    return false;
  }
}

export async function deletePost(postId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);
    return true;
  } catch (e) {
    console.error("Error deleting post:", e);
    return false;
  }
}

/*
The dataService module provides functions to interact with Firestore for fetching posts, comments, user saved posts, and tags.  
*/

import { supabase } from "../supabase";

// Normalize post from Supabase snake_case to camelCase for components
function normalizePost(post) {
  return {
    ...post,
    authorName: post.author_name,
    imageUrl: post.image_url,
    isAnonymous: post.is_anonymous,
    upvotes: post.upvotes_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    tags: post.tags || [],
  };
}

// Normalize comment from Supabase snake_case to camelCase for components
function normalizeComment(comment) {
  return {
    ...comment,
    authorName: comment.author_name,
    isAnonymous: comment.is_anonymous,
    createdAt: comment.created_at,
  };
}

// Get a single post by ID
export async function getPostById(postId) {
  try {
    const { data } = await supabase
      .from("posts")
      .select("*, post_tags(tag)")
      .eq("id", postId)
      .single();
    return data ? normalizePost({ ...data, tags: data.post_tags.map((t) => t.tag) }) : null;
  } catch (e) {
    console.error("Error getting post:", e);
    return null;
  }
}

// Get all posts (with optional limit)
// TODO: implement pagination — use .range() for numbered pages or
// .lt("created_at", lastPostDate) for infinite scroll

export async function getAllPosts(maxPosts = 50) {
  try {
    const { data } = await supabase
      .from("posts")
      .select("*, post_tags(tag)")
      .order("created_at", { ascending: false })
      .limit(maxPosts);
    return data.map((post) => normalizePost({ ...post, tags: post.post_tags.map((t) => t.tag) }));
  } catch (e) {
    console.error("Error getting posts:", e);
    return [];
  }
}

// Get comments for a specific post
export async function getCommentsForPost(postId) {
  try {
    console.log("Fetching comments for post:", postId);

    // First try to get all comments without ordering
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    return (data || []).map(normalizeComment);
  } catch (e) {
    console.error("Error getting comments:", e);
    return [];
  }
}

// Get user's saved posts
export async function getUserSavedPosts(userId) {
  try {
    const { data } = await supabase
      .from("saved_posts")
      .select("*, posts(*, post_tags(tag))")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });
    return data.map((row) => normalizePost({
      ...row.posts,
      tags: row.posts.post_tags.map((t) => t.tag),
      savedAt: row.saved_at,
    }));
  } catch (e) {
    console.error("Error getting saved posts:", e);
    return [];
  }
}

// Get posts by a specific author
export async function getPostsByAuthor(authorId) {
  try {
    const { data } = await supabase
      .from("posts")
      .select("*, post_tags(tag)")
      .eq("user_id", authorId)
      .order("created_at", { ascending: false });
    return data.map((post) => normalizePost({ ...post, tags: post.post_tags.map((t) => t.tag) }));
  } catch (e) {
    console.error("Error getting posts by author:", e);
    return [];
  }
}

// Check if a post is saved by a user
export async function isPostSavedByUser(postId, userId) {
  try {
    const { data } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();
    return !!data;
  } catch (e) {
    console.error("Error checking if post is saved:", e);
    return false;
  }
}

// Check if a user has upvoted a post
export async function hasUserUpvotedPost(postId, userId) {
  try {
    const { data } = await supabase
      .from("upvotes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();
    return !!data;
  } catch (e) {
    console.error("Error checking if user upvoted post:", e);
    return false;
  }
}

// Get upvote count for a post
export async function getPostUpvoteCount(postId) {
  try {
    const { count } = await supabase
      .from("upvotes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    return count || 0;
  } catch (e) {
    console.error("Error getting upvote count:", e);
    return 0;
  }
}

// Get posts filtered by tags
export async function getPostsByTags(tags, maxPosts = 50) {
  try {
    const normalized = tags.map((t) => t.toLowerCase().trim());
    const { data: tagRows } = await supabase
      .from("post_tags")
      .select("post_id")
      .in("tag", normalized);

    const postIds = [...new Set(tagRows.map((t) => t.post_id))];
    const { data } = await supabase
      .from("posts")
      .select("*, post_tags(tag)")
      .in("id", postIds)
      .order("created_at", { ascending: false })
      .limit(maxPosts);
    return data.map((post) => normalizePost({ ...post, tags: post.post_tags.map((t) => t.tag) }));
  } catch (e) {
    console.error("Error getting posts by tags:", e);
    return [];
  }
}

// Get all unique tags from posts
export async function getAllTags() {
  try {
    const { data } = await supabase.from("post_tags").select("tag");
    return [...new Set(data.map((t) => t.tag))].sort();
  } catch (e) {
    console.error("Error getting all tags:", e);
    return [];
  }
}

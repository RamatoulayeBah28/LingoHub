/*
The dataService module provides functions to interact with Firestore for fetching posts, comments, user saved posts, and tags.  
*/
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

// Get a single post by ID
export async function getPostById(postId) {
  try {
    const postDocRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postDocRef);

    if (postDoc.exists()) {
      return { id: postDoc.id, ...postDoc.data() };
    } else {
      console.log("No such post!");
      return null;
    }
  } catch (e) {
    console.error("Error getting post:", e);
    return null;
  }
}

// Get all posts (with optional limit)
export async function getAllPosts(maxPosts = 20) {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(maxPosts)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts = [];

    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    return posts;
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
    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const querySnapshot = await getDocs(commentsCollectionRef);
    const comments = [];

    querySnapshot.forEach((doc) => {
      const commentData = { id: doc.id, ...doc.data() };
      console.log("Found comment:", commentData);
      comments.push(commentData);
    });

    // Sort comments manually, putting those without createdAt at the end
    comments.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;

      const dateA = a.createdAt.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateA - dateB; // Oldest first
    });

    console.log("Returning comments:", comments);
    return comments;
  } catch (e) {
    console.error("Error getting comments:", e);
    return [];
  }
}

// Get user's saved posts
export async function getUserSavedPosts(userId) {
  try {
    const savedPostsQuery = query(
      collection(db, "users", userId, "savedPosts"),
      orderBy("savedAt", "desc")
    );

    const querySnapshot = await getDocs(savedPostsQuery);
    const savedPosts = [];

    querySnapshot.forEach((doc) => {
      savedPosts.push({ id: doc.id, ...doc.data() });
    });

    return savedPosts;
  } catch (e) {
    console.error("Error getting saved posts:", e);
    return [];
  }
}

// Get posts by a specific author
export async function getPostsByAuthor(authorId) {
  try {
    console.log("Searching for posts by authorId:", authorId);
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", authorId)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts = [];

    querySnapshot.forEach((doc) => {
      const postData = doc.data();
      console.log(
        "Found post with authorId:",
        postData.authorId,
        "Title:",
        postData.title
      );
      posts.push({ id: doc.id, ...postData });
    });

    // Sort posts by createdAt in JavaScript instead of Firestore
    posts.sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateB - dateA; // Most recent first
    });

    console.log("Total posts found:", posts.length);
    return posts;
  } catch (e) {
    console.error("Error getting posts by author:", e);
    return [];
  }
}

// Check if a post is saved by a user
export async function isPostSavedByUser(postId, userId) {
  try {
    const savedPostDocRef = doc(db, "users", userId, "savedPosts", postId);
    const savedPostDoc = await getDoc(savedPostDocRef);
    return savedPostDoc.exists();
  } catch (e) {
    console.error("Error checking if post is saved:", e);
    return false;
  }
}

// Check if a user has upvoted a post
export async function hasUserUpvotedPost(postId, userId) {
  try {
    const upvoteDocRef = doc(db, "posts", postId, "upvotes", userId);
    const upvoteDoc = await getDoc(upvoteDocRef);
    return upvoteDoc.exists();
  } catch (e) {
    console.error("Error checking if user upvoted post:", e);
    return false;
  }
}

// Get upvote count for a post
export async function getPostUpvoteCount(postId) {
  try {
    const postDocRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postDocRef);

    if (postDoc.exists()) {
      const postData = postDoc.data();
      return postData.upvotes || 0;
    } else {
      console.log("Post not found!");
      return 0;
    }
  } catch (e) {
    console.error("Error getting upvote count:", e);
    return 0;
  }
}

// Get posts filtered by tags
export async function getPostsByTags(tags, maxPosts = 20) {
  try {
    if (!tags || tags.length === 0) {
      return getAllPosts(maxPosts);
    }

    // Normalize tags to lowercase for consistent searching
    const normalizedTags = tags.map((tag) => tag.toLowerCase().trim());

    console.log("Searching for posts with tags:", normalizedTags);

    const postsQuery = query(
      collection(db, "posts"),
      where("tags", "array-contains-any", normalizedTags),
      limit(maxPosts)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts = [];

    querySnapshot.forEach((doc) => {
      const postData = { id: doc.id, ...doc.data() };
      console.log("Found post with tags:", postData.tags);
      posts.push(postData);
    });

    // Sort by createdAt manually since we can't use orderBy with array-contains-any
    posts.sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateB - dateA; // Newest first
    });

    console.log("Filtered posts result:", posts.length, "posts found");
    return posts;
  } catch (e) {
    console.error("Error getting posts by tags:", e);
    return [];
  }
}

// Get all unique tags from posts
export async function getAllTags() {
  try {
    const postsQuery = query(collection(db, "posts"));
    const querySnapshot = await getDocs(postsQuery);

    const allTags = new Set();
    querySnapshot.forEach((doc) => {
      const postData = doc.data();
      if (postData.tags && Array.isArray(postData.tags)) {
        postData.tags.forEach((tag) => allTags.add(tag.toLowerCase()));
      }
    });

    return Array.from(allTags).sort();
  } catch (e) {
    console.error("Error getting all tags:", e);
    return [];
  }
}

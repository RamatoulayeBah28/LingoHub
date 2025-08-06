// Firestore operations for LingoHub posts and comments
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

// Interface definitions (for documentation purposes in JS)
/*
interface PostData {
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CommentData {
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

interface SavedPostData {
  postId: string;
  title: string;
  authorName: string;
  savedAt: Timestamp;
}
*/

// 1. Storing a New Post (posts collection)
export async function createNewPost(
  title,
  content,
  imageUrl,
  tags = [],
  isAnonymous = false
) {
  // Get current user's info (assuming they are logged in)
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to create a post.");
    return;
  }

  // Normalize tags to lowercase for consistent searching
  const normalizedTags = tags
    .map((tag) => tag.toLowerCase().trim())
    .filter((tag) => tag.length > 0);

  const post = {
    title: title,
    content: content,
    imageUrl: imageUrl || "", // Use empty string if no image URL
    tags: normalizedTags, // Add tags array
    authorId: user.uid,
    authorName: isAnonymous ? "Anonymous" : user.displayName || "Anonymous", // Use "Anonymous" if isAnonymous is true
    isAnonymous: isAnonymous, // Add anonymous flag
    upvotes: 0,
    createdAt: Timestamp.now(), // Firestore's server timestamp
    updatedAt: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, "posts"), post);
    console.log("New Post added with ID:", docRef.id);
    return docRef.id; // Return the auto-generated ID
  } catch (e) {
    console.error("Error adding post: ", e);
    return undefined;
  }
}

// 2. Storing a Comment (Subcollection under posts)
export async function addCommentToPost(
  postId,
  commentContent,
  isAnonymous = false
) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to add a comment.");
    return;
  }

  const comment = {
    content: commentContent,
    authorId: user.uid,
    authorName: isAnonymous ? "Anonymous" : user.displayName || "Anonymous",
    createdAt: Timestamp.now(),
  };

  try {
    // Get a reference to the 'comments' subcollection of a specific post
    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const docRef = await addDoc(commentsCollectionRef, comment);
    console.log("Comment added to post", postId, "with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding comment: ", e);
    return undefined;
  }
}

// 3. Saving a Post to a User's Dashboard (users collection with savedPosts subcollection)
export async function savePostForUser(postId, postTitle, postAuthorName) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to save a post.");
    return;
  }

  // Create a reference to the specific saved post document within the user's subcollection
  // The document ID here is the postId itself
  const savedPostDocRef = doc(db, "users", user.uid, "savedPosts", postId);

  const savedPostData = {
    postId: postId,
    title: postTitle,
    authorName: postAuthorName,
    savedAt: Timestamp.now(),
  };

  try {
    // Use setDoc to create or overwrite the document.
    // If the post is already saved, this will just update the savedAt timestamp.
    await setDoc(savedPostDocRef, savedPostData);
    console.log("Post", postId, "saved to user's dashboard.");
  } catch (e) {
    console.error("Error saving post:", e);
  }
}

// Remove a saved post from user's dashboard
export async function removeSavedPostForUser(postId) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to unsave a post.");
    return;
  }

  const savedPostDocRef = doc(db, "users", user.uid, "savedPosts", postId);

  try {
    await deleteDoc(savedPostDocRef);
    console.log("Post", postId, "removed from user's dashboard.");
  } catch (e) {
    console.error("Error removing saved post:", e);
  }
}

// Upvote a post
export async function upvotePost(postId) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to upvote a post.");
    return;
  }

  try {
    // Create a reference to the specific upvote document within the post's subcollection
    const upvoteDocRef = doc(db, "posts", postId, "upvotes", user.uid);
    const postDocRef = doc(db, "posts", postId);

    const upvoteData = {
      userId: user.uid,
      upvotedAt: Timestamp.now(),
    };

    // Add the upvote document and increment the upvotes count in the main post
    await setDoc(upvoteDocRef, upvoteData);
    await updateDoc(postDocRef, {
      upvotes: increment(1),
    });

    console.log("Post", postId, "upvoted by user", user.uid);
  } catch (e) {
    console.error("Error upvoting post:", e);
  }
}

// Remove upvote from a post
export async function removeUpvotePost(postId) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to remove upvote.");
    return;
  }

  try {
    const upvoteDocRef = doc(db, "posts", postId, "upvotes", user.uid);
    const postDocRef = doc(db, "posts", postId);

    // Check if the upvote document exists before trying to remove it
    const upvoteDoc = await getDoc(upvoteDocRef);
    if (!upvoteDoc.exists()) {
      console.log("User hasn't upvoted this post");
      return;
    }

    // Get current post data to check upvotes count
    const postDoc = await getDoc(postDocRef);
    if (postDoc.exists()) {
      const currentUpvotes = postDoc.data().upvotes || 0;

      // Only decrement if upvotes > 0
      if (currentUpvotes > 0) {
        await deleteDoc(upvoteDocRef);
        await updateDoc(postDocRef, {
          upvotes: increment(-1),
        });
        console.log("Upvote removed from post", postId, "by user", user.uid);
      } else {
        // Just remove the upvote document but don't decrement below 0
        await deleteDoc(upvoteDocRef);
        console.log("Upvote document removed but count was already 0");
      }
    }
  } catch (e) {
    console.error("Error removing upvote:", e);
  }
}

// Edit/Update a post
export async function updatePost(postId, updatedData) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to update a post.");
    return false;
  }

  try {
    const postDocRef = doc(db, "posts", postId);

    // First check if the post exists and if the user is the author
    const postDoc = await getDoc(postDocRef);
    if (!postDoc.exists()) {
      console.error("Post not found.");
      return false;
    }

    const postData = postDoc.data();
    if (postData.authorId !== user.uid) {
      console.error("User is not authorized to edit this post.");
      return false;
    }

    // Normalize tags if they exist in the update
    if (updatedData.tags) {
      updatedData.tags = updatedData.tags
        .map((tag) => tag.toLowerCase().trim())
        .filter((tag) => tag.length > 0);
    }

    // Add updated timestamp
    const updateWithTimestamp = {
      ...updatedData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(postDocRef, updateWithTimestamp);
    console.log("Post", postId, "updated successfully.");
    return true;
  } catch (e) {
    console.error("Error updating post:", e);
    return false;
  }
}

// Delete a post
export async function deletePost(postId) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in to delete a post.");
    return false;
  }

  try {
    const postDocRef = doc(db, "posts", postId);

    // First check if the post exists and if the user is the author
    const postDoc = await getDoc(postDocRef);
    if (!postDoc.exists()) {
      console.error("Post not found.");
      return false;
    }

    const postData = postDoc.data();
    if (postData.authorId !== user.uid) {
      console.error("User is not authorized to delete this post.");
      return false;
    }

    // Delete the post document
    await deleteDoc(postDocRef);
    console.log("Post", postId, "deleted successfully.");
    return true;
  } catch (e) {
    console.error("Error deleting post:", e);
    return false;
  }
}

// Example usage functions (commented out):
/*
// createNewPost("Learning Japanese Kanji", "What are your favorite kanji learning methods?", "https://example.com/kanji-img.jpg");
// addCommentToPost("your-post-id-here", "I love using Anki for spaced repetition!");
// savePostForUser("post-id", "Post Title", "Author Name");
// removeSavedPostForUser("post-id");
// upvotePost("post-id");
// removeUpvotePost("post-id");
// updatePost("post-id", { title: "New Title", content: "New Content" });
// deletePost("post-id");
*/

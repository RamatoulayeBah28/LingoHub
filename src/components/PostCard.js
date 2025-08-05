import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  savePostForUser,
  removeSavedPostForUser,
  upvotePost,
  removeUpvotePost,
} from "../services/postService";
import {
  isPostSavedByUser,
  hasUserUpvotedPost,
  getPostUpvoteCount,
} from "../services/dataService";
import "../styles/PostCard.css";

function PostCard({
  post,
  onPostClick,
  isInSavedPosts = false,
  onPostUnsaved,
}) {
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(isInSavedPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [upvoteLoading, setUpvoteLoading] = useState(false);

  useEffect(() => {
    // Initialize upvote count from post data
    setUpvoteCount(post?.upvotes || 0);

    const checkSavedStatus = async () => {
      if (currentUser && post?.id && !isInSavedPosts) {
        try {
          const savedStatus = await isPostSavedByUser(post.id, currentUser.uid);
          setIsSaved(savedStatus);
        } catch (error) {
          console.error("Error checking saved status:", error);
        }
      }
    };

    const checkUpvoteStatus = async () => {
      if (currentUser && post?.id) {
        try {
          const upvotedStatus = await hasUserUpvotedPost(
            post.id,
            currentUser.uid
          );
          setHasUpvoted(upvotedStatus);

          // Get current upvote count from the post document
          const count = await getPostUpvoteCount(post.id);
          setUpvoteCount(count);
        } catch (error) {
          console.error("Error checking upvote status:", error);
        }
      }
    };

    checkSavedStatus();
    checkUpvoteStatus();
  }, [currentUser, post?.id, post?.upvotes, isInSavedPosts]);

  const handleSavePost = async (e) => {
    e.stopPropagation(); // Prevent triggering post click

    if (!currentUser) {
      alert("Please log in to save posts");
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        await removeSavedPostForUser(post.id);
        setIsSaved(false);
        // Notify parent if post was unsaved from saved posts view
        if (isInSavedPosts && onPostUnsaved) {
          onPostUnsaved();
        }
      } else {
        await savePostForUser(post.id, post.title, post.authorName);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error saving/unsaving post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvotePost = async (e) => {
    e.stopPropagation(); // Prevent triggering post click

    if (!currentUser) {
      alert("Please log in to upvote posts");
      return;
    }

    // Optimistic update - update UI immediately
    const wasUpvoted = hasUpvoted;
    const originalCount = upvoteCount;
    const newUpvoteCount = wasUpvoted
      ? Math.max(0, upvoteCount - 1)
      : upvoteCount + 1;

    setHasUpvoted(!wasUpvoted);
    setUpvoteCount(newUpvoteCount);
    setUpvoteLoading(true);

    try {
      if (wasUpvoted) {
        await removeUpvotePost(post.id);
      } else {
        await upvotePost(post.id);
      }

      // Verify the count from database after the operation
      const actualCount = await getPostUpvoteCount(post.id);
      setUpvoteCount(Math.max(0, actualCount)); // Ensure it never goes below 0
    } catch (error) {
      console.error("Error upvoting/removing upvote:", error);
      // Revert optimistic update on error
      setHasUpvoted(wasUpvoted);
      setUpvoteCount(Math.max(0, originalCount)); // Use original count and ensure it's not negative
    } finally {
      setUpvoteLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="post-card" onClick={() => onPostClick(post)}>
      <div className="post-header">
        <h3 className="post-title">{post.title}</h3>
        <button
          className={`save-button ${isSaved ? "saved" : ""}`}
          onClick={handleSavePost}
          disabled={isLoading}
          title={isSaved ? "Remove from saved" : "Save post"}
        >
          {isLoading ? "⏳" : isSaved ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="post-content">
        <p>{truncateContent(post.content)}</p>
      </div>

      {post.imageUrl && (
        <div className="post-image">
          <img src={post.imageUrl} alt="Post" />
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, index) => (
            <span key={index} className="post-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="post-footer">
        <div className="post-meta">
          <span className="post-author">By: {post.authorName}</span>
          <span className="post-date">{formatDate(post.createdAt)}</span>
        </div>
        <div className="post-stats">
          <button
            className={`upvote-button ${hasUpvoted ? "upvoted" : ""}`}
            onClick={handleUpvotePost}
            disabled={upvoteLoading}
            title={hasUpvoted ? "Remove upvote" : "Upvote post"}
          >
            {upvoteLoading ? "⏳" : hasUpvoted ? "👍" : "👍"} {upvoteCount}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;

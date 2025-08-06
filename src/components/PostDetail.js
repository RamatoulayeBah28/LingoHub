import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getCommentsForPost,
  hasUserUpvotedPost,
  getPostUpvoteCount,
} from "../services/dataService";
import {
  addCommentToPost,
  savePostForUser,
  removeSavedPostForUser,
  upvotePost,
  removeUpvotePost,
} from "../services/postService";
import CommentSection from "./CommentSection";
import "../styles/PostDetail.css";

function PostDetail({ post, onClose, isInSavedPosts = false, onPostUnsaved }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSaved, setIsSaved] = useState(isInSavedPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [upvoteLoading, setUpvoteLoading] = useState(false);

  useEffect(() => {
    // Initialize upvote count from post data
    setUpvoteCount(post?.upvotes || 0);

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const commentsData = await getCommentsForPost(post.id);
        setComments(commentsData);
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoadingComments(false);
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

    if (post && post.id) {
      loadComments();
      checkUpvoteStatus();
    }
  }, [post, post?.upvotes, currentUser]);

  const reloadComments = async () => {
    setLoadingComments(true);
    try {
      const commentsData = await getCommentsForPost(post.id);
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (commentContent, isAnonymous = false) => {
    if (!currentUser) {
      alert("Please log in to add comments");
      return false;
    }

    try {
      const commentId = await addCommentToPost(
        post.id,
        commentContent,
        isAnonymous
      );
      if (commentId) {
        // Reload comments to show the new one
        await reloadComments();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding comment:", error);
      return false;
    }
  };

  const handleUpvotePost = async () => {
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

  const handleSavePost = async () => {
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
        if (onPostUnsaved) {
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

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!post) {
    return null;
  }

  return (
    <div className="post-detail-overlay">
      <div className="post-detail-container">
        <div className="post-detail-header">
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <article className="post-detail">
          <header className="post-header">
            <div className="post-title-section">
              <h1 className="post-title">{post.title}</h1>
              <button
                className={`save-button ${isSaved ? "saved" : ""}`}
                onClick={handleSavePost}
                disabled={isLoading}
                title={isSaved ? "Remove from saved" : "Save post"}
              >
                {isLoading ? "⏳" : isSaved ? "❤️ Saved" : "🤍 Save"}
              </button>
            </div>

            <div className="post-meta">
              <span className="post-author">By: {post.authorName}</span>
              <span className="post-date">{formatDate(post.createdAt)}</span>
              <button
                className={`upvote-button ${hasUpvoted ? "upvoted" : ""}`}
                onClick={handleUpvotePost}
                disabled={upvoteLoading}
                title={hasUpvoted ? "Remove upvote" : "Upvote post"}
              >
                {upvoteLoading ? "⏳" : "👍"} {upvoteCount}
              </button>
            </div>
          </header>

          <div className="post-content">
            <p>{post.content}</p>
          </div>

          {post.imageUrl && (
            <div className="post-image">
              <img src={post.imageUrl} alt="Post content" />
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

          <CommentSection
            comments={comments}
            onAddComment={handleAddComment}
            loading={loadingComments}
            currentUser={currentUser}
          />
        </article>
      </div>
    </div>
  );
}

export default PostDetail;

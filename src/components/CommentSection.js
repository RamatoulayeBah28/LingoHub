import React, { useState } from "react";
import "../styles/CommentSection.css";

function CommentSection({ comments, onAddComment, loading, currentUser }) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    if (!currentUser) {
      alert("Please log in to add comments");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onAddComment(newComment.trim(), isAnonymous);
      if (success) {
        setNewComment("");
        setIsAnonymous(false);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.warn("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <section className="comment-section">
      <h3 className="comments-title">Comments ({comments.length})</h3>

      {/* Add Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="comment-input-group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              className="comment-textarea"
            />
            <small className="character-count">
              {newComment.length}/500 characters
            </small>
          </div>
          <div className="comment-anonymous-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Comment anonymously
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="submit-comment-button"
          >
            {isSubmitting ? "Adding..." : "Add Comment"}
          </button>
        </form>
      ) : (
        <div className="login-prompt">Please log in to add comments.</div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {loading ? (
          <div className="loading-comments">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <>
            {console.log("Rendering comments:", comments)}
            {comments.map((comment) => {
              console.log("Individual comment:", comment);
              return (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.AuthorName}</span>
                    <span className="comment-date">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}

export default CommentSection;

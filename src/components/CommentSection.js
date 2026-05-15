/*
The CommentSection component displays a list of comments for a post and provides a form for adding new comments.
*/
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/CommentSection.css";

function CommentSection({ comments, onAddComment, onEditComment, onDeleteComment, loading, currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    if (!currentUser) {
      navigate("/auth", {
        state: { reason: "add comments", from: location.pathname },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onAddComment(newComment.trim(), isAnonymous);
      if (success) {
        console.log("setting new comment...");
        setNewComment("");
        console.log("commeent set successfully");
        setIsSubmitting(false);

        setIsAnonymous(false);
        return true;
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
            {comments.map((comment) => {
              const isOwner = currentUser && comment.user_id === currentUser.id;
              const isEditing = editingId === comment.id;

              return (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.authorName}</span>
                    <span className="comment-date">
                      {formatDate(comment.createdAt)}
                    </span>
                    {isOwner && !isEditing && (
                      <div className="comment-actions">
                        <button
                          className="comment-edit-btn"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditText(comment.content);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="comment-delete-btn"
                          onClick={() => onDeleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="comment-edit-group">
                      <textarea
                        className="comment-textarea"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={500}
                        rows={3}
                      />
                      <div className="comment-edit-actions">
                        <button
                          className="comment-save-btn"
                          onClick={async () => {
                            const success = await onEditComment(comment.id, editText.trim());
                            if (success) setEditingId(null);
                          }}
                          disabled={!editText.trim()}
                        >
                          Save
                        </button>
                        <button
                          className="comment-cancel-btn"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-content">
                      <p>{comment.content}</p>
                    </div>
                  )}
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

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createNewPost } from "../services/postService";
import "../styles/PostForm.css";

function PostForm({ onClose, onPostCreated }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const newTag = tagInput.trim();
    if (
      newTag &&
      !tags.map((tag) => tag.toLowerCase()).includes(newTag.toLowerCase())
    ) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError("You must be logged in to create a post");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const postId = await createNewPost(
        formData.title.trim(),
        formData.content.trim(),
        formData.imageUrl.trim(),
        tags, // Pass tags to createNewPost
        isAnonymous // Pass anonymous flag
      );

      if (postId) {
        // Reset form
        setFormData({
          title: "",
          content: "",
          imageUrl: "",
        });
        setTags([]);
        setTagInput("");
        setIsAnonymous(false);

        // Notify parent component
        if (onPostCreated) {
          onPostCreated(postId);
        }

        // Close the form
        if (onClose) {
          onClose();
        }
      } else {
        setError("Failed to create post. Please try again.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setError("An error occurred while creating the post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="post-form-overlay">
      <div className="post-form-container">
        <div className="post-form-header">
          <h2>Create New Post</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter post title..."
              maxLength={100}
              required
            />
            <small>{formData.title.length}/100 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Share your language learning experience, tips, or questions..."
              rows={8}
              maxLength={2000}
              required
            />
            <small>{formData.content.length}/2000 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (optional)</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            <small>Add an image to make your post more engaging</small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tags-input-container">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyPress}
                placeholder="Add tags (e.g., french, grammar, pronunciation)..."
                className="tag-input"
              />
              <button
                type="button"
                onClick={addTag}
                className="add-tag-button"
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>
            <div className="tags-display">
              {tags.map((tag, index) => (
                <span key={index} className="tag-bubble">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="remove-tag-button"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <small>
              Press Enter or comma to add tags. Tags help others find your post.
            </small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Post anonymously
            </label>
            <small>
              Your post will be shown as "By: Anonymous" instead of your name.
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostForm;

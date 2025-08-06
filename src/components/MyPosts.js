import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getPostsByAuthor } from "../services/dataService";
import { deletePost } from "../services/postService";
import PostCard from "./PostCard";
import PostDetail from "./PostDetail";
import PostForm from "./PostForm";
import "../styles/MyPosts.css";

function MyPosts({ onBack }) {
  const { currentUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const loadMyPosts = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        console.log("Loading posts for user ID:", currentUser.uid);
        const posts = await getPostsByAuthor(currentUser.uid);
        console.log("Loaded posts:", posts);
        setMyPosts(posts);
      } catch (error) {
        console.error("Error loading my posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMyPosts();
  }, [currentUser]);

  const refreshMyPosts = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const posts = await getPostsByAuthor(currentUser.uid);
      setMyPosts(posts);
    } catch (error) {
      console.error("Error loading my posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const handleCloseDetail = () => {
    setShowPostDetail(false);
    setSelectedPost(null);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditForm(true);
  };

  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        const success = await deletePost(postId);
        if (success) {
          // Remove the deleted post from the state
          setMyPosts(myPosts.filter((post) => post.id !== postId));
          // Close detail view if it's the deleted post
          if (selectedPost && selectedPost.id === postId) {
            handleCloseDetail();
          }
          alert("Post deleted successfully!");
        } else {
          alert("Failed to delete post. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Error deleting post. Please try again.");
      }
    }
  };

  const handlePostUpdated = async () => {
    // Reload posts after editing
    await refreshMyPosts();
    setShowEditForm(false);
    setEditingPost(null);
    // Close detail view to refresh it
    if (showPostDetail) {
      handleCloseDetail();
    }
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingPost(null);
  };

  if (!currentUser) {
    return (
      <div className="my-posts">
        <div className="error-message">Please log in to view your posts.</div>
      </div>
    );
  }

  return (
    <div className="my-posts">
      <div className="my-posts-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Feed
        </button>
        <h1>My Posts</h1>
        <div className="posts-count">
          {myPosts.length} {myPosts.length === 1 ? "post" : "posts"}
        </div>
      </div>

      <div className="my-posts-content">
        {loading ? (
          <div className="loading">Loading your posts...</div>
        ) : myPosts.length === 0 ? (
          <div className="empty-state">
            <h2>No posts yet</h2>
            <p>
              You haven't created any posts yet. Start sharing your language
              learning journey!
            </p>
          </div>
        ) : (
          <div className="my-posts-grid">
            {myPosts.map((post) => (
              <div key={post.id} className="my-post-card-wrapper">
                <PostCard
                  post={post}
                  onPostClick={() => handlePostClick(post)}
                  showAuthorActions={true}
                />
                <div className="post-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEditPost(post)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {showPostDetail && selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={handleCloseDetail}
          showAuthorActions={true}
          onEdit={() => handleEditPost(selectedPost)}
          onDelete={() => handleDeletePost(selectedPost.id)}
        />
      )}

      {/* Edit Post Form */}
      {showEditForm && editingPost && (
        <PostForm
          onClose={handleCloseEditForm}
          onPostCreated={handlePostUpdated}
          editingPost={editingPost}
          isEditing={true}
        />
      )}
    </div>
  );
}

export default MyPosts;

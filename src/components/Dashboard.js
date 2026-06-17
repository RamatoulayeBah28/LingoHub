/*
The Dashboard component displays the user's saved posts in a grid layout.
It allows users to view details of each post and manage their saved posts.
*/
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserSavedPosts } from "../services/dataService";
import PostCard from "./PostCard";
import PostDetail from "./PostDetail";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { currentUser } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSavedPosts = async () => {
      setLoading(true);
      try {
        const savedPostsData = await getUserSavedPosts(currentUser.id);
        setSavedPosts(savedPostsData);
      } catch (error) {
        console.error("Error loading saved posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadSavedPosts();
    }
  }, [currentUser]);

  const refreshSavedPosts = async () => {
    setLoading(true);
    try {
      const savedPostsData = await getUserSavedPosts(currentUser.id);
      setSavedPosts(savedPostsData);
    } catch (error) {
      console.error("Error loading saved posts:", error);
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

  const handlePostUnsaved = () => {
    // Reload saved posts when a post is unsaved
    refreshSavedPosts();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Feed
        </button>
        <h1>Saved Posts</h1>
        <div className="posts-count">
          {savedPosts.length} {savedPosts.length === 1 ? "post" : "posts"}
        </div>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">Loading your saved posts...</div>
        ) : savedPosts.length === 0 ? (
          <div className="empty-state">
            <h2>No saved posts yet</h2>
            <p>Save posts by clicking the heart icon to see them here!</p>
          </div>
        ) : (
          <div className="saved-posts-grid">
            {savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostClick={() => handlePostClick(post)}
                isInSavedPosts={true}
                onPostUnsaved={handlePostUnsaved}
              />
            ))}
          </div>
        )}
      </div>

      {showPostDetail && selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={handleCloseDetail}
          isInSavedPosts={true}
          onPostUnsaved={handlePostUnsaved}
        />
      )}
    </div>
  );
}

export default Dashboard;

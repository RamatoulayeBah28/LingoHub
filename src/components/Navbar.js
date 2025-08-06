import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Navbar.css";

function Navbar({ onCreatePost, onShowSavedPosts, onShowMyPosts, onSearch }) {
  const { currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>LingoHub</h1>
        </div>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍
          </button>
        </form>

        {/* Navigation Items */}
        <div className="navbar-items">
          {currentUser ? (
            <>
              <span className="user-email">Welcome, {currentUser.email}</span>
              <button
                className="nav-button create-post-btn"
                onClick={onCreatePost}
              >
                Create Post
              </button>
              <button
                className="nav-button my-posts-btn"
                onClick={onShowMyPosts}
              >
                My Posts
              </button>
              <button
                className="nav-button saved-posts-btn"
                onClick={onShowSavedPosts}
              >
                Saved Posts
              </button>
              <button className="nav-button logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span className="login-prompt">Please log in to create posts</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

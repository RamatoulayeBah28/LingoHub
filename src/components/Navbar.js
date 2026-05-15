import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Navbar.css";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
function Navbar({ onCreatePost, onSearch }) {
  const { currentUser, logout, displayName } = useAuth();
  const navigate = useNavigate();
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
            <FaSearch />
          </button>
        </form>

        {/* Navigation Items */}
        <div className="navbar-items">
          {currentUser ? (
            <>
              <span className="user-email">Welcome, {displayName}</span>
              <button
                className="nav-button create-post-btn"
                onClick={onCreatePost}
              >
                Create Post
              </button>
              <button
                className="nav-button my-posts-btn"
                onClick={() => navigate("/my-posts")}
              >
                My Posts
              </button>
              <button
                className="nav-button saved-posts-btn"
                onClick={() => navigate("/saved")}
              >
                Saved Posts
              </button>
              <button className="nav-button logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="nav-button login-btn"
                onClick={() => navigate("/auth")}
              >
                Log In
              </button>
              <button
                className="nav-button signup-btn"
                onClick={() => navigate("/auth")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

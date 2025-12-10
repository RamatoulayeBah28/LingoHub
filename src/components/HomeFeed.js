import React, { useState, useEffect } from "react";
import { getAllPosts, getPostsByTags } from "../services/dataService";
import PostCard from "./PostCard";
import PostDetail from "./PostDetail";
import PostForm from "./PostForm";
import "../styles/HomeFeed.css";
import { LuRefreshCcw } from "react-icons/lu";

function HomeFeed({ showCreateForm, onCloseCreateForm, searchTerm }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [sortBy, setSortBy] = useState("date"); // 'date' or 'upvotes'
  const [error, setError] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadPosts();
  }, [selectedTags]); // Reload when tags change

  useEffect(() => {
    filterAndSortPosts();
  }, [posts, searchTerm, sortBy, selectedTags]);

  const loadPosts = async () => {
    setLoading(true);
    setError("");

    try {
      let postsData;
      if (selectedTags.length > 0) {
        console.log("Loading posts with tags:", selectedTags);
        postsData = await getPostsByTags(selectedTags, 50);
        console.log("Posts loaded:", postsData.length);
      } else {
        console.log("Loading all posts");
        postsData = await getAllPosts(50); // Load up to 50 posts
      }
      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPosts = () => {
    let result = [...posts];

    // Filter by search term
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.authorName.toLowerCase().includes(searchLower) ||
          (post.tags &&
            post.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Sort posts
    result.sort((a, b) => {
      if (sortBy === "upvotes") {
        return (b.upvotes || 0) - (a.upvotes || 0);
      } else {
        // sort by date
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
        return dateB - dateA; // Most recent first
      }
    });

    setFilteredPosts(result);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleClosePostDetail = () => {
    setSelectedPost(null);
  };

  const handlePostCreated = async (postId) => {
    // Reload posts to include the new one
    await loadPosts();
    if (onCloseCreateForm) {
      onCloseCreateForm();
    }
  };

  const handleRefresh = () => {
    loadPosts();
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTagFilter();
    }
  };

  const addTagFilter = () => {
    const newTag = tagInput.trim();
    console.log("Adding tag filter:", newTag);
    if (
      newTag &&
      !selectedTags
        .map((tag) => tag.toLowerCase())
        .includes(newTag.toLowerCase())
    ) {
      const newSelectedTags = [...selectedTags, newTag];
      console.log("New selected tags:", newSelectedTags);
      setSelectedTags(newSelectedTags);
      setTagInput("");
    } else {
      console.log("Tag already exists or is empty");
    }
  };

  const removeTagFilter = (indexToRemove) => {
    setSelectedTags(selectedTags.filter((_, index) => index !== indexToRemove));
  };

  const clearAllTagFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="home-feed">
      {/* Feed Controls */}
      <div className="feed-controls">
        <div className="feed-header">
          <h2>
            Your Language Forum: Share a fun fact, tips, questions or anything
            language related!
          </h2>
          <button
            onClick={handleRefresh}
            className="refresh-button"
            disabled={loading}
          >
            <LuRefreshCcw />
          </button>
        </div>

        <div className="feed-filters">
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Most Recent</option>
              <option value="upvotes">Most Popular</option>
            </select>
          </div>

          <div className="tag-filter-controls">
            <div className="tag-search-container">
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyPress}
                placeholder="Search tags..."
                className="tag-search-input"
              />
              <button
                type="button"
                onClick={addTagFilter}
                className="add-tag-filter-button"
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>

            {selectedTags.length > 0 && (
              <div className="active-tag-filters">
                <div className="tag-filters-header">
                  <span>Filtered by:</span>
                  <button
                    type="button"
                    onClick={clearAllTagFilters}
                    className="clear-all-tags-button"
                  >
                    Clear all
                  </button>
                </div>
                <div className="tag-filters-display">
                  {selectedTags.map((tag, index) => (
                    <span key={index} className="tag-filter-bubble">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTagFilter(index)}
                        className="remove-tag-filter-button"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {searchTerm && (
            <div className="search-info">
              Showing results for: "<strong>{searchTerm}</strong>"
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-container">
        {loading ? (
          <div className="loading-state">
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <p>
                No posts found matching "{searchTerm}". Try a different search
                term.
              </p>
            ) : (
              <p>
                No posts yet. Be the first to share your language learning
                journey!
              </p>
            )}
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostClick={handlePostClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post Creation Form */}
      {showCreateForm && (
        <PostForm
          onClose={onCloseCreateForm}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetail post={selectedPost} onClose={handleClosePostDetail} />
      )}
    </div>
  );
}

export default HomeFeed;

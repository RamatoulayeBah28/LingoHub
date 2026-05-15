// App.js
import React, { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import HomeFeed from "./components/HomeFeed";
import Dashboard from "./components/Dashboard";
import MyPosts from "./components/MyPosts";
import "./styles/App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PostForm from "./components/PostForm";

function AppContent() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [postCreatedSignal, setPostCreatedSignal] = useState(0);
  const location = useLocation();

  const handleCreatePost = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };
  const handlePostCreated = () => {
    setPostCreatedSignal((s) => s + 1);
    handleCloseCreateForm();
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Show main app if user is authenticated
  return (
    <div className="app">
      {location.pathname !== "/auth" && (
        <Navbar onCreatePost={handleCreatePost} onSearch={handleSearch} />
      )}
      {/* Post Creation Form */}
      {showCreateForm && (
        <PostForm
          onClose={handleCloseCreateForm}
          onPostCreated={handlePostCreated}
        />
      )}

      <main className="main-content">
        <Routes>
          <Route
            path="/saved"
            element={
              <ProtectedRoute reason="view saved posts">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-posts"
            element={
              <ProtectedRoute reason="view your posts">
                <MyPosts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <HomeFeed
                searchTerm={searchTerm}
                postCreatedSignal={postCreatedSignal}
              />
            }
          />

          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Analytics />
    </AuthProvider>
  );
}

export default App;

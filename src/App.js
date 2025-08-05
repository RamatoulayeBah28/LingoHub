// App.js
import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Signup from "./components/SIgnup";
import Navbar from "./components/Navbar";
import HomeFeed from "./components/HomeFeed";
import Dashboard from "./components/Dashboard";
import "./styles/App.css";

function AppContent() {
  const { currentUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreatePost = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleShowSavedPosts = () => {
    setShowSavedPosts(true);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setShowSavedPosts(false); // Return to main feed when searching
  };

  // Show login/signup if user is not authenticated
  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome to LingoHub</h1>
          <p>Connect with language lovers worldwide</p>
        </div>
        <div className="auth-forms">
          <Signup />
          <Login />
        </div>
      </div>
    );
  }

  // Show main app if user is authenticated
  return (
    <div className="app">
      <Navbar
        onCreatePost={handleCreatePost}
        onShowSavedPosts={handleShowSavedPosts}
        onSearch={handleSearch}
      />
      <main className="main-content">
        {showSavedPosts ? (
          <Dashboard onBack={() => setShowSavedPosts(false)} />
        ) : (
          <HomeFeed
            showCreateForm={showCreateForm}
            onCloseCreateForm={handleCloseCreateForm}
            searchTerm={searchTerm}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

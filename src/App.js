// App.js
import React, { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Signup from "./components/SIgnup";
import Navbar from "./components/Navbar";
import HomeFeed from "./components/HomeFeed";
import Dashboard from "./components/Dashboard";
import MyPosts from "./components/MyPosts";
import "./styles/App.css";

function AppContent() {
  const { currentUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreatePost = () => {
    setShowCreateForm(true);
    setShowSavedPosts(false);
    setShowMyPosts(false);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleShowSavedPosts = () => {
    setShowSavedPosts(true);
    setShowMyPosts(false);
  };

  const handleShowMyPosts = () => {
    setShowMyPosts(true);
    setShowSavedPosts(false);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setShowSavedPosts(false); // Return to main feed when searching
    setShowMyPosts(false); // Return to main feed when searching
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
        onShowMyPosts={handleShowMyPosts}
        onSearch={handleSearch}
      />
      <main className="main-content">
        {showSavedPosts ? (
          <Dashboard onBack={() => setShowSavedPosts(false)} />
        ) : showMyPosts ? (
          <MyPosts onBack={() => setShowMyPosts(false)} />
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
      <Analytics />
    </AuthProvider>
  );
}

export default App;

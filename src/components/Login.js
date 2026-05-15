// Login.js
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Auth.css";
import { FaGoogle } from "react-icons/fa";
import { trackLogin } from "../services/analyticsService";
import { useNavigate, useLocation } from "react-router-dom";

function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      trackLogin("email");
      navigate(location.state?.from || "/");
    } catch (error) {
      setError(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      trackLogin("google");
      navigate(location.state?.from || "/");
    } catch (error) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <h2>Log In</h2>
      {error && <p className="error-message">{error}</p>}
      <hr className="my-4 border-gray-200" />

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          ref={emailRef}
          placeholder="Email"
          required
          disabled={loading}
        />
        <input
          type="password"
          ref={passwordRef}
          placeholder="Password"
          required
          disabled={loading}
        />
      </form>

      <div className="auth-buttons-row">
        <button
          className="auth-submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "..." : "Log In"}
        </button>

        <span className="auth-divider-text">or</span>

        <button
          className="google-signin-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <FaGoogle />
        </button>
      </div>
    </div>
  );
}

export default Login;

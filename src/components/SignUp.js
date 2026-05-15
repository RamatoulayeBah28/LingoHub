// SignUp.js
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { trackSignUp } from "../services/analyticsService";
import "../styles/Auth.css";
import { FaGoogle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

function SignUp() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { signup, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value);
      trackSignUp("email");
      navigate(location.state?.from || "/");
    } catch (error) {
      const msg = error.message || "";
      if (msg.includes("already registered")) {
        setError("An account with this email already exists");
      } else if (msg.includes("Password should be")) {
        setError("Password should be at least 6 characters");
      } else if (msg.includes("valid email") || msg.includes("invalid format")) {
        setError("Please enter a valid email address");
      } else {
        setError(msg || "Failed to create an account");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      trackSignUp("google");
      navigate(location.state?.from || "/");
    } catch (error) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
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
          {loading ? "..." : "Sign Up"}
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

export default SignUp;

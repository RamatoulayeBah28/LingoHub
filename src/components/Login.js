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
      console.error("Login error:", error);

      // Handle specific Firebase Auth errors
      let errorMessage = "Failed to log in";

      // if (error.code) {
      //   setError(error.message || errorMessage)
      // }

      setError(error.message || errorMessage);
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
      console.error("Google sign-in error:", error);

      let errorMessage = "Failed to sign in with Google";

      if (error.code) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            errorMessage = "Sign-in cancelled";
            break;
          case "auth/popup-blocked":
            errorMessage = "Pop-up blocked. Please allow pop-ups and try again";
            break;
          case "auth/account-exists-with-different-credential":
            errorMessage =
              "An account already exists with this email using a different sign-in method";
            break;
          default:
            errorMessage = error.message || "Failed to sign in with Google";
        }
      }

      setError(errorMessage);
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

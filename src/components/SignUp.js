// SignUp.js
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Auth.css";
import { FaGoogle } from "react-icons/fa";

function SignUp() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { signup, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      console.log("Attempting signup with:", {
        email: emailRef.current.value,
        password: passwordRef.current.value ? "***" : "empty",
      });

      await signup(emailRef.current.value, passwordRef.current.value);
      alert("Signed up successfully!");
    } catch (error) {
      console.error("Signup error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Handle specific Firebase Auth errors
      let errorMessage = "Failed to create an account";

      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "An account with this email already exists";
            break;
          case "auth/weak-password":
            errorMessage = "Password should be at least 6 characters";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address";
            break;
          case "auth/operation-not-allowed":
            errorMessage =
              "Email/password authentication is not enabled. Please enable it in Firebase Console.";
            break;
          case "auth/configuration-not-found":
            errorMessage =
              "Firebase Authentication is not properly configured. Please check Firebase Console.";
            break;
          default:
            errorMessage = error.message || "Failed to create an account";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      alert("Signed in with Google successfully!");
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

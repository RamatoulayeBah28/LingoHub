import { useLocation } from "react-router-dom";
import Login from "./Login";
import SignUp from "./SignUp";

function AuthPage() {
  const location = useLocation();
  const reason = location.state?.reason;

  return (
    <div
      className="auth-container"
      style={{
        backgroundImage: "url(/img/home.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="auth-header">
        <h1>Welcome to LingoHub</h1>
        <div className="auth-subtitle-container">
          <p>Connect with language lovers worldwide</p>
        </div>
      </div>

      {reason && (
        <div className="auth-reason">
          <p><strong>You must be logged in to {reason} on LingoHub</strong></p>
          <p>Log in below or sign up</p>
        </div>
      )}

      <div className="auth-forms">
        <SignUp />
        <Login />
      </div>
      <div className="guest-pass"></div>
    </div>
  );
}

export default AuthPage;

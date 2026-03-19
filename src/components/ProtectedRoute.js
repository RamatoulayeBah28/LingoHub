import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";

function ProtectedRoute({ children, reason }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/auth" state={{ reason, from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;

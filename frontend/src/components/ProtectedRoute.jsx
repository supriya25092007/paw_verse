import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading, authError, retrySession } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Getting PawVerse ready...</div>;
  if (authError) {
    return (
      <div className="session-error" role="alert">
        <p>{authError}</p>
        <button className="button button-dark" onClick={retrySession}>Try again</button>
      </div>
    );
  }
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

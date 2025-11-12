import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type ProtectedRouteProps = {
  children: JSX.Element;
};

export default function ProtectedAdmin({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.group !== "Admins") {
    return <Navigate to="/" replace />; 
  }
  return children;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const { adminUser, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="bg-neutral-900 h-dvh flex items-center justify-center text-white">Verificando sesión...</div>;
  }

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;

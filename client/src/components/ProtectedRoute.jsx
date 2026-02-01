import { useContext } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { PlayerContext } from "../context/PlayerContext";
import Loading from "./Loading";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { Player, isAuthLoading } = useContext(PlayerContext);

  // If still loading authentication (session being restored), show loading screen
  if (isAuthLoading) return <Loading />;

  // If player is still null after loading - not logged in
  if (!Player) return <Navigate to="/auth" replace />;

  // If role not allowed - unauthorized
  if (!allowedRoles.includes(Player.role))
    return <Navigate to="/unauthorized" replace />;

  // Otherwise - allowed
  return children;
};

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;

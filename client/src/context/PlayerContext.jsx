import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import socket from "../utils/websocket";
import { updateSessionStorage } from "../utils/storageUtils";
import authApi, {
  getAccessToken,
  setAccessToken,
  markAsLoggedOut,
} from "../utils/authApi";

/* eslint-disable react-refresh/only-export-components */
export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  // for loading state (general UI loading for actions)
  const [loading, setLoading] = useState(false);
  
  // for authentication loading state (session restoration)
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // for player state
  const [Player, setPlayer] = useState(() => {
    const userData = sessionStorage.getItem("player");
    return userData ? JSON.parse(userData) : {};
  });

  // update or add a new property to the player object
  const updatePlayer = (newUser) => {
    setPlayer((prevUser) => {
      const updatedUser = {
        ...prevUser,
        ...newUser,
      };
      updateSessionStorage("player", updatedUser);
      return updatedUser;
    });
  };

  // Socket connection handler
  useEffect(() => {
    const handleConnect = () => {
      const newId = socket.id;
      // Update localStorage
      localStorage.setItem("socketid", newId);

      // Update context + session storage
      setPlayer((prev) => {
        const updated = { ...prev, socketId: newId };
        updateSessionStorage("player", updated);
        return updated;
      });
    };

    const handleDisconnect = () => {
      console.log("❌ Disconnected");
      // Don't set loading on disconnect - connection status is handled separately
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const handleConnectError = () => {
      // Connection errors don't affect loading state - handled by UI components
      console.log("Socket connection error");
    };

    const handleTimeout = () => {
      // Timeout doesn't affect loading state - handled by UI components
      console.log("Socket connection timeout");
    };

    socket.on("connect_error", handleConnectError);
    socket.on("connect_timeout", handleTimeout);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("connect_timeout", handleTimeout);
    };
  }, []);

  // Load user from sessionStorage or server - only runs once on mount
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("player"));

    // If we have valid session data, use it immediately
    if (userData && userData.name && userData.phone && userData.id) {
      updatePlayer(userData);
      setIsAuthLoading(false);
      return; // Already have valid session data
    }

    // No session data, need to restore from server
    setIsAuthLoading(true);
    
    // Refresh token and get new access token first
    const tryRestoreSession = async () => {
      const sessionId = localStorage.getItem("sessionId");

      if (!sessionId) {
        setIsAuthLoading(false);

        setPlayer(null);
        // Only redirect on home page
        if (window.location.pathname === "/") {
          window.location.href = "/auth";
        }
        return;
      }

      try {
        // Then fetch the user
        const { data } = await authApi.get("/me");

        updatePlayer({
          name: data?.name || "",
          phone: data?.phone || "",
          role: data?.role || "user",
          id: data?._id || "",
        });

        sessionStorage.setItem(
          "player",
          JSON.stringify({
            name: data?.name || "",
            phone: data?.phone || "",
            role: data?.role || "user",
            id: data?._id || "",
          })
        );
      } catch (err) {
        console.error("Session invalid, redirecting:", err.message);
        localStorage.clear();
        sessionStorage.clear();

        setPlayer(null);
        window.location.href = "/auth";
      } finally {
        setIsAuthLoading(false);
      }
    };

    tryRestoreSession();
  }, []); // Run only once on mount

  // logout handler
  const logout = () => {
    setAccessToken(null);
    markAsLoggedOut();
    localStorage.clear();
    sessionStorage.clear();
    socket.disconnect();
    setPlayer(null);
    window.location.href = "/auth";
  };

  return (
    <PlayerContext.Provider
      value={{
        Player,
        updatePlayer,
        loading,
        setLoading,
        isAuthLoading,
        getAccessToken,
        setAccessToken,
        logout,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

PlayerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

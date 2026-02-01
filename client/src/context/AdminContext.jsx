/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import adminApi from "../utils/adminApi";
import PropTypes from "prop-types";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if admin is logged in
  const checkAuth = useCallback(async () => {
    const sessionId = localStorage.getItem("adminSessionId");
    if (!sessionId) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const { admin: adminData } = await adminApi.getMe();
      setAdmin(adminData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Admin auth check failed:", error);
      localStorage.removeItem("adminSessionId");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login
  const login = async (email, password) => {
    const result = await adminApi.login({ email, password });
    setAdmin(result.admin);
    setIsAuthenticated(true);
    return result;
  };

  // Logout
  const logout = async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setAdmin(null);
    setIsAuthenticated(false);
    setDashboard(null);
  };

  // Fetch Dashboard
  const fetchDashboard = async () => {
    try {
      const data = await adminApi.getDashboard();
      setDashboard(data);
      return data;
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      throw error;
    }
  };

  // Update Game Settings
  const updateGameSettings = async (settings) => {
    const result = await adminApi.updateGameSettings(settings);
    if (dashboard) {
      setDashboard({ ...dashboard, gameSettings: result.gameSettings });
    }
    return result;
  };

  // Update Dividends
  const updateDividends = async (dividends) => {
    const result = await adminApi.updateDividends(dividends);
    if (dashboard) {
      setDashboard({ ...dashboard, dividends: result.dividends });
    }
    return result;
  };

  // Create Announcement
  const createAnnouncement = async (data) => {
    const result = await adminApi.createAnnouncement(data);
    if (dashboard) {
      setDashboard({ ...dashboard, announcements: result.announcements });
    }
    return result;
  };

  // Book Ticket
  const bookTicket = async (data) => {
    const result = await adminApi.bookTicket(data);
    if (dashboard) {
      setDashboard({
        ...dashboard,
        bookedTickets: result.bookedTickets,
        stats: {
          ...dashboard.stats,
          totalBookedTickets: result.bookedTickets.length,
          availableTickets: dashboard.stats.totalTicketLimit - result.bookedTickets.length,
        },
      });
    }
    return result;
  };

  // Cancel Ticket
  const cancelTicket = async (ticketId) => {
    const result = await adminApi.cancelTicket(ticketId);
    if (dashboard) {
      setDashboard({
        ...dashboard,
        bookedTickets: result.bookedTickets,
        stats: {
          ...dashboard.stats,
          totalBookedTickets: result.bookedTickets.length,
          availableTickets: dashboard.stats.totalTicketLimit - result.bookedTickets.length,
        },
      });
    }
    return result;
  };

  // Shuffle Tickets
  const shuffleTickets = async () => {
    return await adminApi.shuffleTickets();
  };

  // Start Game
  const startGame = async (roomId) => {
    const result = await adminApi.startGame(roomId);
    if (dashboard) {
      setDashboard({ ...dashboard, currentGame: result.currentGame });
    }
    return result;
  };

  // Reset Game
  const resetGame = async () => {
    const result = await adminApi.resetGame();
    if (dashboard) {
      setDashboard({
        ...dashboard,
        currentGame: result.currentGame,
        bookedTickets: [],
        stats: { ...dashboard.stats, totalBookedTickets: 0, availableTickets: dashboard.stats.totalTicketLimit },
      });
    }
    return result;
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        dashboard,
        loading,
        isAuthenticated,
        login,
        logout,
        fetchDashboard,
        updateGameSettings,
        updateDividends,
        createAnnouncement,
        bookTicket,
        cancelTicket,
        shuffleTickets,
        startGame,
        resetGame,
        checkAuth,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

AdminProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminProvider;

import express from "express";
import authenticateAdmin from "../middleware/admin.middleware.js";
import {
  createAdmin,
  loginAdmin,
  logoutAdmin,
  getAdmin,
  updateGameSettings,
  updateDividends,
  createAnnouncement,
  deleteAnnouncement,
  bookTicket,
  cancelTicket,
  getBookedTickets,
  shuffleTickets,
  startGame,
  resetGame,
  updateTheme,
  updateAdminInfo,
  getDashboard,
  checkAdminExists,
  // User Management
  getAllUsers,
  deleteUser,
  changeUserRole,
  // Room Management
  getAllRooms,
  getRoomDetails,
  deleteRoom,
  forceEndRoom,
  // System Logs
  getSystemLogs,
  addSystemLog,
  clearSystemLogs,
  // Statistics
  getStats,
  // Bulk Operations
  clearAllRooms,
  clearAllTickets,
  exportTickets,
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

// Public routes
adminRouter.get("/exists", checkAdminExists);
adminRouter.post("/login", loginAdmin);

// Protected routes
adminRouter.post("/logout", authenticateAdmin, logoutAdmin);
adminRouter.get("/me", authenticateAdmin, getAdmin);
adminRouter.get("/dashboard", authenticateAdmin, getDashboard);
adminRouter.get("/stats", authenticateAdmin, getStats);

// Game settings
adminRouter.put("/settings/game", authenticateAdmin, updateGameSettings);
adminRouter.put("/settings/dividends", authenticateAdmin, updateDividends);

// Announcements
adminRouter.post("/announcement", authenticateAdmin, createAnnouncement);
adminRouter.delete("/announcement/:id", authenticateAdmin, deleteAnnouncement);

// Ticket management
adminRouter.get("/tickets", authenticateAdmin, getBookedTickets);
adminRouter.post("/ticket/book", authenticateAdmin, bookTicket);
adminRouter.delete("/ticket/:ticketId", authenticateAdmin, cancelTicket);

// Game control
adminRouter.post("/game/shuffle", authenticateAdmin, shuffleTickets);
adminRouter.post("/game/start", authenticateAdmin, startGame);
adminRouter.post("/game/reset", authenticateAdmin, resetGame);

// Theme & Info
adminRouter.put("/theme", authenticateAdmin, updateTheme);
adminRouter.put("/info", authenticateAdmin, updateAdminInfo);

// User Management
adminRouter.get("/users", authenticateAdmin, getAllUsers);
adminRouter.delete("/users/:id", authenticateAdmin, deleteUser);
adminRouter.put("/users/:id/role", authenticateAdmin, changeUserRole);

// Room Management
adminRouter.get("/rooms", authenticateAdmin, getAllRooms);
adminRouter.get("/rooms/:id", authenticateAdmin, getRoomDetails);
adminRouter.delete("/rooms/:id", authenticateAdmin, deleteRoom);
adminRouter.post("/rooms/:id/end", authenticateAdmin, forceEndRoom);

// System Logs
adminRouter.get("/logs", authenticateAdmin, getSystemLogs);
adminRouter.post("/logs", authenticateAdmin, addSystemLog);
adminRouter.delete("/logs", authenticateAdmin, clearSystemLogs);

// Bulk Operations
adminRouter.post("/bulk/clear-rooms", authenticateAdmin, clearAllRooms);
adminRouter.post("/bulk/clear-tickets", authenticateAdmin, clearAllTickets);
adminRouter.get("/export/tickets", authenticateAdmin, exportTickets);

export default adminRouter;

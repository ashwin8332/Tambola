import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Room from "../models/room.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  cookieOptionsAccess,
  cookieOptionsRefresh,
  createTokens,
} from "../utils/auth.utils.js";

// Helper function to create admin tokens
const createAdminTokens = (adminId, sessionId) => {
  const accessToken = jwt.sign(
    { id: adminId, sessionId, role: "admin" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: adminId, sessionId, role: "admin" },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

// POST /api/admin/register - Create first admin (only if no admin exists)
export const createAdmin = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Check if any admin exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(403).json({ message: "Admin already exists. Contact superadmin." });
    }

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create session
    const sessionId = uuidv4();

    // Create admin as superadmin (first admin)
    const admin = await Admin.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: "superadmin",
      sessions: [{ sessionId }],
    });

    // Generate tokens
    const tokens = createAdminTokens(admin._id.toString(), sessionId);

    res.cookie("adminAccessToken", tokens.accessToken, cookieOptionsAccess);
    res.cookie("adminRefreshToken", tokens.refreshToken, cookieOptionsRefresh);

    res.status(201).json({
      sessionId,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      message: "Admin created successfully",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create session
    const sessionId = uuidv4();
    admin.sessions.push({ sessionId });

    // Limit sessions to 3
    if (admin.sessions.length > 3) {
      admin.sessions = admin.sessions.slice(-3);
    }

    await admin.save();

    // Generate tokens
    const tokens = createAdminTokens(admin._id.toString(), sessionId);

    res.cookie("adminAccessToken", tokens.accessToken, cookieOptionsAccess);
    res.cookie("adminRefreshToken", tokens.refreshToken, cookieOptionsRefresh);

    res.status(200).json({
      sessionId,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/logout
export const logoutAdmin = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const admin = await Admin.findById(req.adminId);

    if (admin && sessionId) {
      admin.sessions = admin.sessions.filter((s) => s.sessionId !== sessionId);
      await admin.save();
    }

    res.clearCookie("adminAccessToken");
    res.clearCookie("adminRefreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/me
export const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password -sessions");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/settings/game
export const updateGameSettings = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const {
      gameDate,
      gameTime,
      totalTicketLimit,
      ticketPrice,
      websiteStatus,
      bookingStatus,
      callingInterval,
      callingStatus,
    } = req.body;

    if (gameDate !== undefined) admin.gameSettings.gameDate = gameDate;
    if (gameTime !== undefined) admin.gameSettings.gameTime = gameTime;
    if (totalTicketLimit !== undefined) admin.gameSettings.totalTicketLimit = totalTicketLimit;
    if (ticketPrice !== undefined) admin.gameSettings.ticketPrice = ticketPrice;
    if (websiteStatus !== undefined) admin.gameSettings.websiteStatus = websiteStatus;
    if (bookingStatus !== undefined) admin.gameSettings.bookingStatus = bookingStatus;
    if (callingInterval !== undefined) admin.gameSettings.callingInterval = callingInterval;
    if (callingStatus !== undefined) admin.gameSettings.callingStatus = callingStatus;

    await admin.save();
    res.status(200).json({ gameSettings: admin.gameSettings, message: "Game settings updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/settings/dividends
export const updateDividends = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { dividends } = req.body;
    if (dividends && Array.isArray(dividends)) {
      admin.dividends = dividends;
    }

    await admin.save();
    res.status(200).json({ dividends: admin.dividends, message: "Dividends updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/announcement
export const createAnnouncement = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { text, voiceUrl } = req.body;
    if (!text && !voiceUrl) {
      return res.status(400).json({ message: "Text or voice URL required" });
    }

    admin.announcements.push({
      text: text || "",
      voiceUrl: voiceUrl || "",
      isActive: true,
    });

    // Keep only last 10 announcements
    if (admin.announcements.length > 10) {
      admin.announcements = admin.announcements.slice(-10);
    }

    await admin.save();
    res.status(201).json({ announcements: admin.announcements, message: "Announcement created" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/announcement/:id
export const deleteAnnouncement = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { id } = req.params;
    admin.announcements = admin.announcements.filter((a) => a._id.toString() !== id);

    await admin.save();
    res.status(200).json({ announcements: admin.announcements, message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/ticket/book
export const bookTicket = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { ticketId, playerName, playerPhone } = req.body;
    if (!ticketId || !playerName || !playerPhone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if ticket already booked
    const alreadyBooked = admin.bookedTickets.find((t) => t.ticketId === ticketId);
    if (alreadyBooked) {
      return res.status(400).json({ message: "Ticket already booked" });
    }

    // Check ticket limit
    if (admin.bookedTickets.length >= admin.gameSettings.totalTicketLimit) {
      return res.status(400).json({ message: "Ticket limit reached" });
    }

    admin.bookedTickets.push({
      ticketId,
      playerName: playerName.trim(),
      playerPhone: playerPhone.trim(),
    });

    await admin.save();
    res.status(201).json({ bookedTickets: admin.bookedTickets, message: "Ticket booked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/ticket/:ticketId
export const cancelTicket = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { ticketId } = req.params;
    admin.bookedTickets = admin.bookedTickets.filter((t) => t.ticketId !== parseInt(ticketId));

    await admin.save();
    res.status(200).json({ bookedTickets: admin.bookedTickets, message: "Ticket cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/tickets
export const getBookedTickets = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ bookedTickets: admin.bookedTickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/game/shuffle
export const shuffleTickets = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Generate new shuffle seed
    admin.currentGame.shuffleSeed = Math.floor(Math.random() * 1000000);
    await admin.save();

    res.status(200).json({
      shuffleSeed: admin.currentGame.shuffleSeed,
      message: "Tickets shuffled successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/game/start
export const startGame = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { roomId } = req.body;
    
    admin.currentGame.isActive = true;
    admin.currentGame.roomId = roomId || `GAME-${Date.now()}`;
    admin.currentGame.drawnNumbers = [];
    admin.currentGame.startedAt = new Date();

    await admin.save();

    res.status(200).json({
      currentGame: admin.currentGame,
      message: "Game started successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/game/reset
export const resetGame = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.currentGame = {
      isActive: false,
      roomId: "",
      drawnNumbers: [],
      shuffleSeed: 0,
      startedAt: null,
    };
    admin.bookedTickets = [];

    await admin.save();

    res.status(200).json({
      currentGame: admin.currentGame,
      message: "Game reset successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/theme
export const updateTheme = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { name, primaryColor, secondaryColor } = req.body;
    if (name) admin.theme.name = name;
    if (primaryColor) admin.theme.primaryColor = primaryColor;
    if (secondaryColor) admin.theme.secondaryColor = secondaryColor;

    await admin.save();
    res.status(200).json({ theme: admin.theme, message: "Theme updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/info
export const updateAdminInfo = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { phone, email, whatsappGroupLink } = req.body;
    if (phone) admin.phone = phone.trim();
    if (email) admin.email = email.trim().toLowerCase();
    if (whatsappGroupLink) admin.whatsappGroupLink = whatsappGroupLink;

    await admin.save();
    res.status(200).json({
      admin: {
        phone: admin.phone,
        email: admin.email,
        whatsappGroupLink: admin.whatsappGroupLink,
      },
      message: "Admin info updated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password -sessions");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      gameSettings: admin.gameSettings,
      dividends: admin.dividends,
      announcements: admin.announcements.filter((a) => a.isActive),
      currentGame: admin.currentGame,
      bookedTickets: admin.bookedTickets,
      stats: {
        totalBookedTickets: admin.bookedTickets.length,
        totalTicketLimit: admin.gameSettings.totalTicketLimit,
        availableTickets: admin.gameSettings.totalTicketLimit - admin.bookedTickets.length,
      },
      theme: admin.theme,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if admin exists (public route)
export const checkAdminExists = async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    res.status(200).json({ exists: !!admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ USER MANAGEMENT ============

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password -sessions");
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log the action
    const admin = await Admin.findById(req.adminId);
    if (admin) {
      if (!admin.systemLogs) admin.systemLogs = [];
      admin.systemLogs.push({
        action: "DELETE_USER",
        details: `Deleted user: ${user.name} (${user.phone})`,
        timestamp: new Date(),
      });
      if (admin.systemLogs.length > 100) {
        admin.systemLogs = admin.systemLogs.slice(-100);
      }
      await admin.save();
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/users/:id/role
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!["user", "host"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password -sessions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ user, message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ ROOM MANAGEMENT ============

// GET /api/admin/rooms
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).populate("host", "name phone").sort({ createdAt: -1 });
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/rooms/:id
export const getRoomDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate("host", "name phone");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // Log the action
    const admin = await Admin.findById(req.adminId);
    if (admin) {
      if (!admin.systemLogs) admin.systemLogs = [];
      admin.systemLogs.push({
        action: "DELETE_ROOM",
        details: `Deleted room: ${room.roomid} (Public ID: ${room.publicId})`,
        timestamp: new Date(),
      });
      if (admin.systemLogs.length > 100) {
        admin.systemLogs = admin.systemLogs.slice(-100);
      }
      await admin.save();
    }
    
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/rooms/:id/end
export const forceEndRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    room.isCompleted = true;
    room.isOngoing = false;
    room.finishTime = new Date().toISOString();
    await room.save();
    
    res.status(200).json({ room, message: "Room ended successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ SYSTEM LOGS ============

// GET /api/admin/logs
export const getSystemLogs = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const logs = admin.systemLogs || [];
    res.status(200).json({ logs: logs.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/logs
export const addSystemLog = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const { action, details } = req.body;
    if (!admin.systemLogs) admin.systemLogs = [];
    
    admin.systemLogs.push({
      action: action || "CUSTOM",
      details: details || "",
      timestamp: new Date(),
    });
    
    if (admin.systemLogs.length > 100) {
      admin.systemLogs = admin.systemLogs.slice(-100);
    }
    
    await admin.save();
    res.status(201).json({ logs: admin.systemLogs.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/logs
export const clearSystemLogs = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    admin.systemLogs = [];
    await admin.save();
    
    res.status(200).json({ message: "Logs cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ STATISTICS ============

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({ isOngoing: true, isCompleted: false });
    const completedRooms = await Room.countDocuments({ isCompleted: true });
    const hostUsers = await User.countDocuments({ role: "host" });
    
    res.status(200).json({
      stats: {
        totalUsers,
        hostUsers,
        regularUsers: totalUsers - hostUsers,
        totalRooms,
        activeRooms,
        completedRooms,
        totalBookedTickets: admin.bookedTickets?.length || 0,
        ticketLimit: admin.gameSettings?.totalTicketLimit || 0,
        gameActive: admin.currentGame?.isActive || false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ BULK OPERATIONS ============

// POST /api/admin/bulk/clear-rooms
export const clearAllRooms = async (req, res) => {
  try {
    const { onlyCompleted } = req.body;
    
    let query = {};
    if (onlyCompleted) {
      query = { isCompleted: true };
    }
    
    const result = await Room.deleteMany(query);
    
    // Log the action
    const admin = await Admin.findById(req.adminId);
    if (admin) {
      if (!admin.systemLogs) admin.systemLogs = [];
      admin.systemLogs.push({
        action: "BULK_DELETE_ROOMS",
        details: `Deleted ${result.deletedCount} rooms${onlyCompleted ? " (completed only)" : ""}`,
        timestamp: new Date(),
      });
      await admin.save();
    }
    
    res.status(200).json({ 
      message: `Deleted ${result.deletedCount} rooms`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/bulk/clear-tickets
export const clearAllTickets = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const count = admin.bookedTickets?.length || 0;
    admin.bookedTickets = [];
    
    if (!admin.systemLogs) admin.systemLogs = [];
    admin.systemLogs.push({
      action: "CLEAR_ALL_TICKETS",
      details: `Cleared ${count} booked tickets`,
      timestamp: new Date(),
    });
    
    await admin.save();
    
    res.status(200).json({ 
      message: `Cleared ${count} tickets`,
      clearedCount: count 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/export/tickets
export const exportTickets = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const tickets = admin.bookedTickets || [];
    const csvData = [
      ["Ticket ID", "Player Name", "Phone", "Booked At"],
      ...tickets.map((t) => [
        t.ticketId,
        t.playerName,
        t.playerPhone,
        t.bookedAt ? new Date(t.bookedAt).toISOString() : "",
      ]),
    ];
    
    res.status(200).json({ 
      tickets,
      csv: csvData.map((row) => row.join(",")).join("\n"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from cookies or authorization header
    let token = req.cookies?.adminAccessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    if (!decoded.id || decoded.role !== "admin") {
      return res.status(401).json({ message: "Invalid admin token" });
    }

    // Verify admin exists and session is valid
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // Check if session exists
    const sessionExists = admin.sessions.some(
      (s) => s.sessionId === decoded.sessionId
    );
    if (!sessionExists) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    req.adminId = decoded.id;
    req.adminSessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please refresh." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};

export default authenticateAdmin;

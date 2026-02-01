// import Host from "../models/host.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  cookieOptionsAccess,
  cookieOptionsRefresh,
  clearCookieOptions,
  createTokens,
} from "../utils/auth.utils.js";
import { v4 as uuidv4 } from "uuid";

// /api/user/register
export const createUser = async (req, res) => {
  try {
    // destructure body and trim inputs
    let { name, phone, password } = req.body;
    phone = phone.toString().trim();
    password = password.toString().trim();
    name = name.toString().trim();

    //validation
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    } else if (phone.length !== 10) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits" });
    } else if (password.length < 6 || password.length > 20) {
      return res
        .status(400)
        .json({ message: "Password must be between 6 to 20 characters" });
    } else if (name.length < 3 || name.length > 20) {
      return res
        .status(400)
        .json({ message: "Name must be between 3 to 20 characters" });
    }

    // check if user already exists (phone is unique)
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone is already register" });
    }

    // getting sessionId
    const sessionId = uuidv4();

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      phone,
      password: hashedPassword,
      sessions: [{ sessionId }],
    });

    // check session limit
    if (user.sessions.length > 5) {
      // Sort by createdAt, keep latest 4
      user.sessions.sort((a, b) => b.createdAt - a.createdAt);
      user.sessions = user.sessions.slice(0, 5); // keep only 5 latest
    }

    // save user
    await user.save();

    // generate JWT token
    const tokens = createTokens(user._id.toString(), sessionId);

    res.cookie("accessToken", tokens.accessToken, cookieOptionsAccess);
    res.cookie("refreshToken", tokens.refreshToken, cookieOptionsRefresh);

    // sending response with tokens and sessionId
    res.status(200).json({
      sessionId,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// /api/user/login
export const loginUser = async (req, res) => {
  try {
    // destructure body and trim inputs
    let { phone, password } = req.body;
    phone = phone.toString().trim();
    password = password.toString().trim();

    //validation
    if (!phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    } else if (phone.length !== 10) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits" });
    } else if (password.length < 6 || password.length > 20) {
      return res
        .status(400)
        .json({ message: "Password must be between 6 to 20 characters" });
    }

    // check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not registered" });
    }
    // check if password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // getting sessionId and adding to user sessions
    const sessionId = uuidv4();
    user.sessions.push({ sessionId });

    if (user.sessions.length > 5) {
      // Sort by createdAt, keep latest 4
      user.sessions.sort((a, b) => b.createdAt - a.createdAt);
      user.sessions = user.sessions.slice(0, 5); // keep only 5 latest
    }
    await user.save();

    // generate JWT token
    const tokens = createTokens(user._id.toString(), sessionId);

    // sending response with tokens and sessionId
    res.cookie("accessToken", tokens.accessToken, cookieOptionsAccess);
    res.cookie("refreshToken", tokens.refreshToken, cookieOptionsRefresh);
    res.status(200).json({
      sessionId,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      message: "User logged in successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// /api/user/change-role
export const changeRole = async (req, res) => {
  let { role } = req.body;
  role = role.toString().trim();
  try {
    const user = await User.findById(req.userId).select("-password -sessions ");

    if (!user) {
      // send user for login
      return res.status(401).json({ message: "User not found" });
    }
    if (role === "host" && user.role !== "host") {
      user.role = "host";
    } else if (role === "user" && user.role !== "user") {
      user.role = "user";
    } else if (role !== "user" && role !== "host") {
      // send user for login
      return res.status(401).json({ message: "Invalid role" });
    }
    await user.save();

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      message: "User role changed successfully",
    });
  } catch (error) {
    console.error("Error changing user role:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// /api/user/tokens
export async function refreshToken(req, res) {
  // destructure body and validate inputs
  const { refreshToken, sessionId } = req.body;
  if (!refreshToken || !sessionId) {
    return res
      .status(400)
      .json({ message: "Refresh token and session ID are required" });
  }

  try {
    // verify refresh token and check session ID
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (payload.sid !== sessionId) throw new Error();

    // find user by ID (extracted id from payload) and check if session exists
    const user = await User.findById(payload.sub);
    const session = user.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return res.status(403).json({ message: "Invalid session" });

    // generate new tokens
    const tokens = createTokens(user._id.toString(), sessionId);

    // send new tokens and session ID in response
    res.json({ ...tokens, sessionId, id: user._id });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
}

// /api/user/me
export async function getUser(req, res) {
  const user = await User.findById(req.userId).select("-password -sessions");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

// /api/user/get-invites
export async function getInvites(req, res) {
  try {
    const user = await User.findById(req.userId).select("invites -_id");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.invites.length === 0) {
      return res.status(200).json({ invites: [], message: "No invites found" });
    }
    res
      .status(200)
      .json({ invites: user.invites, message: "Invites fetched successfully" });
  } catch (error) {
    console.error("Error fetching invites:", error.message);
    res.status(500).json({ message: error.message });
  }
}

export async function logoutSession(req, res) {
  const { sessionId } = req.body;
  const user = await User.findById(req.userId);
  user.sessions = user.sessions.filter((s) => s.sessionId !== sessionId);
  await user.save();
  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);
  res.json({ message: "Logged out successfully" });
}

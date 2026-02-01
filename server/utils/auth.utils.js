import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export function createTokens(userId, sessionId) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY,
  });
  const refreshToken = jwt.sign(
    { sub: userId, sid: sessionId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const id = decoded.sub;
    return id;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const id = decoded.sub;
    return id;
  } catch {
    return null;
  }
}

export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY,
  });
}

export const cookieOptionsAccess = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 1 * 60 * 1000, // 1 minute
  sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
};
export const cookieOptionsRefresh = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
};

// Cookie options for clearing cookies (without maxAge to avoid deprecation warning)
export const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
};

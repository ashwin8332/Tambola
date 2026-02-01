import jwt from "jsonwebtoken";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  cookieOptionsAccess,
} from "../utils/auth.utils.js";

export default function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export const authenticateOptimized = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.cookies.accessToken;
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Access token missing" });
  } else if (!accessToken && refreshToken) {
    const userData = verifyRefreshToken(refreshToken);

    if (!userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const tokens = {
      accessToken: generateAccessToken(userData),
    };
    res.cookie("accessToken", tokens.accessToken, cookieOptionsAccess);
    req.userId = userData;
  } else {
    const userData = verifyAccessToken(accessToken);

    if (!userData) {
      return res.status(403).json({ message: "Invalid access token" });
    }
    req.userId = userData;
  }
  next();
};

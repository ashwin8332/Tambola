import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export default function authorizeRoles(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header) return res.status(401).json({ message: 'No token provided' });

      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const userId = decoded.sub;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: Insufficient role' });
      }

      req.userId = userId;
    //   req.user = user; 
      next();
    } catch (err) {
      console.error('Role check failed:', err);
      return res.status(401).json({ message: 'Invalid token or user' });
    }
  };
}

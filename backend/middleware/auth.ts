import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'studyshare-secret-key';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role?: string };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token 无效' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: '未登录' });
  const { usersRepository } = await import('../repositories/users');
  const user = await usersRepository.findById(req.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '权限不足' });
  }
  req.user.role = user.role;
  next();
};

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { usersRepository } from '../repositories/users';
import { signupSchema, loginSchema } from '../db/schema';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'studyshare-secret-key';

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const { name, email, password } = parsed.data;
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: '该邮箱已被注册' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await usersRepository.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, membershipType: user.membershipType },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, membershipType: user.membershipType },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    const user = await usersRepository.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    return res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, membershipType: user.membershipType, major: user.major, department: user.department, graduationYear: user.graduationYear, downloadCountToday: user.downloadCountToday, downloadResetDate: user.downloadResetDate },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token 无效' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { name, major, department, graduationYear } = req.body;
    const updated = await usersRepository.update(decoded.userId, { name, major, department, graduationYear });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token 无效' });
  }
});

export default router;

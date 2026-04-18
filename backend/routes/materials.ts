import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import {
  materialsRepository,
  reviewsRepository,
  bookmarksRepository,
  downloadsRepository,
  reportsRepository,
} from '../repositories/materials';
import { usersRepository } from '../repositories/users';
import { insertMaterialSchema, insertReviewSchema, insertReportSchema } from '../db/schema';

const router = Router();

// GET /api/materials - list with search/filter/pagination
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, type, department, minRating, sort, page, limit } = req.query;
    const result = await materialsRepository.findAll({
      search: search as string,
      type: type as string,
      department: department as string,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      sort: sort as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/materials/trending
router.get('/trending', async (_req: AuthRequest, res: Response) => {
  try {
    const items = await materialsRepository.findTrending();
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/materials/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const material = await materialsRepository.findById(id);
    if (!material) return res.status(404).json({ success: false, message: '资料不存在' });
    return res.json({ success: true, data: material });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/materials - upload
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await usersRepository.findById(req.user!.id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    const parsed = insertMaterialSchema.safeParse({
      ...req.body,
      uploaderId: user.id,
      uploaderName: user.name,
    });
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const material = await materialsRepository.create(parsed.data);
    return res.status(201).json({ success: true, data: material });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const material = await materialsRepository.findById(id);
    if (!material) return res.status(404).json({ success: false, message: '资料不存在' });
    const user = await usersRepository.findById(req.user!.id);
    if (material.uploaderId !== req.user!.id && user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    await materialsRepository.delete(id);
    return res.json({ success: true, data: null });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/materials/:id/download
router.post('/:id/download', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const user = await usersRepository.findById(req.user!.id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    // Check daily limit for free users
    if (user.membershipType === 'free') {
      const today = new Date().toISOString().split('T')[0];
      const count = user.downloadResetDate === today ? (user.downloadCountToday || 0) : 0;
      if (count >= 10) {
        return res.status(429).json({ success: false, message: '今日免费下载额度已用尽，请升级会员' });
      }
    }

    const material = await materialsRepository.findById(id);
    if (!material) return res.status(404).json({ success: false, message: '资料不存在' });

    await Promise.all([
      materialsRepository.incrementDownload(id),
      usersRepository.incrementDownloadCount(user.id),
      downloadsRepository.create({ userId: user.id, materialId: id, materialTitle: material.title }),
    ]);

    return res.json({ success: true, data: { fileUrl: material.fileUrl } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/materials/:id/reviews
router.get('/:id/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const items = await reviewsRepository.findByMaterial(id);
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/materials/:id/reviews
router.post('/:id/reviews', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const materialId = parseInt(req.params.id as string);
    const user = await usersRepository.findById(req.user!.id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const existing = await reviewsRepository.findByUserAndMaterial(user.id, materialId);
    if (existing) return res.status(409).json({ success: false, message: '您已评价过该资料' });

    const parsed = insertReviewSchema.safeParse({ ...req.body, materialId, userId: user.id, userName: user.name });
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const review = await reviewsRepository.create(parsed.data);
    await materialsRepository.updateRating(materialId);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/materials/:id/report
router.post('/:id/report', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const materialId = parseInt(req.params.id as string);
    const parsed = insertReportSchema.safeParse({ ...req.body, materialId, reporterId: req.user!.id });
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const report = await reportsRepository.create(parsed.data);
    await materialsRepository.update(materialId, { status: 'flagged' });
    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/materials/user/bookmarks
router.get('/user/bookmarks', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const items = await bookmarksRepository.findByUser(req.user!.id);
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/materials/:id/bookmark
router.post('/:id/bookmark', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const materialId = parseInt(req.params.id as string);
    const result = await bookmarksRepository.toggle(req.user!.id, materialId);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/materials/user/downloads
router.get('/user/downloads', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const items = await downloadsRepository.findByUser(req.user!.id);
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/materials/user/uploads
router.get('/user/uploads', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const items = await materialsRepository.findByUploader(req.user!.id);
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;

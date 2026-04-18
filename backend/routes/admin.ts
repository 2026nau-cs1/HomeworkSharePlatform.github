import { Router, Response } from 'express';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth';
import { materialsRepository, reportsRepository } from '../repositories/materials';

const router = Router();

// GET /api/admin/flagged - flagged materials
router.get('/flagged', authenticateJWT, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const items = await materialsRepository.findFlagged();
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/admin/pending - pending materials
router.get('/pending', authenticateJWT, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const items = await materialsRepository.findPending();
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/admin/reports
router.get('/reports', authenticateJWT, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const items = await reportsRepository.findAll();
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/admin/materials/:id/status
router.put('/materials/:id/status', authenticateJWT, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效状态' });
    }
    const updated = await materialsRepository.update(id, { status });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/admin/reports/:id/status
router.put('/reports/:id/status', authenticateJWT, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    const updated = await reportsRepository.updateStatus(id, status);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;

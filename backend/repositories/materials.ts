import { eq, desc, ilike, and, or, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  materials, reviews, bookmarks, downloads, reports,
  type Material, type InsertMaterial, type Review, type InsertReview,
  type Bookmark, type Download, type InsertDownload, type Report, type InsertReport,
  insertMaterialSchema, insertReviewSchema, insertReportSchema,
} from '../db/schema';
import { z } from 'zod';

export const materialsRepository = {
  async findAll(opts: {
    search?: string;
    type?: string;
    department?: string;
    minRating?: number;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: Material[]; total: number }> {
    const { search, type, department, minRating, sort = 'newest', page = 1, limit = 10 } = opts;
    const offset = (page - 1) * limit;

    const conditions = [eq(materials.status, 'approved')];
    if (search) {
      conditions.push(
        or(
          ilike(materials.title, `%${search}%`),
          ilike(materials.courseCode, `%${search}%`),
          ilike(materials.department, `%${search}%`)
        )!
      );
    }
    if (type) conditions.push(eq(materials.type, type));
    if (department) conditions.push(eq(materials.department, department));
    if (minRating) {
      conditions.push(sql`CAST(${materials.averageRating} AS DECIMAL) >= ${minRating}`);
    }

    const whereClause = and(...conditions);

    let orderBy;
    if (sort === 'rating') orderBy = desc(materials.averageRating);
    else if (sort === 'downloads') orderBy = desc(materials.downloadCount);
    else orderBy = desc(materials.createdAt);

    const [items, countResult] = await Promise.all([
      db.select().from(materials).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(materials).where(whereClause),
    ]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  },

  async findTrending(): Promise<Material[]> {
    return db.select().from(materials)
      .where(and(eq(materials.status, 'approved'), eq(materials.isTrending, true)))
      .orderBy(desc(materials.downloadCount))
      .limit(3);
  },

  async findById(id: number): Promise<Material | undefined> {
    const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    return result[0];
  },

  async findByUploader(uploaderId: number): Promise<Material[]> {
    return db.select().from(materials)
      .where(eq(materials.uploaderId, uploaderId))
      .orderBy(desc(materials.createdAt));
  },

  async findByCourseCodeAndTitle(courseCode: string, title: string): Promise<Material | undefined> {
    const result = await db.select().from(materials)
      .where(and(eq(materials.courseCode, courseCode), eq(materials.title, title)))
      .limit(1);
    return result[0];
  },

  async create(data: z.infer<typeof insertMaterialSchema>): Promise<Material> {
    await db.insert(materials).values(data as InsertMaterial);
    // MySQL 不支持 returning，查询刚插入的记录
    const inserted = await this.findByCourseCodeAndTitle(data.courseCode, data.title);
    if (!inserted) {
      throw new Error('Failed to create material');
    }
    return inserted;
  },

  async update(id: number, data: Partial<InsertMaterial>): Promise<Material | undefined> {
    await db.update(materials).set({ ...data, updatedAt: new Date() }).where(eq(materials.id, id));
    return this.findById(id);
  },

  async delete(id: number): Promise<boolean> {
    const material = await this.findById(id);
    if (!material) return false;
    await db.delete(materials).where(eq(materials.id, id));
    return true;
  },

  async incrementDownload(id: number): Promise<void> {
    await db.update(materials).set({ downloadCount: sql`${materials.downloadCount} + 1` }).where(eq(materials.id, id));
  },

  async updateRating(materialId: number): Promise<void> {
    const result = await db.select({
      avg: sql<string>`AVG(CAST(${reviews.rating} AS DECIMAL))`,
      count: sql<number>`COUNT(*)`,
    }).from(reviews).where(eq(reviews.materialId, materialId));
    const avg = parseFloat(result[0]?.avg ?? '0');
    const count = Number(result[0]?.count ?? 0);
    await db.update(materials).set({
      averageRating: avg.toFixed(2),
      ratingCount: count,
    }).where(eq(materials.id, materialId));
  },

  async findFlagged(): Promise<Material[]> {
    return db.select().from(materials)
      .where(eq(materials.status, 'flagged'))
      .orderBy(desc(materials.createdAt));
  },

  async findPending(): Promise<Material[]> {
    return db.select().from(materials)
      .where(eq(materials.status, 'pending'))
      .orderBy(desc(materials.createdAt));
  },
};

export const reviewsRepository = {
  async findByMaterial(materialId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.materialId, materialId)).orderBy(desc(reviews.createdAt));
  },

  async create(data: z.infer<typeof insertReviewSchema>): Promise<Review> {
    await db.insert(reviews).values(data as InsertReview);
    // 查询刚插入的评论
    const inserted = await this.findByUserAndMaterial(data.userId, data.materialId);
    if (!inserted) {
      throw new Error('Failed to create review');
    }
    return inserted;
  },

  async findByUserAndMaterial(userId: number, materialId: number): Promise<Review | undefined> {
    const result = await db.select().from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.materialId, materialId)))
      .limit(1);
    return result[0];
  },
};

export const bookmarksRepository = {
  async findByUser(userId: number): Promise<(Bookmark & { material: Material | undefined })[]> {
    const bms = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
    const result = await Promise.all(bms.map(async (bm) => {
      const mat = await db.select().from(materials).where(eq(materials.id, bm.materialId)).limit(1);
      return { ...bm, material: mat[0] };
    }));
    return result;
  },

  async toggle(userId: number, materialId: number): Promise<{ bookmarked: boolean }> {
    const existing = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)))
      .limit(1);
    if (existing.length > 0) {
      await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)));
      return { bookmarked: false };
    } else {
      await db.insert(bookmarks).values({ userId, materialId });
      return { bookmarked: true };
    }
  },

  async isBookmarked(userId: number, materialId: number): Promise<boolean> {
    const result = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)))
      .limit(1);
    return result.length > 0;
  },

  async findMaterialIdsByUser(userId: number): Promise<number[]> {
    const bms = await db.select({ materialId: bookmarks.materialId }).from(bookmarks).where(eq(bookmarks.userId, userId));
    return bms.map((b) => b.materialId);
  },
};

export const downloadsRepository = {
  async findByUser(userId: number): Promise<Download[]> {
    return db.select().from(downloads).where(eq(downloads.userId, userId)).orderBy(desc(downloads.createdAt));
  },

  async create(data: { userId: number; materialId: number; materialTitle: string }): Promise<Download> {
    await db.insert(downloads).values(data as InsertDownload);
    // 查询刚插入的下载记录
    const inserted = await this.findByUserAndMaterial(data.userId, data.materialId);
    if (!inserted) {
      throw new Error('Failed to create download record');
    }
    return inserted;
  },

  async findByUserAndMaterial(userId: number, materialId: number): Promise<Download | undefined> {
    const result = await db.select().from(downloads)
      .where(and(eq(downloads.userId, userId), eq(downloads.materialId, materialId)))
      .orderBy(desc(downloads.createdAt))
      .limit(1);
    return result[0];
  },
};

export const reportsRepository = {
  async findAll(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  },

  async create(data: z.infer<typeof insertReportSchema>): Promise<Report> {
    await db.insert(reports).values(data as InsertReport);
    // 查询刚插入的举报记录  
    const inserted = await this.findById(data.materialId);
    if (!inserted) {
      throw new Error('Failed to create report');
    }
    return inserted;
  },

  async findById(materialId: number): Promise<Report | undefined> {
    const result = await db.select().from(reports)
      .where(eq(reports.materialId, materialId))
      .orderBy(desc(reports.createdAt))
      .limit(1);
    return result[0];
  },

  async updateStatus(id: number, status: string): Promise<Report | undefined> {
    await db.update(reports).set({ status }).where(eq(reports.id, id));
    return this.findById(id);
  },
};

import { mysqlTable, varchar, text, timestamp, int, decimal, boolean } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable('Users', {
  id: int('id').autoincrement().primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: text('password').notNull(),
  major: varchar('major', { length: 255 }),
  department: varchar('department', { length: 255 }),
  graduationYear: int('graduation_year'),
  role: varchar('role', { length: 50 }).notNull().default('student'), // 'student' | 'admin'
  membershipType: varchar('membership_type', { length: 50 }).notNull().default('free'), // 'free' | 'premium'
  downloadCountToday: int('download_count_today').notNull().default(0),
  downloadResetDate: varchar('download_reset_date', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  major: z.string().optional(),
  department: z.string().optional(),
  graduationYear: z.coerce.number().int().optional(),
  role: z.enum(['student', 'admin']).optional(),
  membershipType: z.enum(['free', 'premium']).optional(),
});

export const signupSchema = insertUserSchema
  .pick({ name: true, email: true, password: true })
  .extend({ confirmPassword: z.string().min(6, '确认密码至少6位') })
  .refine((d) => d.password === d.confirmPassword, {
    message: '两次密码不一致',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Materials ───────────────────────────────────────────────────────────────
export const materials = mysqlTable('Materials', {
  id: int('id').autoincrement().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  courseCode: varchar('course_code', { length: 50 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'notes' | 'exam' | 'guide' | 'slides'
  fileFormat: varchar('file_format', { length: 20 }).notNull(), // 'PDF' | 'DOCX' | 'PPTX'
  fileUrl: text('file_url'),
  fileSize: varchar('file_size', { length: 50 }),
  uploaderId: int('uploader_id').notNull(),
  uploaderName: varchar('uploader_name', { length: 255 }).notNull(),
  semester: varchar('semester', { length: 100 }),
  professor: varchar('professor', { length: 100 }),
  downloadCount: int('download_count').notNull().default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
  ratingCount: int('rating_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('approved'), // 'pending' | 'approved' | 'rejected' | 'flagged'
  isTrending: boolean('is_trending').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertMaterialSchema = createInsertSchema(materials, {
  title: z.string().min(1, '标题不能为空'),
  courseCode: z.string().min(1, '课程代码不能为空'),
  department: z.string().min(1, '院系不能为空'),
  type: z.enum(['notes', 'exam', 'guide', 'slides']),
  fileFormat: z.enum(['PDF', 'DOCX', 'PPTX']),
  description: z.string().optional(),
  semester: z.string().optional(),
  professor: z.string().optional(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviews = mysqlTable('Reviews', {
  id: int('id').autoincrement().primaryKey(),
  materialId: int('material_id').notNull(),
  userId: int('user_id').notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  rating: int('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Bookmarks ───────────────────────────────────────────────────────────────
export const bookmarks = mysqlTable('Bookmarks', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  materialId: int('material_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// ─── Downloads ───────────────────────────────────────────────────────────────
export const downloads = mysqlTable('Downloads', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  materialId: int('material_id').notNull(),
  materialTitle: text('material_title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Download = typeof downloads.$inferSelect;
export type InsertDownload = typeof downloads.$inferInsert;

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reports = mysqlTable('Reports', {
  id: int('id').autoincrement().primaryKey(),
  materialId: int('material_id').notNull(),
  reporterId: int('reporter_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports, {
  reason: z.string().min(1, '请选择举报原因'),
  description: z.string().optional(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

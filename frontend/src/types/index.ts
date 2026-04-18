export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  membershipType: 'free' | 'premium';
  major?: string;
  department?: string;
  graduationYear?: number;
  downloadCountToday?: number;
  downloadResetDate?: string;
}

export interface Material {
  id: number;
  title: string;
  description?: string;
  courseCode: string;
  department: string;
  type: 'notes' | 'exam' | 'guide' | 'slides';
  fileFormat: 'PDF' | 'DOCX' | 'PPTX';
  fileUrl?: string;
  fileSize?: string;
  uploaderId: number;
  uploaderName: string;
  semester?: string;
  professor?: string;
  downloadCount: number;
  averageRating: string;
  ratingCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  materialId: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Bookmark {
  id: number;
  userId: number;
  materialId: number;
  createdAt: string;
  material?: Material;
}

export interface Download {
  id: number;
  userId: number;
  materialId: number;
  materialTitle: string;
  createdAt: string;
}

export interface Report {
  id: number;
  materialId: number;
  reporterId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export type MaterialType = 'notes' | 'exam' | 'guide' | 'slides';
export type SortOption = 'newest' | 'rating' | 'downloads';

export const DEPARTMENTS = [
  '计算机科学',
  '数学与统计',
  '经济与管理',
  '物理与工程',
  '外国语言文学',
  '化学与生命科学',
  '法学院',
  '建筑与设计',
  '医学院',
  '艺术学院',
] as const;

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  notes: '课堂笔记',
  exam: '历年真题',
  guide: '学习指南',
  slides: 'PPT 课件',
};

export const DEPARTMENT_COUNTS: Record<string, number> = {
  '计算机科学': 4821,
  '数学与统计': 3204,
  '经济与管理': 2987,
  '物理与工程': 2156,
  '外国语言文学': 1893,
  '化学与生命科学': 1540,
  '法学院': 1102,
  '建筑与设计': 876,
  '医学院': 743,
  '艺术学院': 521,
};

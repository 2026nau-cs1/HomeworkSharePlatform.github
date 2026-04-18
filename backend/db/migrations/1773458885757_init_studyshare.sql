-- StudyShare Initial Migration

CREATE TABLE IF NOT EXISTS "Users" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "major" text,
  "department" text,
  "graduation_year" integer,
  "role" text NOT NULL DEFAULT 'student',
  "membership_type" text NOT NULL DEFAULT 'free',
  "download_count_today" integer NOT NULL DEFAULT 0,
  "download_reset_date" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE "Users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('student', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_membership_check'
  ) THEN
    ALTER TABLE "Users" ADD CONSTRAINT "users_membership_check" CHECK ("membership_type" IN ('free', 'premium'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Materials" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "course_code" text NOT NULL,
  "department" text NOT NULL,
  "type" text NOT NULL,
  "file_format" text NOT NULL DEFAULT 'PDF',
  "file_url" text,
  "file_size" text,
  "uploader_id" integer NOT NULL,
  "uploader_name" text NOT NULL,
  "semester" text,
  "professor" text,
  "download_count" integer NOT NULL DEFAULT 0,
  "average_rating" decimal(3,2) DEFAULT 0,
  "rating_count" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'approved',
  "is_trending" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Reviews" (
  "id" serial PRIMARY KEY,
  "material_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "user_name" text NOT NULL,
  "rating" integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Bookmarks" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "material_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("user_id", "material_id")
);

CREATE TABLE IF NOT EXISTS "Downloads" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "material_id" integer NOT NULL,
  "material_title" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Reports" (
  "id" serial PRIMARY KEY,
  "material_id" integer NOT NULL,
  "reporter_id" integer NOT NULL,
  "reason" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Seed some sample materials
INSERT INTO "Materials" ("title", "description", "course_code", "department", "type", "file_format", "uploader_id", "uploader_name", "semester", "professor", "download_count", "average_rating", "rating_count", "status", "is_trending")
VALUES
  ('数据结构与算法完整笔记（2024秋）', '涵盖数组、链表、树、图等核心数据结构，附算法复杂度分析', 'CS201', '计算机科学', 'notes', 'PDF', 1, '李明同学', '2024秋季', '王教授', 2341, 4.90, 128, 'approved', true),
  ('高等数学期末真题汇编 2019-2024', '近五年期末真题合集，含详细解析步骤', 'MATH101', '数学与统计', 'exam', 'PDF', 1, '张悦同学', '2023-2024学年', '陈教授', 1987, 4.80, 96, 'approved', true),
  ('微观经济学核心概念学习指南', '供需分析、市场结构、博弈论等核心概念梳理', 'ECON201', '经济与管理', 'guide', 'DOCX', 1, '王芳同学', '2024春季', '刘教授', 1654, 4.60, 74, 'approved', true),
  ('操作系统原理 — 进程管理与内存调度详细笔记', '进程调度算法、内存分页、虚拟内存详细讲解', 'CS301', '计算机科学', 'notes', 'PDF', 1, '李明同学', '2024秋季', '王教授', 847, 4.90, 52, 'approved', false),
  ('线性代数期中期末真题合集（含详细解析）', '矩阵运算、特征值、线性变换真题及解析', 'MATH202', '数学与统计', 'exam', 'PDF', 1, '张悦同学', '2023-2024学年', '陈教授', 1203, 4.80, 61, 'approved', false),
  ('大学英语四级备考完整指南 — 词汇+阅读+写作', '系统备考方案，附模拟题和高频词汇表', 'ENG101', '外国语言文学', 'guide', 'DOCX', 1, '王芳同学', '2025年6月', '李教授', 432, 4.50, 38, 'approved', false),
  ('量子力学基础 PPT 课件全集', '波函数、薛定谔方程、量子态完整课件', 'PHYS301', '物理与工程', 'slides', 'PPTX', 1, '赵强同学', '2024秋季', '张教授', 678, 4.70, 45, 'approved', false),
  ('公司法核心知识点梳理', '公司设立、股权结构、董事责任等重点整理', 'LAW201', '法学院', 'notes', 'PDF', 1, '陈静同学', '2024春季', '吴教授', 321, 4.40, 29, 'approved', false),
  ('有机化学反应机理总结', '亲核取代、消除反应、加成反应机理图解', 'CHEM201', '化学与生命科学', 'guide', 'PDF', 1, '刘洋同学', '2024秋季', '周教授', 543, 4.60, 41, 'approved', false),
  ('宏观经济学期末复习笔记', 'GDP、货币政策、财政政策、国际贸易重点', 'ECON301', '经济与管理', 'notes', 'DOCX', 1, '孙磊同学', '2024春季', '刘教授', 892, 4.75, 67, 'approved', false)
ON CONFLICT DO NOTHING;

-- StudyShare Initial Migration (MySQL 8.0)

CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `major` VARCHAR(255),
  `department` VARCHAR(255),
  `graduation_year` INT,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `membership_type` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
  `download_count_today` INT NOT NULL DEFAULT 0,
  `download_reset_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `Materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` TEXT NOT NULL,
  `description` TEXT,
  `course_code` VARCHAR(50) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `file_format` VARCHAR(20) NOT NULL DEFAULT 'PDF',
  `file_url` TEXT,
  `file_size` VARCHAR(50),
  `uploader_id` INT NOT NULL,
  `uploader_name` VARCHAR(255) NOT NULL,
  `semester` VARCHAR(100),
  `professor` VARCHAR(100),
  `download_count` INT NOT NULL DEFAULT 0,
  `average_rating` DECIMAL(3,2) DEFAULT 0,
  `rating_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  `is_trending` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`uploader_id`) REFERENCES `Users`(`id`)
);

CREATE TABLE IF NOT EXISTS `Reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`material_id`) REFERENCES `Materials`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
);

CREATE TABLE IF NOT EXISTS `Bookmarks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_bookmark (`user_id`, `material_id`),
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`),
  FOREIGN KEY (`material_id`) REFERENCES `Materials`(`id`)
);

CREATE TABLE IF NOT EXISTS `Downloads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `material_title` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`),
  FOREIGN KEY (`material_id`) REFERENCES `Materials`(`id`)
);

CREATE TABLE IF NOT EXISTS `Reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `reporter_id` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `description` TEXT,
  `status` ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`material_id`) REFERENCES `Materials`(`id`),
  FOREIGN KEY (`reporter_id`) REFERENCES `Users`(`id`)
);

-- Seed some sample materials
INSERT INTO `Materials` (`title`, `description`, `course_code`, `department`, `type`, `file_format`, `uploader_id`, `uploader_name`, `semester`, `professor`, `download_count`, `average_rating`, `rating_count`, `status`, `is_trending`)
VALUES
  ('数据结构与算法完整笔记（2024 秋）', '涵盖数组、链表、树、图等核心数据结构，附算法复杂度分析', 'CS201', '计算机科学', 'notes', 'PDF', 1, '李明同学', '2024 秋季', '王教授', 2341, 4.90, 128, 'approved', TRUE),
  ('高等数学期末真题汇编 2019-2024', '近五年期末真题合集，含详细解析步骤', 'MATH101', '数学与统计', 'exam', 'PDF', 1, '张悦同学', '2023-2024 学年', '陈教授', 1987, 4.80, 96, 'approved', TRUE),
  ('微观经济学核心概念学习指南', '供需分析、市场结构、博弈论等核心概念梳理', 'ECON201', '经济与管理', 'guide', 'DOCX', 1, '王芳同学', '2024 春季', '刘教授', 1654, 4.60, 74, 'approved', TRUE),
  ('操作系统原理 — 进程管理与内存调度详细笔记', '进程调度算法、内存分页、虚拟内存详细讲解', 'CS301', '计算机科学', 'notes', 'PDF', 1, '李明同学', '2024 秋季', '王教授', 847, 4.90, 52, 'approved', FALSE),
  ('线性代数期中期末真题合集（含详细解析）', '矩阵运算、特征值、线性变换真题及解析', 'MATH202', '数学与统计', 'exam', 'PDF', 1, '张悦同学', '2023-2024 学年', '陈教授', 1203, 4.80, 61, 'approved', FALSE),
  ('大学英语四级备考完整指南 — 词汇 + 阅读 + 写作', '系统备考方案，附模拟题和高频词汇表', 'ENG101', '外国语言文学', 'guide', 'DOCX', 1, '王芳同学', '2025 年 6 月', '李教授', 432, 4.50, 38, 'approved', FALSE),
  ('量子力学基础 PPT 课件全集', '波函数、薛定谔方程、量子态完整课件', 'PHYS301', '物理与工程', 'slides', 'PPTX', 1, '赵强同学', '2024 秋季', '张教授', 678, 4.70, 45, 'approved', FALSE),
  ('公司法核心知识点梳理', '公司设立、股权结构、董事责任等重点整理', 'LAW201', '法学院', 'notes', 'PDF', 1, '陈静同学', '2024 春季', '吴教授', 321, 4.40, 29, 'approved', FALSE),
  ('有机化学反应机理总结', '亲核取代、消除反应、加成反应机理图解', 'CHEM201', '化学与生命科学', 'guide', 'PDF', 1, '刘洋同学', '2024 秋季', '周教授', 543, 4.60, 41, 'approved', FALSE),
  ('宏观经济学期末复习笔记', 'GDP、货币政策、财政政策、国际贸易重点', 'ECON301', '经济与管理', 'notes', 'DOCX', 1, '孙磊同学', '2024 春季', '刘教授', 892, 4.75, 67, 'approved', FALSE);

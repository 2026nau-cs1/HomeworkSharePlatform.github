-- StudyShare 示例数据插入脚本 (MySQL 8.0)

USE studyshare;

-- 插入示例用户 (密码都是 123456 的 bcrypt 哈希)
INSERT INTO `Users` (`name`, `email`, `password`, `major`, `department`, `graduation_year`, `role`, `membership_type`)
VALUES 
  ('李明', 'liming@example.com', '$2a$10$rH9zqX8FQ7NkIZfT1pZcLe3sKqJvV5xR8yWnU2mKpLdO6tYhGjFwC', '计算机科学', '计算机学院', 2025, 'student', 'free'),
  ('张悦', 'zhangyue@example.com', '$2a$10$rH9zqX8FQ7NkIZfT1pZcLe3sKqJvV5xR8yWnU2mKpLdO6tYhGjFwC', '数学与应用数学', '数学学院', 2024, 'student', 'premium'),
  ('王芳', 'wangfang@example.com', '$2a$10$rH9zqX8FQ7NkIZfT1pZcLe3sKqJvV5xR8yWnU2mKpLdO6tYhGjFwC', '英语', '外国语学院', 2025, 'student', 'free');

-- 插入示例资料
INSERT INTO `Materials` (`title`, `description`, `course_code`, `department`, `type`, `file_format`, `uploader_id`, `uploader_name`, `semester`, `professor`, `download_count`, `average_rating`, `rating_count`, `status`, `is_trending`)
VALUES
  ('数据结构与算法完整笔记（2024 秋）', '涵盖数组、链表、树、图等核心数据结构，附算法复杂度分析', 'CS201', '计算机科学', 'notes', 'PDF', 1, '李明同学', '2024 秋季', '王教授', 2341, 4.90, 128, 'approved', TRUE),
  ('高等数学期末真题汇编 2019-2024', '近五年期末真题合集，含详细解析步骤', 'MATH101', '数学与统计', 'exam', 'PDF', 2, '张悦同学', '2023-2024 学年', '陈教授', 1987, 4.80, 96, 'approved', TRUE),
  ('微观经济学核心概念学习指南', '供需分析、市场结构、博弈论等核心概念梳理', 'ECON201', '经济与管理', 'guide', 'DOCX', 3, '王芳同学', '2024 春季', '刘教授', 1654, 4.60, 74, 'approved', TRUE),
  ('操作系统原理 — 进程管理与内存调度详细笔记', '进程调度算法、内存分页、虚拟内存详细讲解', 'CS301', '计算机科学', 'notes', 'PDF', 1, '李明同学', '2024 秋季', '王教授', 847, 4.90, 52, 'approved', FALSE),
  ('线性代数期中期末真题合集（含详细解析）', '矩阵运算、特征值、线性变换真题及解析', 'MATH202', '数学与统计', 'exam', 'PDF', 2, '张悦同学', '2023-2024 学年', '陈教授', 1203, 4.80, 61, 'approved', FALSE),
  ('大学英语四级备考完整指南 — 词汇 + 阅读 + 写作', '系统备考方案，附模拟题和高频词汇表', 'ENG101', '外国语言文学', 'guide', 'DOCX', 3, '王芳同学', '2025 年 6 月', '李教授', 432, 4.50, 38, 'approved', FALSE),
  ('量子力学基础 PPT 课件全集', '波函数、薛定谔方程、量子态完整课件', 'PHYS301', '物理与工程', 'slides', 'PPTX', 1, '李明同学', '2024 秋季', '张教授', 678, 4.70, 45, 'approved', FALSE),
  ('公司法核心知识点梳理', '公司设立、股权结构、董事责任等重点整理', 'LAW201', '法学院', 'notes', 'PDF', 2, '张悦同学', '2024 春季', '吴教授', 321, 4.40, 29, 'approved', FALSE),
  ('有机化学反应机理总结', '亲核取代、消除反应、加成反应机理图解', 'CHEM201', '化学与生命科学', 'guide', 'PDF', 3, '王芳同学', '2024 秋季', '周教授', 543, 4.60, 41, 'approved', FALSE),
  ('宏观经济学期末复习笔记', 'GDP、货币政策、财政政策、国际贸易重点', 'ECON301', '经济与管理', 'notes', 'DOCX', 1, '李明同学', '2024 春季', '刘教授', 892, 4.75, 67, 'approved', FALSE);

-- 插入一些示例评论
INSERT INTO `Reviews` (`material_id`, `user_id`, `user_name`, `rating`, `comment`)
VALUES
  (1, 2, '张悦同学', 5, '非常详细的笔记，对我帮助很大！'),
  (1, 3, '王芳同学', 5, '内容很全面，推荐！'),
  (2, 1, '李明同学', 5, '题目质量很高，解析也很清楚'),
  (3, 1, '李明同学', 4, '不错的学习资料');

-- 插入一些收藏
INSERT INTO `Bookmarks` (`user_id`, `material_id`)
VALUES
  (1, 1),
  (1, 2),
  (2, 3),
  (3, 1);

-- 插入一些下载记录
INSERT INTO `Downloads` (`user_id`, `material_id`, `material_title`)
VALUES
  (1, 1, '数据结构与算法完整笔记（2024 秋）'),
  (1, 2, '高等数学期末真题汇编 2019-2024'),
  (2, 3, '微观经济学核心概念学习指南'),
  (3, 1, '数据结构与算法完整笔记（2024 秋）');

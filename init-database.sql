-- 创建 studyshare 数据库
CREATE DATABASE IF NOT EXISTS studyshare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE studyshare;

-- 运行迁移脚本
SOURCE backend/db/migrations/mysql_init_studyshare.sql;

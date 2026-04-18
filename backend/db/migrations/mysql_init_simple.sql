-- StudyShare Database Initialization (MySQL 8.0)
-- 创建数据库并导入表结构

CREATE DATABASE IF NOT EXISTS studyshare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE studyshare;

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

-- Braille Learning System - Esquema de base de datos
-- Motor: MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Tabla: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  `password` VARCHAR(255) NOT NULL,
  `created_by` INT DEFAULT NULL,
  `ci` VARCHAR(20) DEFAULT NULL COMMENT 'Cédula o identificación personal',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_username` (`username`),
  KEY `idx_users_role` (`role`),
  CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: face_encodings
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `face_encodings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `face_image` LONGBLOB NOT NULL,
  `face_encoding` JSON NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_face` (`user_id`),
  CONSTRAINT `fk_face_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: lessons
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `difficulty` ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  `priority` TINYINT DEFAULT 1 COMMENT '0=Práctica, 1=Lección, 2=Evaluación, 3=Examen',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_lessons_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: lesson_steps
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `lesson_steps` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lesson_id` VARCHAR(50) NOT NULL,
  `step_index` INT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'input',
  `target` VARCHAR(255) NOT NULL,
  `prompt` TEXT NOT NULL,
  `hint` TEXT,
  `max_attempts` INT DEFAULT 3,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lesson_step` (`lesson_id`,`step_index`),
  CONSTRAINT `fk_steps_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: classes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `teacher_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_classes_teacher` (`teacher_id`),
  CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: class_students
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `class_students` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `class_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_student` (`class_id`,`student_id`),
  CONSTRAINT `fk_cs_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cs_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: class_lessons
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `class_lessons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `class_id` INT NOT NULL,
  `lesson_id` VARCHAR(50) NOT NULL,
  `due_date` TIMESTAMP NULL DEFAULT NULL,
  `assigned_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_lesson` (`class_id`,`lesson_id`),
  CONSTRAINT `fk_cl_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cl_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: sessions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(50) NOT NULL,
  `lesson_id` VARCHAR(50) NOT NULL,
  `user_id` INT NOT NULL,
  `class_id` INT DEFAULT NULL,
  `started_at` BIGINT DEFAULT NULL,
  `finished_at` BIGINT DEFAULT NULL,
  `score` INT DEFAULT 0,
  `completed` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_lesson` (`lesson_id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_class` (`class_id`),
  CONSTRAINT `fk_sessions_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sessions_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: attempts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `attempts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(50) NOT NULL,
  `lesson_id` VARCHAR(50) NOT NULL,
  `user_id` INT NOT NULL,
  `step_index` INT NOT NULL,
  `answer` TEXT,
  `correct` TINYINT(1) DEFAULT 0,
  `attempts` INT DEFAULT 1,
  `ts` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_attempts_session` (`session_id`),
  KEY `idx_attempts_lesson` (`lesson_id`),
  KEY `idx_attempts_user` (`user_id`),
  CONSTRAINT `fk_att_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: student_progress
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `lesson_id` VARCHAR(50) NOT NULL,
  `class_id` INT DEFAULT NULL,
  `completed` TINYINT(1) DEFAULT 0,
  `score` INT DEFAULT 0,
  `attempts` INT DEFAULT 0,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `last_attempt_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_lesson` (`student_id`,`lesson_id`),
  KEY `idx_progress_student` (`student_id`),
  KEY `idx_progress_lesson` (`lesson_id`),
  KEY `idx_progress_class` (`class_id`),
  CONSTRAINT `fk_prog_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prog_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prog_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: devices
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `devices` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `assigned_user_id` INT DEFAULT NULL,
  `last_seen` BIGINT DEFAULT NULL,
  `active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_devices_assigned` (`assigned_user_id`),
  CONSTRAINT `fk_devices_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
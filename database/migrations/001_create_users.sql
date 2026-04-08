-- Migration 001 — Create Users Table
-- Panchakarma Management System v2.0

CREATE TABLE IF NOT EXISTS users (
  id                   CHAR(36)       NOT NULL DEFAULT (UUID()),
  name                 VARCHAR(100)   NOT NULL,
  email                VARCHAR(255)   NOT NULL,
  password             VARCHAR(255)   NOT NULL,
  role                 ENUM('patient','doctor','admin') NOT NULL,
  avatar               VARCHAR(4)     NOT NULL DEFAULT '??',
  avatar_color         VARCHAR(10)    NOT NULL DEFAULT '#2D5016',
  is_active            TINYINT(1)     NOT NULL DEFAULT 1,
  phone                VARCHAR(20),

  -- Patient fields
  patient_code         VARCHAR(20)    UNIQUE,
  dob                  DATE,
  gender               ENUM('Male','Female','Other'),
  dosha                VARCHAR(20),
  blood_group          VARCHAR(5),
  allergies            VARCHAR(255),
  emergency_contact    VARCHAR(20),
  address              VARCHAR(255),
  registered_at        DATE           DEFAULT (CURDATE()),
  registered_by_doctor_id CHAR(36),

  -- Doctor fields
  specialization       VARCHAR(100),
  qualification        VARCHAR(100),
  experience           VARCHAR(50),
  bio                  TEXT,
  rating               DECIMAL(3,2)   DEFAULT 0.00,
  verification_status  ENUM('pending','approved','rejected'),
  rejection_reason     VARCHAR(500),
  applied_at           DATETIME,
  daily_limit          INT            DEFAULT 8,
  work_start           VARCHAR(5)     DEFAULT '09:00',
  work_end             VARCHAR(5)     DEFAULT '18:00',
  working_days         JSON,

  -- Auth
  password_reset_token  VARCHAR(255),
  password_reset_expiry DATETIME,

  -- Timestamps
  created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at           DATETIME,      -- Soft delete

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email        (email),
  UNIQUE KEY uq_users_patient_code (patient_code),
  KEY idx_users_role               (role),
  KEY idx_users_verification       (verification_status),
  KEY idx_users_is_active          (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

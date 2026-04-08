CREATE TABLE IF NOT EXISTS milestones (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  patient_id     CHAR(36)     NOT NULL,
  name           VARCHAR(200) NOT NULL,
  status         ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  pct            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  target_date    DATE,
  completed_date DATE,
  notes          TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_milestones_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_milestones_patient (patient_id),
  KEY idx_milestones_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

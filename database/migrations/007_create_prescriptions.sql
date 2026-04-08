CREATE TABLE IF NOT EXISTS prescriptions (
  id         CHAR(36)  NOT NULL DEFAULT (UUID()),
  patient_id CHAR(36)  NOT NULL,
  doctor_id  CHAR(36)  NOT NULL,
  date       DATE      NOT NULL,
  medicines  JSON      NOT NULL,
  diet       TEXT,
  lifestyle  TEXT,
  notes      TEXT,
  created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rx_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rx_doctor  FOREIGN KEY (doctor_id)  REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_rx_patient (patient_id),
  KEY idx_rx_doctor  (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

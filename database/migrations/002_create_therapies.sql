CREATE TABLE IF NOT EXISTS therapies (
  id          CHAR(36)       NOT NULL DEFAULT (UUID()),
  name        VARCHAR(80)    NOT NULL,
  category    VARCHAR(60)    NOT NULL,
  duration    INT            NOT NULL COMMENT 'Minutes',
  price       DECIMAL(10,2)  NOT NULL,
  description TEXT,
  color       VARCHAR(10)    NOT NULL DEFAULT '#4A7C2B',
  is_active   TINYINT(1)     NOT NULL DEFAULT 1,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_therapies_category (category),
  KEY idx_therapies_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

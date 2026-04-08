CREATE TABLE IF NOT EXISTS audit_logs (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  action      VARCHAR(60)  NOT NULL,
  actor_id    CHAR(36)     NOT NULL,
  actor_role  VARCHAR(20)  NOT NULL,
  target_id   CHAR(36),
  target_type VARCHAR(30),
  metadata    JSON         NOT NULL DEFAULT (JSON_OBJECT()),
  timestamp   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_actor  (actor_id),
  KEY idx_audit_target (target_id),
  KEY idx_audit_action (action),
  KEY idx_audit_ts     (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  author_id  CHAR(36)     NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  audience   ENUM('all','patient','doctor') NOT NULL DEFAULT 'all',
  pinned     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ann_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_ann_audience (audience),
  KEY idx_ann_pinned   (pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

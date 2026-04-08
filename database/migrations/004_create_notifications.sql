CREATE TABLE IF NOT EXISTS notifications (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36)     NOT NULL,
  session_id CHAR(36),
  type       ENUM('pre_procedure','post_procedure','general','system') NOT NULL DEFAULT 'system',
  priority   ENUM('normal','high','critical') NOT NULL DEFAULT 'normal',
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  `read`     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notifs_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_notifs_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  KEY idx_notifs_user     (user_id),
  KEY idx_notifs_read     (`read`),
  KEY idx_notifs_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

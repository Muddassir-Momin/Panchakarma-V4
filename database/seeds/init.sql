-- ═══════════════════════════════════════════════════════════
-- Panchakarma MS — Database Seed (Demo Data)
-- Run after schema sync: node database/seeds/run.js
-- ═══════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Users ─────────────────────────────────────────────────
-- Passwords are bcrypt hashes of 'demo123' (patients/doctors) / 'admin123' (admin)
INSERT IGNORE INTO users
  (id, name, email, password, role, phone, patientCode, dob, gender, dosha, bloodGroup,
   allergies, emergencyContact, address, avatar, avatarColor, isActive, registeredAt, createdAt, updatedAt)
VALUES
  ('u1','Priya Sharma',  'priya@demo.com',  '$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','patient','+91 98765 43210','PKM-0001','1988-05-14','Female','Pitta','B+',  'None',       '+91 97654 32109','Mumbai, Maharashtra','PS','#2D5016',1,NOW(),NOW(),NOW()),
  ('u2','Arjun Mehta',   'arjun@demo.com',  '$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','patient','+91 87654 32109','PKM-0002','1975-11-22','Male',  'Vata', 'O+',  'Sesame oil', '+91 86543 21098','Pune, Maharashtra',   'AM','#1565C0',1,NOW(),NOW(),NOW()),
  ('u3','Kavitha Nair',  'kavitha@demo.com','$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','patient','+91 76543 21098','PKM-0003','1992-03-07','Female','Kapha','A+',  'None',       '+91 75432 10987','Kochi, Kerala',       'KN','#C62828',1,NOW(),NOW(),NOW()),
  ('u4','Rajan Pillai',  'rajan@demo.com',  '$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','patient','+91 65432 10987','PKM-0004','1968-07-30','Male',  'Vata-Pitta','AB+','Ghee',        '+91 64321 09876','Thrissur, Kerala',    'RP','#6A0080',1,NOW(),NOW(),NOW());

INSERT IGNORE INTO users
  (id, name, email, password, role, phone, specialization, qualification, experience,
   verificationStatus, dailyLimit, workStart, workEnd, workingDays, avatar, avatarColor, rating, isActive, createdAt, updatedAt)
VALUES
  ('d1','Dr. Suresh Kumar','doctor@demo.com','$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','doctor','+91 99887 76655','Panchakarma Specialist','BAMS, MD (Ayu)','15 years','approved',8,'09:00','18:00','["Mon","Tue","Wed","Thu","Fri"]','SK','#2D5016',4.9,1,NOW(),NOW()),
  ('d2','Dr. Meena Iyer',  'meena@demo.com', '$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','doctor','+91 88776 65544','Ayurvedic Physician',    'BAMS, PhD (Ayu)','12 years','approved',6,'10:00','17:00','["Mon","Tue","Thu","Fri","Sat"]','MI','#1565C0',4.8,1,NOW(),NOW()),
  ('d3','Dr. Ravi Nambiar','ravi@demo.com',  '$2a$12$KIXDlQ0xFCXFH.cB7r.VZOp9.F5Ev9YkFpkQLrWqhGjvjhzWvl3tu','doctor','+91 77665 54433','Kayachikitsa',            'BAMS, PG Diploma','8 years','pending', 5,'09:30','16:00','["Mon","Wed","Fri"]',         'RN','#C62828',0,  1,NOW(),NOW());

-- Admin: password = 'admin123'
INSERT IGNORE INTO users
  (id, name, email, password, role, phone, avatar, avatarColor, isActive, createdAt, updatedAt)
VALUES
  ('a1','Admin Manager','admin@demo.com','$2a$12$z5FJkHF0N0kV2Y9T3Qdl0O9wN4VaTCl9mAJfU0DLlgmTu3LqXEPay','admin','+91 11223 34455','AM','#37474F',1,NOW(),NOW());

-- ── Therapies ─────────────────────────────────────────────
INSERT IGNORE INTO therapies (id, name, category, duration, price, description, color, isActive, createdAt, updatedAt)
VALUES
  ('t1','Abhyanga',   'Purvakarma',    60, 2500,'Full body oil massage with medicated oils',                '#4A7C2B',1,NOW(),NOW()),
  ('t2','Shirodhara', 'Pradhanakarma', 45, 3000,'Continuous stream of warm oil on the forehead',           '#D4A574',1,NOW(),NOW()),
  ('t3','Basti',      'Pradhanakarma', 90, 3500,'Medicated enema therapy for Vata disorders',              '#2D5016',1,NOW(),NOW()),
  ('t4','Nasya',      'Pradhanakarma', 30, 1800,'Nasal administration of medicated oils',                  '#17A2B8',1,NOW(),NOW()),
  ('t5','Virechana',  'Pradhanakarma',120, 4000,'Therapeutic purgation for Pitta disorders',               '#FFC107',1,NOW(),NOW()),
  ('t6','Vamana',     'Pradhanakarma', 90, 3800,'Therapeutic emesis for Kapha disorders',                  '#6c757d',1,NOW(),NOW()),
  ('t7','Pizhichil',  'Keraliya',      75, 4500,'Continuous pouring of warm medicated oil',                '#e67e22',1,NOW(),NOW()),
  ('t8','Navarakizhi','Keraliya',      90, 4200,'Rice bolus massage with medicated milk',                  '#8e44ad',1,NOW(),NOW());

-- ── Products ──────────────────────────────────────────────
INSERT IGNORE INTO products (id, doctorId, name, category, price, mrp, stock, unit, emoji, description, tags, recommended, isNew, isActive, createdAt, updatedAt)
VALUES
  ('p1','d1','Triphala Churna',     'Churna',  280, 350, 45,'100g', '🌿','Classic Ayurvedic blend for digestion and detox','["Digestive","Detox"]',        1,0,1,NOW(),NOW()),
  ('p2','d1','Ashwagandha Capsules','Capsules',420, 499, 32,'60 caps','💊','Pure KSM-66 Ashwagandha for stress and vitality','["Adaptogen","Stress"]',       1,0,1,NOW(),NOW()),
  ('p3','d2','Brahmi Ghrita',       'Ghrita',  650, 780, 18,'250g', '🫙','Medicated ghee with Brahmi for memory',         '["Brain","Memory"]',           0,0,1,NOW(),NOW()),
  ('p4','d1','Sesame Taila',        'Oil',     380, 450, 25,'200ml','🍶','Cold-pressed sesame oil for self-massage',       '["Oil","Massage"]',             1,0,1,NOW(),NOW()),
  ('p5','d1','Dashamoola Kwatha',   'Kwatha',  320, 400, 20,'200ml','🌱','Ten-root decoction for joint pain',             '["Joints","Pain"]',             0,1,1,NOW(),NOW()),
  ('p6','d2','Neem Tulsi Tablets',  'Tablet',  199, 249, 60,'60 tabs','🍃','Purifying for skin health',                    '["Skin","Detox"]',              0,0,1,NOW(),NOW()),
  ('p7','d2','Chyawanprash',        'Rasayana',560, 650, 15,'500g', '🫕','Classic Ayurvedic jam for immunity',            '["Immunity","Rasayana"]',       1,0,1,NOW(),NOW()),
  ('p8','d1','Haritaki Powder',     'Churna',  160, 200, 50,'100g', '🌾','Single herb for digestion',                     '["Digestive","Laxative"]',      0,0,1,NOW(),NOW()),
  ('p9','d2','Turmeric Milk Mix',   'Churna',  240, 290, 35,'150g', '🟡','Golden milk blend for immunity and sleep',      '["Immunity","Sleep"]',          0,1,1,NOW(),NOW());

-- ── Announcements ─────────────────────────────────────────
INSERT IGNORE INTO announcements (id, authorId, title, message, audience, pinned, createdAt, updatedAt)
VALUES
  ('ann1','a1','🌿 Welcome to Our New Platform!',
   'We are excited to launch our Panchakarma Management System. Book sessions, track progress, shop herbal remedies — all in one place.',
   'all', 1, NOW(), NOW()),
  ('ann2','a1','🏪 Herbal Shop Now Live',
   'Our curated herbal shop is open. Browse doctor-recommended Ayurvedic remedies. Order online or schedule clinic pickup.',
   'patient', 0, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

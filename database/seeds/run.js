'use strict';

/**
 * database/seeds/run.js
 * Programmatic seeder — generates proper bcrypt hashes.
 * Run:  node database/seeds/run.js
 */

require('dotenv').config({ path: '../../.env' });
const bcrypt    = require('bcryptjs');
const { Sequelize } = require('sequelize');
const define    = require('../../shared/models');
const logger    = require('../../shared/utils/logger');

async function h(pw) { return bcrypt.hash(pw, 12); }
function days(n) { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; }

async function seed() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'panchakarma_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    { host: process.env.DB_HOST || 'localhost', dialect: 'mysql', logging: false }
  );

  const db = define(sequelize);
  await sequelize.authenticate();
  logger.info('✅ Connected to database');
  await sequelize.sync({ alter: true });
  logger.info('✅ Schema synced');

  const [demoHash, adminHash] = await Promise.all([h('demo123'), h('admin123')]);

  // ── Users ───────────────────────────────────────────────
  logger.info('Seeding users...');
  await db.User.bulkCreate([
    { id:'u1', patientCode:'PKM-0001', name:'Priya Sharma',    email:'priya@demo.com',   password:demoHash,  role:'patient', phone:'+91 98765 43210', dob:'1988-05-14', gender:'Female', dosha:'Pitta',      bloodGroup:'B+',  allergies:'None',       emergencyContact:'+91 97654 32109', address:'Mumbai, Maharashtra', avatar:'PS', registeredAt:days(-90) },
    { id:'u2', patientCode:'PKM-0002', name:'Arjun Mehta',     email:'arjun@demo.com',   password:demoHash,  role:'patient', phone:'+91 87654 32109', dob:'1975-11-22', gender:'Male',   dosha:'Vata',       bloodGroup:'O+',  allergies:'Sesame oil', emergencyContact:'+91 86543 21098', address:'Pune, Maharashtra',   avatar:'AM', registeredAt:days(-60) },
    { id:'u3', patientCode:'PKM-0003', name:'Kavitha Nair',    email:'kavitha@demo.com', password:demoHash,  role:'patient', phone:'+91 76543 21098', dob:'1992-03-07', gender:'Female', dosha:'Kapha',      bloodGroup:'A+',  allergies:'None',       emergencyContact:'+91 75432 10987', address:'Kochi, Kerala',       avatar:'KN', registeredAt:days(-45) },
    { id:'u4', patientCode:'PKM-0004', name:'Rajan Pillai',    email:'rajan@demo.com',   password:demoHash,  role:'patient', phone:'+91 65432 10987', dob:'1968-07-30', gender:'Male',   dosha:'Vata-Pitta', bloodGroup:'AB+', allergies:'Ghee',       emergencyContact:'+91 64321 09876', address:'Thrissur, Kerala',    avatar:'RP', registeredAt:days(-30) },
    { id:'d1', name:'Dr. Suresh Kumar', email:'doctor@demo.com', password:demoHash,  role:'doctor', phone:'+91 99887 76655', specialization:'Panchakarma Specialist', qualification:'BAMS, MD (Ayu)',  experience:'15 years', verificationStatus:'approved', dailyLimit:8, workStart:'09:00', workEnd:'18:00', workingDays:['Mon','Tue','Wed','Thu','Fri'],        avatar:'SK', rating:4.9 },
    { id:'d2', name:'Dr. Meena Iyer',   email:'meena@demo.com',  password:demoHash,  role:'doctor', phone:'+91 88776 65544', specialization:'Ayurvedic Physician',    qualification:'BAMS, PhD (Ayu)', experience:'12 years', verificationStatus:'approved', dailyLimit:6, workStart:'10:00', workEnd:'17:00', workingDays:['Mon','Tue','Thu','Fri','Sat'],        avatar:'MI', rating:4.8 },
    { id:'d3', name:'Dr. Ravi Nambiar', email:'ravi@demo.com',   password:demoHash,  role:'doctor', phone:'+91 77665 54433', specialization:'Kayachikitsa',           qualification:'BAMS, PG Diploma',experience:'8 years',  verificationStatus:'pending',  dailyLimit:5, workStart:'09:30', workEnd:'16:00', workingDays:['Mon','Wed','Fri'],                    avatar:'RN', appliedAt: new Date() },
    { id:'a1', name:'Admin Manager',    email:'admin@demo.com',  password:adminHash, role:'admin',  phone:'+91 11223 34455', avatar:'AM' },
  ], { ignoreDuplicates: true });

  // ── Therapies ────────────────────────────────────────────
  logger.info('Seeding therapies...');
  await db.Therapy.bulkCreate([
    { id:'t1', name:'Abhyanga',    category:'Purvakarma',    duration:60,  price:2500, color:'#4A7C2B', description:'Full body oil massage with medicated oils' },
    { id:'t2', name:'Shirodhara', category:'Pradhanakarma', duration:45,  price:3000, color:'#D4A574', description:'Continuous stream of warm oil on the forehead' },
    { id:'t3', name:'Basti',      category:'Pradhanakarma', duration:90,  price:3500, color:'#2D5016', description:'Medicated enema therapy for Vata disorders' },
    { id:'t4', name:'Nasya',      category:'Pradhanakarma', duration:30,  price:1800, color:'#17A2B8', description:'Nasal administration of medicated oils' },
    { id:'t5', name:'Virechana',  category:'Pradhanakarma', duration:120, price:4000, color:'#FFC107', description:'Therapeutic purgation for Pitta disorders' },
    { id:'t6', name:'Vamana',     category:'Pradhanakarma', duration:90,  price:3800, color:'#6c757d', description:'Therapeutic emesis for Kapha disorders' },
    { id:'t7', name:'Pizhichil',  category:'Keraliya',      duration:75,  price:4500, color:'#e67e22', description:'Continuous pouring of warm medicated oil' },
    { id:'t8', name:'Navarakizhi',category:'Keraliya',      duration:90,  price:4200, color:'#8e44ad', description:'Rice bolus massage with medicated milk' },
  ], { ignoreDuplicates: true });

  // ── Sessions (spread across 6 months for realistic charts) ─
  logger.info('Seeding sessions...');
  const sessionData = [];
  const pairs = [['u1','d1','t1'],['u1','d1','t2'],['u2','d1','t1'],['u3','d2','t7'],['u4','d1','t5'],['u2','d2','t8'],['u1','d2','t4'],['u3','d1','t2']];
  let sessionId = 1;
  for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
    for (let w = 0; w < 2; w++) {
      const [pid,did,tid] = pairs[sessionId % pairs.length];
      const dt = new Date(); dt.setMonth(dt.getMonth()-monthsBack); dt.setDate(10 + w*7);
      sessionData.push({
        id: `s${sessionId}`, patientId: pid, doctorId: did, therapyId: tid,
        date: dt.toISOString().split('T')[0], time: ['09:00','10:00','11:00','14:00'][sessionId%4],
        status: monthsBack > 0 ? 'completed' : (w === 0 ? 'scheduled' : 'completed'),
        duration: 60, rescheduleCount: 0,
      });
      sessionId++;
    }
  }
  // Upcoming sessions
  sessionData.push({ id:`s${sessionId++}`,  patientId:'u1',doctorId:'d1',therapyId:'t1',date:days(1), time:'10:00',status:'scheduled',duration:60,rescheduleCount:0 });
  sessionData.push({ id:`s${sessionId++}`,  patientId:'u2',doctorId:'d1',therapyId:'t2',date:days(2), time:'11:00',status:'scheduled',duration:45,rescheduleCount:0 });
  sessionData.push({ id:`s${sessionId}`,    patientId:'u3',doctorId:'d2',therapyId:'t7',date:days(3), time:'09:30',status:'scheduled',duration:75,rescheduleCount:0 });
  await db.Session.bulkCreate(sessionData, { ignoreDuplicates: true });

  // ── Feedback (for completed sessions) ───────────────────
  logger.info('Seeding feedback...');
  const completedSessions = sessionData.filter(s => s.status === 'completed').slice(0,6);
  await db.Feedback.bulkCreate(completedSessions.map((s,i) => ({
    id: `f${i+1}`, patientId: s.patientId, sessionId: s.id, doctorId: s.doctorId,
    rating: 7 + (i % 4), energyLevel: ['much_improved','slightly_improved','same','slightly_improved'][i%4],
    symptoms: 'Improvement noted in primary complaint.',
    comments: ['Excellent session.','Very effective.','Good progress.','Comfortable treatment.'][i%4],
    submittedAt: s.date,
  })), { ignoreDuplicates: true });

  // ── Milestones ───────────────────────────────────────────
  logger.info('Seeding milestones...');
  await db.Milestone.bulkCreate([
    { id:'m1', patientId:'u1', name:'Initial Consultation',          status:'completed',   pct:100, targetDate:days(-21) },
    { id:'m2', patientId:'u1', name:'Purvakarma — Preparation Phase',status:'completed',   pct:100, targetDate:days(-14) },
    { id:'m3', patientId:'u1', name:'Pradhanakarma — Main Treatment',status:'in_progress', pct:68,  targetDate:days(7)   },
    { id:'m4', patientId:'u1', name:'Pashchatkarma — Post Treatment',status:'pending',     pct:0,   targetDate:days(14)  },
    { id:'m5', patientId:'u2', name:'Initial Consultation',          status:'completed',   pct:100, targetDate:days(-10) },
    { id:'m6', patientId:'u2', name:'Purvakarma — Preparation Phase',status:'in_progress', pct:45,  targetDate:days(5)   },
  ], { ignoreDuplicates: true });

  // ── Products ─────────────────────────────────────────────
  logger.info('Seeding products...');
  await db.Product.bulkCreate([
    { id:'p1', doctorId:'d1', name:'Triphala Churna',      category:'Churna',  price:280,mrp:350, stock:45, unit:'100g',    emoji:'🌿', recommended:true,  tags:['Digestive','Detox'] },
    { id:'p2', doctorId:'d1', name:'Ashwagandha Capsules', category:'Capsules',price:420,mrp:499, stock:32, unit:'60 caps', emoji:'💊', recommended:true,  tags:['Adaptogen','Stress'] },
    { id:'p3', doctorId:'d2', name:'Brahmi Ghrita',        category:'Ghrita',  price:650,mrp:780, stock:18, unit:'250g',    emoji:'🫙', recommended:false, tags:['Brain','Memory'] },
    { id:'p4', doctorId:'d1', name:'Sesame Taila',         category:'Oil',     price:380,mrp:450, stock:25, unit:'200ml',   emoji:'🍶', recommended:true,  tags:['Oil','Massage'] },
    { id:'p5', doctorId:'d2', name:'Chyawanprash',         category:'Rasayana',price:560,mrp:650, stock:15, unit:'500g',    emoji:'🫕', recommended:true,  tags:['Immunity','Rasayana'] },
  ], { ignoreDuplicates: true });

  // ── Notifications ─────────────────────────────────────────
  logger.info('Seeding notifications...');
  await db.Notification.bulkCreate([
    { id:'n1', userId:'u1', type:'system',        priority:'normal', title:'🌿 Welcome to Panchakarma, Priya!',     message:'Your account is ready. Your Patient ID is PKM-0001.', read:false },
    { id:'n2', userId:'u1', type:'pre_procedure', priority:'high',   title:'Session Reminder: Abhyanga Tomorrow',  message:'Your Abhyanga session is tomorrow. Please fast 2 hours before. Arrive 10 min early.', read:false },
    { id:'n3', userId:'d1', type:'system',        priority:'normal', title:'New Appointment — Priya Sharma',       message:'Priya Sharma (PKM-0001) has booked Abhyanga on tomorrow at 10:00.', read:false },
    { id:'n4', userId:'a1', type:'system',        priority:'high',   title:'🩺 New Doctor Application — Dr. Ravi', message:'Dr. Ravi Nambiar (Kayachikitsa) has applied for a doctor account. Review in Doctor Verification.', read:false },
  ], { ignoreDuplicates: true });

  // ── Announcements ─────────────────────────────────────────
  await db.Announcement.bulkCreate([
    { id:'ann1', authorId:'a1', title:'🌿 Welcome to Our New Platform!', message:'We are excited to launch our Panchakarma Management System.', audience:'all', pinned:true },
    { id:'ann2', authorId:'a1', title:'🏪 Herbal Shop Now Live',          message:'Browse doctor-recommended Ayurvedic remedies and order online or schedule clinic pickup.', audience:'patient', pinned:false },
  ], { ignoreDuplicates: true });

  logger.info('');
  logger.info('🎉 Database seeded successfully!');
  logger.info('');
  logger.info('Demo Credentials:');
  logger.info('  Patient (PKM-0001): priya@demo.com   / demo123');
  logger.info('  Doctor (approved) : doctor@demo.com  / demo123');
  logger.info('  Doctor (pending)  : ravi@demo.com    / demo123');
  logger.info('  Admin             : admin@demo.com   / admin123');
  logger.info('');

  await sequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

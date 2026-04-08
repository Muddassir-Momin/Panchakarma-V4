/* ================================================
   DB — In-Memory Data Store + Date Helpers
   ================================================ */


// ═══════════════════════════════════════════════════════════
// DATA STORE — Full in-memory database
// ═══════════════════════════════════════════════════════════
const DB = {
  // ── Clinic Configuration ────────────────────────────────
  clinicConfig: {
    defaultDailyLimit:   8,       // default max patients per doctor per day
    workingHours:        { start: '09:00', end: '18:00' },
    slotDuration:        60,      // minutes per default slot
    bookingAdvanceDays:  30,      // how far ahead patients can book
    patientIdPrefix:     'PKM',   // patient ID prefix e.g. PKM-0001
    patientIdCounter:    5,       // next patient number (4 seeded)
  },
  users: [
    { id: 'u1', patientCode: 'PKM-0001', name: 'Priya Sharma',   email: 'priya@demo.com',   password: 'demo123',  role: 'patient', phone: '+91 98765 43210', dob: '1988-05-14', gender: 'Female', dosha: 'Pitta',      address: 'Mumbai, Maharashtra', avatar: 'PS', bloodGroup: 'B+',  allergies: 'None',       emergencyContact: '+91 97654 32109', registeredAt: getDateStr(-90) },
    { id: 'u2', patientCode: 'PKM-0002', name: 'Arjun Mehta',    email: 'arjun@demo.com',   password: 'demo123',  role: 'patient', phone: '+91 87654 32109', dob: '1975-11-22', gender: 'Male',   dosha: 'Vata',       address: 'Pune, Maharashtra',   avatar: 'AM', bloodGroup: 'O+',  allergies: 'Sesame oil', emergencyContact: '+91 86543 21098', registeredAt: getDateStr(-60) },
    { id: 'u3', patientCode: 'PKM-0003', name: 'Kavitha Nair',   email: 'kavitha@demo.com', password: 'demo123',  role: 'patient', phone: '+91 76543 21098', dob: '1992-03-07', gender: 'Female', dosha: 'Kapha',      address: 'Kochi, Kerala',       avatar: 'KN', bloodGroup: 'A+',  allergies: 'None',       emergencyContact: '+91 75432 10987', registeredAt: getDateStr(-45) },
    { id: 'u4', patientCode: 'PKM-0004', name: 'Rajan Pillai',   email: 'rajan@demo.com',   password: 'demo123',  role: 'patient', phone: '+91 65432 10987', dob: '1968-07-30', gender: 'Male',   dosha: 'Vata-Pitta', address: 'Thrissur, Kerala',    avatar: 'RP', bloodGroup: 'AB+', allergies: 'Ghee',       emergencyContact: '+91 64321 09876', registeredAt: getDateStr(-30) },
    { id: 'd1', name: 'Dr. Suresh Kumar', email: 'doctor@demo.com', password: 'demo123',  role: 'doctor', verificationStatus: 'approved', phone: '+91 99887 76655', specialization: 'Panchakarma Specialist', experience: '15 years', qualification: 'BAMS, MD (Ayu)', avatar: 'SK', rating: 4.9, patients: 120, dailyLimit: 8,  workingDays: ['Mon','Tue','Wed','Thu','Fri'], workStart: '09:00', workEnd: '18:00' },
    { id: 'd2', name: 'Dr. Meena Iyer',   email: 'meena@demo.com',  password: 'demo123',  role: 'doctor', verificationStatus: 'approved', phone: '+91 88776 65544', specialization: 'Ayurvedic Physician',    experience: '12 years', qualification: 'BAMS, PhD (Ayu)', avatar: 'MI', rating: 4.8, patients: 95,  dailyLimit: 6,  workingDays: ['Mon','Tue','Thu','Fri','Sat'], workStart: '10:00', workEnd: '17:00' },
    { id: 'd3', name: 'Dr. Ravi Nambiar', email: 'ravi@demo.com',   password: 'demo123',  role: 'doctor', verificationStatus: 'pending',  phone: '+91 77665 54433', specialization: 'Kayachikitsa',           experience: '8 years',  qualification: 'BAMS, PG Diploma', avatar: 'RN', rating: 0, patients: 0, dailyLimit: 5, workingDays: ['Mon','Wed','Fri'], workStart: '09:30', workEnd: '16:00', appliedAt: new Date(Date.now()-2*86400000).toISOString() },
    { id: 'a1', name: 'Admin Manager', email: 'admin@demo.com', password: 'admin123', role: 'admin', phone: '+91 11223 34455', avatar: 'AM' }
  ],
  therapies: [
    { id: 't1', name: 'Abhyanga', duration: 60, price: 2500, category: 'Purvakarma', description: 'Full body oil massage with medicated oils', color: '#4A7C2B' },
    { id: 't2', name: 'Shirodhara', duration: 45, price: 3000, category: 'Pradhanakarma', description: 'Continuous stream of warm oil on the forehead', color: '#D4A574' },
    { id: 't3', name: 'Basti', duration: 90, price: 3500, category: 'Pradhanakarma', description: 'Medicated enema therapy for Vata disorders', color: '#2D5016' },
    { id: 't4', name: 'Nasya', duration: 30, price: 1800, category: 'Pradhanakarma', description: 'Nasal administration of medicated oils', color: '#17A2B8' },
    { id: 't5', name: 'Virechana', duration: 120, price: 4000, category: 'Pradhanakarma', description: 'Therapeutic purgation for Pitta disorders', color: '#FFC107' },
    { id: 't6', name: 'Vamana', duration: 90, price: 3800, category: 'Pradhanakarma', description: 'Therapeutic emesis for Kapha disorders', color: '#6c757d' },
    { id: 't7', name: 'Pizhichil', duration: 75, price: 4500, category: 'Keraliya', description: 'Continuous pouring of warm medicated oil', color: '#e67e22' },
    { id: 't8', name: 'Navarakizhi', duration: 90, price: 4200, category: 'Keraliya', description: 'Rice bolus massage with medicated milk', color: '#8e44ad' },
  ],
  sessions: [
    { id: 's1', patientId: 'u1', doctorId: 'd1', therapyId: 't1', date: getDateStr(1), time: '10:00', status: 'scheduled', notes: 'First session', duration: 60 },
    { id: 's2', patientId: 'u1', doctorId: 'd1', therapyId: 't2', date: getDateStr(3), time: '11:00', status: 'scheduled', notes: 'Follow up', duration: 45 },
    { id: 's3', patientId: 'u1', doctorId: 'd2', therapyId: 't4', date: getDateStr(-7), time: '09:00', status: 'completed', notes: 'Good response', duration: 30 },
    { id: 's4', patientId: 'u1', doctorId: 'd1', therapyId: 't3', date: getDateStr(-14), time: '10:00', status: 'completed', notes: 'Well tolerated', duration: 90 },
    { id: 's5', patientId: 'u2', doctorId: 'd1', therapyId: 't1', date: getDateStr(2), time: '14:00', status: 'scheduled', notes: '', duration: 60 },
    { id: 's6', patientId: 'u3', doctorId: 'd2', therapyId: 't7', date: getDateStr(0), time: '09:30', status: 'scheduled', notes: 'Sensitive skin', duration: 75 },
    { id: 's7', patientId: 'u4', doctorId: 'd1', therapyId: 't5', date: getDateStr(-3), time: '10:00', status: 'completed', notes: '', duration: 120 },
    { id: 's8', patientId: 'u1', doctorId: 'd1', therapyId: 't1', date: getDateStr(7), time: '10:00', status: 'scheduled', notes: '', duration: 60 },
    { id: 's9', patientId: 'u2', doctorId: 'd2', therapyId: 't8', date: getDateStr(-1), time: '11:00', status: 'completed', notes: '', duration: 90 },
    { id: 's10', patientId: 'u3', doctorId: 'd1', therapyId: 't2', date: getDateStr(5), time: '15:00', status: 'scheduled', notes: '', duration: 45 },
    // ── Demo sessions showing auto-reallocation (same doctor, same day, consecutive times) ──
    { id: 's11', patientId: 'u1', doctorId: 'd2', therapyId: 't1', date: getDateStr(2), time: '10:00', status: 'scheduled', notes: 'Demo: cancel this to trigger auto-reallocation', duration: 60 },
    { id: 's12', patientId: 'u4', doctorId: 'd2', therapyId: 't4', date: getDateStr(2), time: '11:00', status: 'scheduled', notes: 'Demo: will auto-move to 10:00 when s11 is cancelled', duration: 30 },
    { id: 's13', patientId: 'u2', doctorId: 'd2', therapyId: 't7', date: getDateStr(2), time: '12:00', status: 'scheduled', notes: 'Demo: third patient on same day', duration: 75 },
  ],
  notifications: [
    { id: 'n1', userId: 'u1', type: 'pre_procedure', title: 'Prepare for Tomorrow\'s Abhyanga', message: 'Please fast for 2 hours before your session. Wear loose comfortable clothing. Avoid applying any oils or creams. Arrive 10 minutes early.', priority: 'high', read: false, createdAt: new Date(Date.now() - 2*3600000).toISOString(), sessionId: 's1' },
    { id: 'n2', userId: 'u1', type: 'post_procedure', title: 'Post-Session Care Instructions', message: 'Rest for at least 2 hours after your session. Consume warm, light, easily digestible food. Avoid cold water and direct sunlight. Stay warm and relaxed.', priority: 'normal', read: false, createdAt: new Date(Date.now() - 8*3600000).toISOString(), sessionId: 's3' },
    { id: 'n3', userId: 'u1', type: 'general', title: 'Your Treatment Plan Update', message: 'Dr. Suresh has updated your treatment protocol. You are now progressing to Pradhanakarma phase. Three new sessions have been added.', priority: 'normal', read: true, createdAt: new Date(Date.now() - 24*3600000).toISOString() },
    { id: 'n4', userId: 'u1', type: 'system', title: 'Appointment Confirmed ✓', message: 'Your Shirodhara appointment on has been confirmed with Dr. Suresh Kumar. You will receive reminders 24 hours and 2 hours before.', priority: 'normal', read: true, createdAt: new Date(Date.now() - 48*3600000).toISOString() },
    { id: 'n5', userId: 'u1', type: 'pre_procedure', title: 'Session Reminder: Shirodhara', message: 'Your Shirodhara session is in 24 hours. Please avoid caffeine today and maintain a calm mind. Dietary guidelines attached in your portal.', priority: 'high', read: false, createdAt: new Date(Date.now() - 1*3600000).toISOString(), sessionId: 's2' },
    { id: 'n6', userId: 'u2', type: 'pre_procedure', title: 'Tomorrow\'s Abhyanga Session', message: 'Fast for 2 hours before treatment. Comfortable loose clothing recommended. Arrive 10 min early.', priority: 'high', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), sessionId: 's5' },
    { id: 'n7', userId: 'u3', type: 'general', title: 'Welcome to Panchakarma Program', message: 'Your 28-day Panchakarma journey begins today. Dr. Meena Iyer will guide your treatment. Please review your personalized diet chart.', priority: 'normal', read: false, createdAt: new Date(Date.now() - 3*3600000).toISOString() },
    { id: 'n8', userId: 'u4', type: 'post_procedure', title: 'Post-Virechana Care', message: 'Critical: Only consume light diet for 48 hours. Avoid heavy, oily, spicy foods. Stay hydrated. Contact clinic if discomfort persists.', priority: 'critical', read: false, createdAt: new Date(Date.now() - 4*3600000).toISOString(), sessionId: 's7' },
    // Doctor notifications
    { id: 'n9',  userId: 'd1', type: 'system',  title: '📦 New Session Booked — Priya Sharma (PKM-0001)', message: 'Priya Sharma has booked a Shirodhara session on ' + getDateStr(2) + ' at 10:00 AM. Please review her recent progress notes before the session.', priority: 'normal', read: false, createdAt: new Date(Date.now() - 30*60000).toISOString() },
    { id: 'n10', userId: 'd1', type: 'system',  title: '⚠️ Low Stock — Triphala Churna (5 units left)', message: 'Your product "Triphala Churna" has only 5 units remaining in stock. Please restock soon to avoid missed patient orders.', priority: 'high', read: false, createdAt: new Date(Date.now() - 2*3600000).toISOString() },
    { id: 'n11', userId: 'd1', type: 'general', title: '💊 Patient Feedback Received — Arjun Mehta', message: 'Arjun Mehta (PKM-0002) submitted feedback for his last Abhyanga session. Rating: 9/10. Energy level: Much Improved. Check the Reports tab for details.', priority: 'normal', read: false, createdAt: new Date(Date.now() - 5*3600000).toISOString() },
    { id: 'n12', userId: 'd1', type: 'system',  title: '🔄 Session Auto-Reallocated', message: 'A session cancellation freed up a slot on ' + getDateStr(2) + ' at 10:00 AM. Rajan Pillai (PKM-0004) has been automatically moved to this earlier slot.', priority: 'normal', read: true, createdAt: new Date(Date.now() - 6*3600000).toISOString() },
    { id: 'n13', userId: 'd1', type: 'system',  title: '✅ New Doctor Approval Confirmed', message: 'Your doctor account has been verified and approved by the administrator. You now have full access to all patient management features.', priority: 'high', read: true, createdAt: new Date(Date.now() - 2*86400000).toISOString() },
    { id: 'n14', userId: 'd2', type: 'system',  title: '📦 New Session Booked — Kavitha Nair (PKM-0003)', message: 'Kavitha Nair has booked a Nasya session on ' + getDateStr(3) + ' at 11:00 AM.', priority: 'normal', read: false, createdAt: new Date(Date.now() - 1*3600000).toISOString() },
    { id: 'n15', userId: 'd2', type: 'system',  title: '❌ Out of Stock — Brahmi Ghrita', message: 'Your product "Brahmi Ghrita" is now completely out of stock. 3 patients have this in their active prescriptions. Please restock urgently.', priority: 'critical', read: false, createdAt: new Date(Date.now() - 3*3600000).toISOString() },
  ],
  milestones: [
    { id: 'm1', patientId: 'u1', name: 'Initial Consultation', status: 'completed', pct: 100, targetDate: getDateStr(-21), completedDate: getDateStr(-21) },
    { id: 'm2', patientId: 'u1', name: 'Purvakarma — Preparation Phase', status: 'completed', pct: 100, targetDate: getDateStr(-14), completedDate: getDateStr(-14) },
    { id: 'm3', patientId: 'u1', name: 'Pradhanakarma — Main Treatment', status: 'in_progress', pct: 68, targetDate: getDateStr(7) },
    { id: 'm4', patientId: 'u1', name: 'Pashchatkarma — Post Treatment', status: 'pending', pct: 0, targetDate: getDateStr(14) },
    { id: 'm5', patientId: 'u1', name: 'Diet & Lifestyle Integration', status: 'pending', pct: 0, targetDate: getDateStr(21) },
    { id: 'm6', patientId: 'u1', name: 'Follow-up Assessment', status: 'pending', pct: 0, targetDate: getDateStr(28) },
    { id: 'm7', patientId: 'u1', name: 'Maintenance Protocol', status: 'pending', pct: 0, targetDate: getDateStr(35) },
    { id: 'm8', patientId: 'u2', name: 'Initial Consultation', status: 'completed', pct: 100, targetDate: getDateStr(-10), completedDate: getDateStr(-10) },
    { id: 'm9', patientId: 'u2', name: 'Purvakarma — Preparation Phase', status: 'in_progress', pct: 45, targetDate: getDateStr(5) },
  ],
  feedback: [
    { id: 'f1', patientId: 'u1', sessionId: 's3', rating: 8, symptoms: 'Significant reduction in joint pain. Improved sleep quality.', energyLevel: 'much_improved', comments: 'Excellent session. Dr. Suresh was very attentive.', submittedAt: getDateStr(-7) },
    { id: 'f2', patientId: 'u1', sessionId: 's4', rating: 9, symptoms: 'Digestive issues improving. Less bloating.', energyLevel: 'slightly_improved', comments: 'Treatment was intensive but very effective.', submittedAt: getDateStr(-14) },
    { id: 'f3', patientId: 'u2', sessionId: 's9', rating: 7, symptoms: 'Back pain still present but reduced by 50%.', energyLevel: 'slightly_improved', comments: 'Good session, look forward to next one.', submittedAt: getDateStr(-1) },
  ],
  prescriptions: [
    { id: 'pr1', patientId: 'u1', doctorId: 'd1', date: getDateStr(-7), medicines: [{ name: 'Triphala Churna', dose: '5g', freq: 'Twice daily', duration: '30 days' }, { name: 'Ashwagandha Capsules', dose: '500mg', freq: 'Once daily', duration: '30 days' }], diet: 'Warm, light, easily digestible foods. Avoid spicy and cold items. Include ginger and turmeric.', lifestyle: 'Morning yoga for 30 minutes. Early bedtime. Avoid screen time before sleep.', notes: 'Review after 2 weeks.' },
    { id: 'pr2', patientId: 'u1', doctorId: 'd2', date: getDateStr(-14), medicines: [{ name: 'Brahmi Ghrita', dose: '1 tsp', freq: 'Morning on empty stomach', duration: '21 days' }], diet: 'Include sesame seeds and almonds. Avoid raw vegetables.', lifestyle: 'Meditation 15 minutes daily.', notes: 'Monitor digestion.' },
  ],
  products: [
    { id: 'p1', name: 'Triphala Churna', category: 'Churna', price: 280, mrp: 350, stock: 45, unit: '100g', emoji: '🌿', description: 'Classic Ayurvedic blend of three fruits for digestion & detox', tags: ['Digestive','Detox','Vata'], doctorId: 'd1', recommended: true, isNew: false, dosha: ['Vata','Pitta','Kapha'] },
    { id: 'p2', name: 'Ashwagandha Capsules', category: 'Capsules', price: 420, mrp: 499, stock: 32, unit: '60 caps', emoji: '💊', description: 'Pure KSM-66 Ashwagandha for stress relief and vitality', tags: ['Adaptogen','Stress','Energy'], doctorId: 'd1', recommended: true, isNew: false, dosha: ['Vata','Kapha'] },
    { id: 'p3', name: 'Brahmi Ghrita', category: 'Ghrita', price: 650, mrp: 780, stock: 18, unit: '250g', emoji: '🫙', description: 'Medicated ghee with Brahmi for memory & cognitive function', tags: ['Brain','Memory','Pitta'], doctorId: 'd2', recommended: false, isNew: false, dosha: ['Pitta','Vata'] },
    { id: 'p4', name: 'Sesame Taila (Oil)', category: 'Oil', price: 380, mrp: 450, stock: 25, unit: '200ml', emoji: '🍶', description: 'Cold-pressed sesame oil for Abhyanga self-massage at home', tags: ['Oil','Massage','Vata'], doctorId: 'd1', recommended: true, isNew: false, dosha: ['Vata'] },
    { id: 'p5', name: 'Dashamoola Kwatha', category: 'Kwatha', price: 320, mrp: 400, stock: 20, unit: '200ml', emoji: '🌱', description: 'Ten-root decoction for joint pain, inflammation & Vata disorders', tags: ['Joints','Pain','Anti-inflammatory'], doctorId: 'd1', recommended: false, isNew: true, dosha: ['Vata'] },
    { id: 'p6', name: 'Neem Tulsi Tablets', category: 'Tablet', price: 199, mrp: 249, stock: 60, unit: '60 tabs', emoji: '🍃', description: 'Purifying combination for skin health and blood purification', tags: ['Skin','Pitta','Detox'], doctorId: 'd2', recommended: false, isNew: false, dosha: ['Pitta','Kapha'] },
    { id: 'p7', name: 'Chyawanprash', category: 'Rasayana', price: 560, mrp: 650, stock: 15, unit: '500g', emoji: '🫕', description: 'Classic Ayurvedic jam for immunity, strength and longevity', tags: ['Immunity','Rasayana','All'], doctorId: 'd2', recommended: true, isNew: false, dosha: ['Vata','Pitta','Kapha'] },
    { id: 'p8', name: 'Shirodhara Oil Kit', category: 'Oil', price: 890, mrp: 1100, stock: 10, unit: 'Kit', emoji: '💆', description: 'Complete kit with Brahmi oil, dripping vessel & instructions', tags: ['Stress','Shirodhara','Mind'], doctorId: 'd1', recommended: false, isNew: true, dosha: ['Pitta','Vata'] },
    { id: 'p9', name: 'Haritaki Powder', category: 'Churna', price: 160, mrp: 200, stock: 50, unit: '100g', emoji: '🌾', description: 'Single herb powder for constipation, digestion and rejuvenation', tags: ['Digestive','Laxative','Vata'], doctorId: 'd1', recommended: false, isNew: false, dosha: ['Vata','Kapha'] },
    { id: 'p10', name: 'Turmeric Milk Mix', category: 'Churna', price: 240, mrp: 290, stock: 35, unit: '150g', emoji: '🟡', description: 'Golden milk blend with turmeric, ginger, pepper & ashwagandha', tags: ['Immunity','Anti-inflammatory','Sleep'], doctorId: 'd2', recommended: true, isNew: true, dosha: ['Vata','Kapha'] },
    { id: 'p11', name: 'Ksheerabala Taila', category: 'Oil', price: 480, mrp: 560, stock: 14, unit: '200ml', emoji: '🫧', description: 'Medicated oil prepared in milk for neuromuscular disorders', tags: ['Neuro','Joints','Vata'], doctorId: 'd2', recommended: false, isNew: false, dosha: ['Vata'] },
    { id: 'p12', name: 'Amalaki Rasayana', category: 'Rasayana', price: 420, mrp: 520, stock: 22, unit: '250g', emoji: '🫐', description: 'Pure Amla-based rejuvenating tonic rich in Vitamin C', tags: ['Immunity','Pitta','Antioxidant'], doctorId: 'd1', recommended: false, isNew: true, dosha: ['Pitta','Vata','Kapha'] },
  ],
  orders: [
    { id: 'ord1', patientId: 'u1', items: [{productId:'p1',qty:2},{productId:'p2',qty:1}], mode: 'online', status: 'delivered', total: 980, address: 'Mumbai, Maharashtra', placedAt: getDateStr(-10), pickupCode: null, estimatedDelivery: getDateStr(-7) },
    { id: 'ord2', patientId: 'u1', items: [{productId:'p4',qty:1}], mode: 'pickup', status: 'ready', total: 380, address: null, placedAt: getDateStr(-2), pickupCode: 'PKP-4821', estimatedDelivery: null },
    { id: 'ord3', patientId: 'u2', items: [{productId:'p7',qty:1},{productId:'p9',qty:2}], mode: 'online', status: 'processing', total: 880, address: 'Pune, Maharashtra', placedAt: getDateStr(-1), pickupCode: null, estimatedDelivery: getDateStr(2) },
  ],
  cart: [],
  announcements: [
    { id:'ann1', title:'🌿 Welcome to Our New Online Platform!', message:'We are excited to launch our new Panchakarma Management Software. You can now book sessions, track progress, shop herbal remedies, and more — all in one place.', authorId:'a1', createdAt: new Date(Date.now()-5*86400000).toISOString(), pinned:true, audience:'all' },
    { id:'ann2', title:'🏪 Herbal Shop Now Open', message:'Our curated herbal shop is now live! Browse doctor-recommended Ayurvedic remedies and medicines. Order online for home delivery or schedule a clinic pickup.', authorId:'a1', createdAt: new Date(Date.now()-2*86400000).toISOString(), pinned:false, audience:'patient' },
  ]

/* ================================================
   DOCTOR — Reports, Dual-Axis Chart, Export
   ================================================ */

function renderDoctorReports(el) {
  const myPatientIds = [...new Set(DB.sessions.filter(s=>s.doctorId===currentUser.id).map(s=>s.patientId))];
  const mySessions   = DB.sessions.filter(s=>s.doctorId===currentUser.id);
  const completed    = mySessions.filter(s=>s.status==='completed');
  const upcoming     = mySessions.filter(s=>s.status==='scheduled');
  const myFeedback   = DB.feedback.filter(f=>f.doctorId===currentUser.id||mySessions.some(s=>s.id===f.sessionId));
  const avgRating    = myFeedback.length ? (myFeedback.reduce((s,f)=>s+f.rating,0)/myFeedback.length).toFixed(1) : '—';
  const totalRevenue = completed.reduce((s,ss)=>{const t=getTherapy(ss.therapyId);return s+(t?.price||0);},0);
  const therapyCounts = {};
  mySessions.forEach(s=>{const t=getTherapy(s.therapyId);if(t)therapyCounts[t.name]=(therapyCounts[t.name]||0)+1;});

  // 6-month trend
  const monthlyData = [];
  for (let i=5; i>=0; i--) {
    const d = new Date(); d.setMonth(d.getMonth()-i); d.setDate(1);
    const label = d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'});
    const mo = d.getMonth(), yr = d.getFullYear();
    const sess = completed.filter(s=>{ const sd=new Date(s.date); return sd.getMonth()===mo&&sd.getFullYear()===yr; });
    const rev  = sess.reduce((s,ss)=>{const t=getTherapy(ss.therapyId);return s+(t?.price||0);},0);
    monthlyData.push({ label, count: sess.length, rev });
  }


/* ================================================
   ADMIN — Reports + Export Panel (7 types × 4 formats)
   ================================================ */

      return (pt?.name||'').toLowerCase().includes(sq)
          || (pt?.patientCode||'').toLowerCase().includes(sq)
          || (dr?.name||'').toLowerCase().includes(sq)
          || (th?.name||'').toLowerCase().includes(sq)
          || s.date.includes(sq);
    });
  }
  sessions = sessions.sort((a,b)=>b.date.localeCompare(a.date));
  const total     = sessions.length;
  const totalPages= Math.ceil(total / PAGE_SZ) || 1;
  const page      = Math.min(Math.max(pageNum, 1), totalPages);
  const slice     = sessions.slice((page-1)*PAGE_SZ, page*PAGE_SZ);

  const statusCls = { scheduled:'badge-blue', completed:'badge-green', cancelled:'badge-red', rescheduled:'badge-yellow' };

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div><h2>📅 All Appointments</h2><p>${total} total appointments</p></div>
        <input type="text" placeholder="🔍 Search patient, doctor, therapy…"
               value="${search}"
               oninput="window._adminApptSearch=this.value;window._adminApptPage=1;showPage('admin-appointments')"
               style="padding:9px 14px;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:0.88rem;width:260px">
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="section-tabs" style="margin-bottom:0">
        ${[['all','All'],['scheduled','Scheduled'],['completed','Completed'],['cancelled','Cancelled']].map(([v,l])=>
          `<button class="section-tab ${filter===v?'active':''}" onclick="window._adminApptFilter='${v}';window._adminApptPage=1;showPage('admin-appointments')">${l}</button>`
        ).join('')}
      </div>
      <span class="badge badge-blue">Page ${page} of ${totalPages}</span>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date & Time</th><th>Patient</th><th>Patient ID</th><th>Doctor</th><th>Therapy</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${slice.map(s=>{
              const pt=getUser(s.patientId), dr=getUser(s.doctorId), th=getTherapy(s.therapyId);
              return `<tr>
                <td>${formatDate(s.date)}<br><small style="color:var(--text-light)">${formatTime(s.time)}</small></td>
                <td><strong>${pt?.name||'—'}</strong></td>
                <td><span style="font-family:var(--font-serif);font-weight:700;color:var(--primary);font-size:0.85rem">${pt?.patientCode||'—'}</span></td>
                <td>${dr?.name||'—'}</td>
                <td>${th?.name||'—'}</td>
                <td>₹${th?.price?.toLocaleString()||'—'}</td>
                <td><span class="badge ${statusCls[s.status]||'badge-gray'}">${s.status}</span></td>
                <td style="white-space:nowrap">
                  ${s.status==='scheduled'
                    ? `<button class="btn btn-sm btn-green" onclick="adminCompleteSession('${s.id}')">Complete</button>
                       <button class="btn btn-sm btn-danger" onclick="adminCancelSession('${s.id}')">Cancel</button>`
                    : '—'}
                </td>
              </tr>`;
            }).join('') || '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-light)">No appointments found</td></tr>'}
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      ${totalPages > 1 ? `
      <div style="display:flex;justify-content:center;align-items:center;gap:8px;padding:16px 0 4px;flex-wrap:wrap">
        <button class="btn btn-sm btn-outline" ${page<=1?'disabled':''} onclick="window._adminApptPage=${page-1};showPage('admin-appointments')">← Prev</button>
        ${Array.from({length:totalPages},(_,i)=>i+1).filter(p=>Math.abs(p-page)<=2||p===1||p===totalPages).reduce((acc,p,i,arr)=>{
          if(i>0&&arr[i-1]!==p-1) acc.push('<span style="padding:0 4px;color:var(--text-light)">…</span>');
          acc.push(`<button class="btn btn-sm ${p===page?'btn-green':'btn-outline'}" onclick="window._adminApptPage=${p};showPage('admin-appointments')">${p}</button>`);
          return acc;
        },[]).join('')}
        <button class="btn btn-sm btn-outline" ${page>=totalPages?'disabled':''} onclick="window._adminApptPage=${page+1};showPage('admin-appointments')">Next →</button>
      </div>` : ''}
    </div>`;
}
function adminCompleteSession(id) {
  const s=DB.sessions.find(s=>s.id===id);
  if(s){s.status='completed';showToast('Session marked complete','success');showPage('admin-appointments');}
}
function adminCancelSession(id) {
  const s = DB.sessions.find(s => s.id === id);
  if (!s) return;

  const cancelledTime   = s.time;
  const cancelledDate   = s.date;
  const cancelledDoctor = s.doctorId;
  const th  = getTherapy(s.therapyId);
  const pt  = getUser(s.patientId);

  s.status      = 'cancelled';
  s.cancelledAt = new Date().toISOString();

  // Notify patient
  DB.notifications.push({
    id: genId('n'), userId: s.patientId, type: 'system',
    priority: 'high', read: false,
    title: `❌ Session Cancelled — ${th?.name || 'Session'}`,
    message: `Your ${th?.name || 'session'} on ${formatDate(cancelledDate)} at ${formatTime(cancelledTime)} was cancelled by the clinic.`,
    createdAt: new Date().toISOString(),
  });

  // Auto-reallocation
  const next = DB.sessions
    .filter(ws => ws.doctorId===cancelledDoctor && ws.date===cancelledDate && ws.status==='scheduled' && ws.time>cancelledTime)
    .sort((a,b) => a.time.localeCompare(b.time))[0];

  if (next) {
    const oldTime = next.time;
    const nextPt  = getUser(next.patientId);
    const nextDr  = getUser(cancelledDoctor);
    const nextTh  = getTherapy(next.therapyId);
    next.time          = cancelledTime;
    next.reallocatedAt = new Date().toISOString();
    next.prevTime      = oldTime;

    DB.notifications.push({
      id: genId('n'), userId: next.patientId, type: 'system',
      priority: 'high', read: false,
      title: `🎉 Earlier Slot Available — Your Session Moved!`,
      message: `A slot opened up earlier. Your ${nextTh?.name || 'session'} with ${nextDr?.name || 'your doctor'} on ${formatDate(cancelledDate)} has been moved from ${formatTime(oldTime)} to ${formatTime(cancelledTime)}.`,
      createdAt: new Date().toISOString(),
    });
    DB.notifications.push({
      id: genId('n'), userId: cancelledDoctor, type: 'system',
      priority: 'normal', read: false,
      title: `🔄 Schedule Updated — Auto-Reallocation`,
      message: `${nextPt?.name || 'A patient'} (${nextPt?.patientCode || '—'}) moved from ${formatTime(oldTime)} to ${formatTime(cancelledTime)} on ${formatDate(cancelledDate)}.`,
      createdAt: new Date().toISOString(),
    });
    showToast(`Cancelled. ${nextPt?.name?.split(' ')[0] || 'Next patient'} auto-moved to ${formatTime(cancelledTime)} 🔄`, 'success');
  } else {
    showToast('Session cancelled.', 'warning');
  }
  buildNav();
  showPage('admin-appointments');
}

// ═══════════════════════════════════════════════════════════
// ADMIN — REPORTS
// ═══════════════════════════════════════════════════════════
function renderAdminReports(el) {
  const allSessions   = DB.sessions;
  const completed     = allSessions.filter(s=>s.status==='completed');
  const scheduled     = allSessions.filter(s=>s.status==='scheduled');
  const cancelled     = allSessions.filter(s=>s.status==='cancelled');
  const totalRev      = completed.reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);
  const now           = new Date();
  const monthlyRev    = completed.filter(s=>{const d=new Date(s.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);
  const avgRating     = DB.feedback.length ? (DB.feedback.reduce((s,f)=>s+f.rating,0)/DB.feedback.length).toFixed(1) : '—';
  const shopRev       = DB.orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  const totalPatients = DB.users.filter(u=>u.role==='patient').length;
  const activeDoctors = DB.users.filter(u=>u.role==='doctor'&&(u.verificationStatus||'approved')==='approved').length;

  // Top therapy by revenue
  const therapyRevMap = {};
  completed.forEach(s=>{const t=getTherapy(s.therapyId);if(t){therapyRevMap[t.name]=(therapyRevMap[t.name]||0)+t.price;}});
  const topTherapy = Object.entries(therapyRevMap).sort((a,b)=>b[1]-a[1])[0];

  // Monthly revenue for last 6 months
  const monthlyData = [];
  for (let i=5; i>=0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth()-i);
    const rev = completed.filter(s=>{const sd=new Date(s.date);return sd.getMonth()===d.getMonth()&&sd.getFullYear()===d.getFullYear();}).reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);
    const shopM = DB.orders.filter(o=>{const od=new Date(o.placedAt);return od.getMonth()===d.getMonth()&&od.getFullYear()===d.getFullYear()&&o.status!=='cancelled';}).reduce((s,o)=>s+o.total,0);
    monthlyData.push({ label: d.toLocaleDateString('en-IN',{month:'short'}), therapy: rev, shop: shopM });
  }

  el.innerHTML=`
    <div class="page-header"><h2>📊 System Reports</h2><p>Clinic analytics, financials and performance overview</p></div>

    <!-- KPI row -->
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-icon">💰</span><div class="stat-label">Total Revenue</div><div class="stat-value">₹${(totalRev/1000).toFixed(1)}K</div><div class="stat-sub">Therapy sessions</div></div>
      <div class="stat-card"><span class="stat-icon">🛒</span><div class="stat-label">Shop Revenue</div><div class="stat-value">₹${(shopRev/1000).toFixed(1)}K</div><div class="stat-sub">Herbal products</div></div>
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-label">This Month</div><div class="stat-value">₹${(monthlyRev/1000).toFixed(1)}K</div><div class="stat-sub">${now.toLocaleDateString('en-IN',{month:'long'})}</div></div>
      <div class="stat-card"><span class="stat-icon">⭐</span><div class="stat-label">Avg Rating</div><div class="stat-value">${avgRating}/10</div><div class="stat-sub">Patient satisfaction</div></div>
    </div>

    <!-- Secondary KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      ${[
        ['👥','Patients',totalPatients,'Registered'],
        ['👨‍⚕️','Doctors',activeDoctors,'Active & verified'],
        ['✅','Completed',completed.length,'Sessions done'],
        ['🏆','Top Therapy',topTherapy?topTherapy[0]:'—',topTherapy?`₹${(topTherapy[1]/1000).toFixed(1)}K revenue`:'No data'],
      ].map(([icon,label,val,sub])=>`
        <div style="background:white;border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-sm);text-align:center">
          <div style="font-size:1.6rem;margin-bottom:6px">${icon}</div>
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light)">${label}</div>
          <div style="font-family:var(--font-serif);font-size:1.3rem;font-weight:700;color:var(--primary);margin:4px 0 2px">${val}</div>
          <div style="font-size:0.72rem;color:var(--text-light)">${sub}</div>
        </div>`).join('')}
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">📈 6-Month Revenue Trend</span></div>
        <div class="chart-wrap chart-h-lg"><canvas id="monthly-trend-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🥧 Session Status</span></div>
        <div class="chart-wrap chart-h-lg"><canvas id="status-pie-chart"></canvas></div>
      </div>
    </div>

    <!-- Detailed tables row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">👨‍⚕️ Doctor Performance</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Doctor</th><th>Patients</th><th>Sessions</th><th>Revenue</th><th>Rating</th></tr></thead>
            <tbody>
              ${DB.users.filter(u=>u.role==='doctor'&&(u.verificationStatus||'approved')==='approved').map(d=>{
                const dSess = DB.sessions.filter(s=>s.doctorId===d.id&&s.status==='completed');
                const dPat  = [...new Set(DB.sessions.filter(s=>s.doctorId===d.id).map(s=>s.patientId))];
                const dRev  = dSess.reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);
                return `<tr>
                  <td><div style="font-weight:600">${d.name}</div><div style="font-size:0.75rem;color:var(--text-light)">${d.specialization}</div></td>
                  <td>${dPat.length}</td>
                  <td>${dSess.length}</td>
                  <td>₹${(dRev/1000).toFixed(1)}K</td>
                  <td>⭐ ${d.rating||'—'}</td>
                </tr>`;
              }).join('')}

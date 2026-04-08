/* ================================================
   ADMIN — Users, Doctor Verification, Self-Delete Guard
   ================================================ */

    data: {
      labels,
      datasets: [{
        label: 'Sessions',
        data: vals,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} sessions` } },
      },
      scales: {
        x: { beginAtZero: true, grid: { color: '#E5DDD0' },
             ticks: { font: { family: 'Lato', size: 11 }, stepSize: 1 } },
        y: { grid: { display: false },
             ticks: { font: { family: 'Lato', size: 11 } } },
      },
    },
  });
}


// ═══════════════════════════════════════════════════════════
// ADMIN — DASHBOARD
// ═══════════════════════════════════════════════════════════
function renderAdminDashboard(el) {
  const patients=DB.users.filter(u=>u.role==='patient');
  const doctors=DB.users.filter(u=>u.role==='doctor' && (u.verificationStatus||'approved')==='approved');
  const pendingDoctors=DB.users.filter(u=>u.role==='doctor' && u.verificationStatus==='pending');
  const today=DB.sessions.filter(s=>s.date===getDateStr(0));
  const revenue=DB.sessions.filter(s=>s.status==='completed').reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);

  el.innerHTML=`
    ${pendingDoctors.length ? `
    <div style="background:linear-gradient(135deg,#fff3e0,#fff8f0);border:2px solid var(--warning);border-radius:var(--radius-lg);padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;gap:16px">
      <div style="font-size:2rem;flex-shrink:0">⚡</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:1rem;color:#E65100">Action Required — Doctor Verification</div>
        <div style="font-size:0.85rem;color:var(--text-med);margin-top:3px">${pendingDoctors.length} doctor application${pendingDoctors.length>1?'s':''} waiting for your approval: ${pendingDoctors.map(d=>`<strong>${d.name}</strong>`).join(', ')}</div>
      </div>
      <button class="btn btn-warning" onclick="window._adminUserFilter='verification';showPage('admin-users')" style="background:var(--warning);color:var(--text);font-weight:700;flex-shrink:0">
        Review Now →
      </button>
    </div>` : ''}

    <div class="profile-card">
      <div class="profile-avatar-big">⚙️</div>
      <div><div class="profile-name">Admin Dashboard</div><div class="profile-role">Panchakarma Clinic Management</div><div class="profile-detail" style="margin-top:4px">Full system control and analytics</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-icon">👥</span><div class="stat-label">Total Patients</div><div class="stat-value">${patients.length}</div><div class="stat-sub">Registered patients</div></div>
      <div class="stat-card"><span class="stat-icon">👨‍⚕️</span><div class="stat-label">Active Doctors</div><div class="stat-value">${doctors.length}</div><div class="stat-sub">${pendingDoctors.length} pending verification</div></div>
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-label">Today's Sessions</div><div class="stat-value">${today.length}</div><div class="stat-sub">Appointments today</div></div>
      <div class="stat-card"><span class="stat-icon">💰</span><div class="stat-label">Total Revenue</div><div class="stat-value">₹${(revenue/1000).toFixed(1)}K</div><div class="stat-sub">From completed sessions</div></div>
    </div>
    <div class="admin-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">Quick Actions</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button class="btn btn-green" style="padding:14px;justify-content:center" onclick="showPage('admin-users')">👥 Manage Users</button>
          <button class="btn ${pendingDoctors.length?'btn-warning':'btn-outline'}" style="padding:14px;justify-content:center;${pendingDoctors.length?'background:var(--warning);color:var(--text);':''}" onclick="window._adminUserFilter='verification';showPage('admin-users')">
            🩺 Verify Doctors${pendingDoctors.length?` (${pendingDoctors.length})`:''}
          </button>
          <button class="btn btn-outline" style="padding:14px;justify-content:center" onclick="showPage('admin-appointments')">📅 Appointments</button>
          <button class="btn btn-accent" style="padding:14px;justify-content:center" onclick="showPage('admin-reports')">📊 Reports</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Recent Activity</span></div>
        ${DB.sessions.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(s=>{
          const pt=getUser(s.patientId),dr=getUser(s.doctorId),th=getTherapy(s.therapyId);
          return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="width:8px;height:8px;border-radius:50%;background:${s.status==='completed'?'var(--success)':s.status==='cancelled'?'var(--danger)':'var(--info)'}"></div>
            <div style="flex:1;font-size:0.85rem"><strong>${pt?.name}</strong> → ${th?.name}</div>
            <span class="badge ${s.status==='completed'?'badge-green':s.status==='cancelled'?'badge-red':'badge-blue'}">${s.status}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">Revenue by Therapy</span></div>
      <div class="chart-wrap chart-h-md"><canvas id="admin-revenue-chart"></canvas></div>
    </div>`;
  setTimeout(()=>drawAdminRevenueChart(),100);
}

function drawAdminRevenueChart() {
  destroyChart('admin-revenue-chart');
  const canvas = document.getElementById('admin-revenue-chart');
  if (!canvas) return;
  const revByTherapy = {};
  DB.sessions.filter(s=>s.status==='completed').forEach(s=>{
    const t = getTherapy(s.therapyId);
    if (t) revByTherapy[t.name] = (revByTherapy[t.name]||0) + t.price;
  });
  const labels = Object.keys(revByTherapy);
  const vals   = Object.values(revByTherapy);
  if (!labels.length) return;
  const colors = ['#2D5016','#4A7C2B','#D4A574','#17A2B8','#FFC107','#DC3545','#8e44ad','#e67e22'];
  canvas.style.height = '300px';
  _charts['admin-revenue-chart'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data: vals,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Lato', size: 11 } } },
        y: { beginAtZero: true, grid: { color: '#E5DDD0' },
             ticks: { font: { family: 'Lato', size: 11 },
                      callback: v => '₹' + (v>=1000 ? (v/1000).toFixed(0)+'K' : v) } },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════
// ADMIN — USERS & DOCTOR VERIFICATION
// ═══════════════════════════════════════════════════════════
function renderAdminUsers(el) {
  const filterRole = window._adminUserFilter || 'all';
  const pendingDoctors = DB.users.filter(u => u.role === 'doctor' && u.verificationStatus === 'pending');
  const users = filterRole === 'verification'
    ? DB.users.filter(u => u.role === 'doctor')
    : filterRole === 'all'
    ? DB.users
    : DB.users.filter(u => u.role === filterRole);

  el.innerHTML=`
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2>👥 User Management</h2>
          <p>Manage patients, doctors, and verify new doctor registrations</p>
        </div>
        <button class="btn btn-green" onclick="openAdminAddUserModal()">+ Add User</button>
      </div>
    </div>

    ${pendingDoctors.length ? `
    <div class="card" style="border:2px solid var(--warning);margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">⚡ Doctor Verification Required</span>
        <span class="badge" style="background:#fff3e0;color:#E65100;font-size:0.8rem">${pendingDoctors.length} pending</span>
      </div>
      <p style="font-size:0.85rem;color:var(--text-med);margin-bottom:16px">
        The following doctors have registered and are awaiting credential verification before they can access the platform.
      </p>
      ${pendingDoctors.map(d => `
      <div class="verify-row">
        <div class="verify-avatar">${d.avatar}</div>
        <div class="verify-info">
          <div class="verify-name">${d.name}</div>
          <div class="verify-meta">📧 ${d.email} · 📞 ${d.phone||'—'}</div>
          <div class="verify-tags">
            <span class="verify-tag">🏥 ${d.specialization||'—'}</span>
            <span class="verify-tag">🎓 ${d.qualification||'—'}</span>
            <span class="verify-tag">⏱ ${d.experience||'—'}</span>
            <span class="verify-tag">📅 Applied: ${d.appliedAt?formatDate(d.appliedAt.split('T')[0]):'Today'}</span>
          </div>
        </div>
        <div class="verify-actions">
          <button class="btn btn-sm btn-green" onclick="verifyDoctor('${d.id}','approved')">✓ Approve</button>
          <button class="btn btn-sm btn-outline" onclick="viewDoctorDetails('${d.id}')">View Details</button>
          <button class="btn btn-sm btn-danger" onclick="openRejectModal('${d.id}')">✕ Reject</button>
        </div>
      </div>`).join('')}
    </div>` : ''}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div class="section-tabs" style="margin-bottom:0">
        ${[['all','All Users'],['patient','Patients'],['doctor','Doctors'],['verification','Verification'],['admin','Admins']].map(([v,l])=>`
          <button class="section-tab ${filterRole===v?'active':''}" onclick="window._adminUserFilter='${v}';showPage('admin-users')">
            ${l}${v==='verification'&&pendingDoctors.length?` <span style="background:var(--warning);color:white;border-radius:99px;padding:1px 6px;font-size:0.7rem;font-weight:700;margin-left:4px">${pendingDoctors.length}</span>`:''}
          </button>`).join('')}
      </div>
    </div>

    <div class="card">
      ${filterRole === 'verification' ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Doctor</th><th>Specialization</th><th>Qualification</th><th>Applied</th><th>Verification</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(d=>{
              const vs = d.verificationStatus || 'pending';
              const vb = { approved:'verify-badge-approved', pending:'verify-badge-pending', rejected:'verify-badge-rejected' };
              const vi = { approved:'✅ Approved', pending:'⏳ Pending', rejected:'❌ Rejected' };
              return `<tr>
                <td><div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;border-radius:50%;background:#1565C0;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem">${d.avatar}</div>
                  <div><div style="font-weight:600">${d.name}</div><div style="font-size:0.78rem;color:var(--text-light)">${d.email}</div></div>
                </div></td>
                <td>${d.specialization||'—'}</td>
                <td>${d.qualification||'—'}</td>
                <td>${d.appliedAt?formatDate(d.appliedAt.split('T')[0]):'—'}</td>
                <td><span class="badge ${vb[vs]||'badge-gray'}">${vi[vs]}</span></td>
                <td style="white-space:nowrap">
                  <button class="btn btn-sm btn-outline" onclick="viewDoctorDetails('${d.id}')">Details</button>
                  ${vs==='pending'?`<button class="btn btn-sm btn-green" onclick="verifyDoctor('${d.id}','approved')">✓ Approve</button> <button class="btn btn-sm btn-danger" onclick="openRejectModal('${d.id}')">✕ Reject</button>`:''}
                  ${vs==='approved'?`<button class="btn btn-sm btn-danger" onclick="openRejectModal('${d.id}')">Revoke</button>`:''}
                  ${vs==='rejected'?`<button class="btn btn-sm btn-green" onclick="verifyDoctor('${d.id}','approved')">Re-Approve</button>`:''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u=>{
              const isDr = u.role==='doctor';
              const vs   = isDr ? (u.verificationStatus||'pending') : null;
              const vb   = { approved:'badge-green', pending:'badge-yellow', rejected:'badge-red' };
              return `<tr>
                <td><div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;border-radius:50%;background:${u.role==='doctor'?'#1565C0':u.role==='admin'?'#C62828':'var(--primary)'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem">${u.avatar}</div>
                  <div><div style="font-weight:600">${u.name}</div><div style="font-size:0.78rem;color:var(--text-light)">${u.email}</div></div>
                </div></td>
                <td><span class="role-badge ${u.role}">${u.role}</span></td>
                <td>${u.phone||'—'}</td>
                <td>${isDr?`<span class="badge ${vb[vs]||'badge-gray'}">${vs==='approved'?'✅ Verified':vs==='pending'?'⏳ Pending':'❌ Rejected'}</span>`:'<span class="badge badge-green">Active</span>'}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="adminEditUser('${u.id}')">Edit</button>
                  ${isDr&&vs==='pending'?`<button class="btn btn-sm btn-green" onclick="verifyDoctor('${u.id}','approved')">✓ Approve</button>`:''}
                  ${u.id === currentUser.id
                    ? '<span style="font-size:0.72rem;color:var(--text-light);padding:4px 8px;background:var(--bg);border-radius:6px;font-weight:600">You</span>'
                    : `<button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${u.id}')">Delete</button>`
                  }
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;
}

function verifyDoctor(doctorId, decision) {
  const doctor = getUser(doctorId);
  if (!doctor) return;
  doctor.verificationStatus = decision;

  if (decision === 'approved') {
    // Notify doctor
    DB.notifications.push({
      id:genId('n'), userId:doctorId, type:'system', priority:'high', read:false,
      title:'🎉 Account Approved! Welcome to Panchakarma',
      message:`Congratulations ${doctor.name}! Your doctor account has been verified and approved by our admin team. You can now sign in and access your full dashboard.`,
      createdAt: new Date().toISOString(),
    });
    // Notify admin
    DB.notifications.push({
      id:genId('n'), userId:currentUser.id, type:'system', priority:'normal', read:true,
      title:`✅ Doctor Approved — ${doctor.name}`,
      message:`${doctor.name} (${doctor.specialization}) has been approved and can now access the platform.`,
      createdAt: new Date().toISOString(),
    });
    showToast(`✅ ${doctor.name} approved and notified!`, 'success');
  }
  showPage('admin-users');
}

function openRejectModal(doctorId) {
  const doctor = getUser(doctorId);
  const isRevoke = doctor?.verificationStatus === 'approved';
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${isRevoke ? '⚠️ Revoke Access' : '❌ Reject Application'}</div>
      <button class="modal-close" onclick="closeMod()">✕</button>
    </div>
    <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-bottom:20px">
      <div style="font-weight:700">${doctor?.name}</div>
      <div style="font-size:0.82rem;color:var(--text-light)">${doctor?.specialization} · ${doctor?.email}</div>
    </div>
    <div class="form-row">
      <label>${isRevoke ? 'Reason for Revoking Access' : 'Reason for Rejection'} *</label>
      <select id="reject-reason" onchange="toggleCustomReason(this.value)">
        <option value="">Select a reason…</option>
        <option value="Credentials could not be verified">Credentials could not be verified</option>
        <option value="Qualification documents incomplete">Qualification documents incomplete</option>
        <option value="Not affiliated with registered clinic">Not affiliated with registered clinic</option>
        <option value="Duplicate account detected">Duplicate account detected</option>
        <option value="Policy violation">Policy violation</option>
        <option value="custom">Other (specify below)</option>
      </select>
    </div>
    <div class="form-row" id="custom-reason-row" style="display:none">
      <label>Custom Reason</label>
      <textarea id="reject-custom" placeholder="Describe the reason…" rows="3"></textarea>
    </div>
    <p style="font-size:0.82rem;color:var(--text-light);margin-bottom:4px">
      ${isRevoke ? 'The doctor will lose access immediately and be notified.' : 'The applicant will be notified with this reason.'}
    </p>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmReject('${doctorId}','${isRevoke}')">${isRevoke ? 'Revoke Access' : 'Reject Application'}</button>
    </div>`);
}

function toggleCustomReason(val) {
  const row = document.getElementById('custom-reason-row');
  if (row) row.style.display = val === 'custom' ? '' : 'none';
}

function confirmReject(doctorId, isRevoke) {
  const reasonSel = document.getElementById('reject-reason')?.value;
  const reasonCustom = document.getElementById('reject-custom')?.value?.trim();
  if (!reasonSel) { showToast('Please select a reason', 'error'); return; }
  const reason = reasonSel === 'custom' ? reasonCustom || 'No reason provided' : reasonSel;

  const doctor = getUser(doctorId);
  if (!doctor) return;

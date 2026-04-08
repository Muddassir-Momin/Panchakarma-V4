/* ================================================
   DOCTOR — Treatments, Prescriptions (with shop availability check)
   ================================================ */

        </div>
      </div>
    </div>
    <div class="form-row">
      <label>Working Days</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`
          <label style="display:flex;align-items:center;gap:5px;padding:6px 12px;border:2px solid var(--border);border-radius:99px;cursor:pointer;font-size:0.82rem;font-weight:600;transition:all 0.15s;${(dr.workingDays||['Mon','Tue','Wed','Thu','Fri']).includes(day)?'background:var(--primary);color:white;border-color:var(--primary)':'color:var(--text-med)'}">
            <input type="checkbox" ${(dr.workingDays||['Mon','Tue','Wed','Thu','Fri']).includes(day)?'checked':''}
                   value="${day}" class="cap-day-cb" style="display:none"
                   onchange="this.closest('label').style.cssText=this.checked?'display:flex;align-items:center;gap:5px;padding:6px 12px;border:2px solid var(--primary);border-radius:99px;cursor:pointer;font-size:0.82rem;font-weight:600;background:var(--primary);color:white':'display:flex;align-items:center;gap:5px;padding:6px 12px;border:2px solid var(--border);border-radius:99px;cursor:pointer;font-size:0.82rem;font-weight:600;color:var(--text-med)'">
            ${day}
          </label>`).join('')}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-green" onclick="saveCapacitySettings()">Save Settings</button>
    </div>`);
}

function saveCapacitySettings() {
  const dr = DB.users.find(u=>u.id===currentUser.id);
  if (!dr) return;
  dr.dailyLimit  = parseInt(document.getElementById('cap-slider').value) || 8;
  dr.workStart   = document.getElementById('cap-start')?.value || '09:00';
  dr.workEnd     = document.getElementById('cap-end')?.value   || '18:00';
  dr.workingDays = [...document.querySelectorAll('.cap-day-cb:checked')].map(cb=>cb.value);
  Object.assign(currentUser, dr);
  closeMod();
  showToast(`Daily limit set to ${dr.dailyLimit} patients/day ✅`, 'success');
  showPage('doctor-schedule');
}

function markSessionComplete(id) {
  const s = DB.sessions.find(s=>s.id===id);
  if (!s) return;
  const th = getTherapy(s.therapyId);
  const pt = getUser(s.patientId);
  openModal(`
    <div class="modal-header">
      <div class="modal-title">✅ Complete Session</div>
      <button class="modal-close" onclick="closeMod()">✕</button>
    </div>
    <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:16px;font-size:0.85rem">
      <strong>${th?.name||'Session'}</strong> with
      <strong>${pt?.name||'Patient'}</strong> (${pt?.patientCode||'—'})
      on ${formatDate(s.date)} at ${formatTime(s.time)}
    </div>
    <div class="form-row">
      <label>Clinical Notes <span style="color:var(--text-light);font-weight:400">(optional — visible only to doctor)</span></label>
      <textarea id="complete-notes" rows="3" placeholder="e.g. Patient responded well. Reduced Vata symptoms. Recommend 3 follow-up sessions..."
                style="width:100%;padding:10px;border:2px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-sans);font-size:0.9rem;resize:vertical">${s.clinicalNotes||''}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-green" onclick="confirmSessionComplete('${id}')">Mark Complete & Notify Patient</button>
    </div>`);
}

function confirmSessionComplete(id) {
  const s = DB.sessions.find(s=>s.id===id);
  if (!s) return;
  s.status = 'completed';
  s.clinicalNotes = document.getElementById('complete-notes')?.value?.trim() || '';
  s.completedAt   = new Date().toISOString();
  const th = getTherapy(s.therapyId);
  DB.notifications.push({
    id:genId('n'), userId:s.patientId, type:'post_procedure', priority:'high', read:false,
    title:`Post-Session Care: ${th?.name||'Session'}`,
    message:`Your ${th?.name||'session'} with ${currentUser.name} is complete. Rest for 2 hours. Consume warm light food. Avoid cold water and direct sunlight for 24 hours.`,
    createdAt:new Date().toISOString(),
  });
  closeMod();
  showToast('Session marked complete! Patient notified.','success');
  showPage('doctor-schedule');
}

// ═══════════════════════════════════════════════════════════
// DOCTOR — TREATMENTS
// ═══════════════════════════════════════════════════════════
function renderDoctorTreatments(el) {
  const tab = window._treatmentsTab || 'patients';
  const myPatientIds = [...new Set(DB.sessions.filter(s=>s.doctorId===currentUser.id).map(s=>s.patientId))];
  const myPatients   = DB.users.filter(u => myPatientIds.includes(u.id));
  const allRx        = DB.prescriptions.filter(p => p.doctorId === currentUser.id);

  el.innerHTML = `
    <div class="page-header"><h2>🌿 Treatment Management</h2><p>Manage patient treatment plans and prescriptions</p></div>
    <div class="section-tabs">
      <button class="section-tab ${tab==='patients'?'active':''}"   onclick="window._treatmentsTab='patients';showPage('doctor-treatments')">🧘 Patients (${myPatients.length})</button>
      <button class="section-tab ${tab==='prescriptions'?'active':''}" onclick="window._treatmentsTab='prescriptions';showPage('doctor-treatments')">💊 Prescriptions (${allRx.length})</button>
      <button class="section-tab ${tab==='milestones'?'active':''}"  onclick="window._treatmentsTab='milestones';showPage('doctor-treatments')">🏆 Milestones</button>
    </div>

    ${tab==='patients' ? `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      ${myPatients.length ? myPatients.map(p => {
        const pMilestones = DB.milestones.filter(m=>m.patientId===p.id);
        const pSessions   = DB.sessions.filter(s=>s.patientId===p.id&&s.doctorId===currentUser.id);
        const pRx         = DB.prescriptions.filter(r=>r.patientId===p.id&&r.doctorId===currentUser.id);
        const activeMile  = pMilestones.find(m=>m.status==='in_progress');
        const done        = pMilestones.filter(m=>m.status==='completed').length;
        const overallPct  = pMilestones.length ? Math.round(done/pMilestones.length*100) : 0;
        return `<div class="card" style="padding:20px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem">${p.avatar}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:0.95rem">${p.name}</div>
              <div style="font-size:0.78rem;color:var(--text-light)">${p.dosha} Dosha · Age ${calcAge(p.dob)||'—'}</div>
            </div>
            <span class="dosha-badge dosha-${p.dosha?.toLowerCase().split('-')[0]||'vata'}">${p.dosha||'—'}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;text-align:center">
            <div style="background:var(--bg);border-radius:var(--radius-sm);padding:8px">
              <div style="font-weight:700;color:var(--primary)">${pSessions.length}</div>
              <div style="font-size:0.7rem;color:var(--text-light)">Sessions</div>
            </div>
            <div style="background:var(--bg);border-radius:var(--radius-sm);padding:8px">
              <div style="font-weight:700;color:var(--success)">${pRx.length}</div>
              <div style="font-size:0.7rem;color:var(--text-light)">Prescriptions</div>
            </div>
            <div style="background:var(--bg);border-radius:var(--radius-sm);padding:8px">
              <div style="font-weight:700;color:var(--accent)">${overallPct}%</div>
              <div style="font-size:0.7rem;color:var(--text-light)">Progress</div>
            </div>
          </div>

          ${activeMile ? `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">
              <span style="color:var(--text-med)">Current: ${activeMile.name}</span>
              <span style="font-weight:700;color:var(--primary)">${activeMile.pct}%</span>
            </div>
            <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${activeMile.pct}%"></div></div>
          </div>` : ''}

          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-sm btn-green" onclick="openPrescriptionModal('${p.id}')">✍️ Prescribe</button>
            <button class="btn btn-sm btn-outline" onclick="updateMilestone('${p.id}')">🏆 Milestones</button>
            <button class="btn btn-sm btn-outline" onclick="sendNotificationToPatient('${p.id}')">📨 Notify</button>
            <button class="btn btn-sm btn-outline" onclick="viewPatientDetails('${p.id}')">👁 View</button>
          </div>
        </div>`;
      }).join('') : '<div class="empty-state"><span class="empty-state-icon">🧘</span><p>No patients assigned yet</p></div>'}
    </div>` : ''}

    ${tab==='prescriptions' ? `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn btn-green" onclick="openPrescriptionModal(null)">+ New Prescription</button>
    </div>
    ${allRx.length ? allRx.sort((a,b)=>b.date.localeCompare(a.date)).map(rx => {
      const pt = getUser(rx.patientId);
      return `<div class="card" style="margin-bottom:12px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${pt?.avatar||'?'}</div>
            <div>
              <div style="font-weight:700">${pt?.name||'—'}</div>
              <div style="font-size:0.78rem;color:var(--text-light)">📅 ${formatDate(rx.date)} · ${rx.medicines?.length||0} medicine(s)</div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="viewPrescriptionDetail('${rx.id}')">View Details</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
          ${(rx.medicines||[]).map(m=>`<span style="background:var(--bg);border-radius:99px;padding:3px 10px;font-size:0.78rem;font-weight:600;color:var(--primary)">💊 ${m.name}</span>`).join('')}
        </div>
        ${rx.diet?`<div style="font-size:0.82rem;color:var(--text-med)">🥗 <strong>Diet:</strong> ${rx.diet.slice(0,80)}${rx.diet.length>80?'…':''}</div>`:''}
      </div>`;
    }).join('') : '<div class="empty-state"><span class="empty-state-icon">💊</span><p>No prescriptions written yet</p></div>'}` : ''}

    ${tab==='milestones' ? `
    <div class="card">
      <div class="card-header"><span class="card-title">All Patient Milestones</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Milestone</th><th>Status</th><th>Progress</th><th>Target Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${DB.milestones.filter(m => myPatientIds.includes(m.patientId)).map(m => {
              const pt = getUser(m.patientId);
              return `<tr>
                <td>${pt?.name||'—'}</td>
                <td>${m.name}</td>

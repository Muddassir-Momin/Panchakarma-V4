/* ================================================
   ADMIN — Therapy Catalog
   ================================================ */

  doctor.verificationStatus = 'rejected';
  doctor.rejectionReason    = reason;

  DB.notifications.push({
    id:genId('n'), userId:doctorId, type:'system', priority:'high', read:false,
    title: isRevoke === 'true' ? '⚠️ Your Access Has Been Revoked' : '❌ Doctor Application Rejected',
    message: isRevoke === 'true'
      ? `Your doctor account access has been revoked. Reason: ${reason}. Please contact admin@panchakarma.com for more information.`
      : `Your doctor application was not approved. Reason: ${reason}. You may re-apply with updated credentials or contact admin@panchakarma.com.`,
    createdAt: new Date().toISOString(),
  });

  closeMod();
  showToast(`${isRevoke==='true'?'Access revoked':'Application rejected'} — ${doctor.name} notified`, 'warning');
  showPage('admin-users');
}

function viewDoctorDetails(doctorId) {
  const d = getUser(doctorId);
  if (!d) return;
  const vs = d.verificationStatus || 'pending';
  const vColor = { approved:'var(--success)', pending:'var(--warning)', rejected:'var(--danger)' };
  const dSessions = DB.sessions.filter(s => s.doctorId === d.id);
  openModal(`
    <div class="modal-header">
      <div class="modal-title">Doctor Application Details</div>
      <button class="modal-close" onclick="closeMod()">✕</button>
    </div>
    <div style="display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,var(--primary),var(--primary-mid));border-radius:var(--radius-md);padding:18px;color:white;margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700">${d.avatar}</div>
      <div>
        <div style="font-family:var(--font-serif);font-size:1.25rem;font-weight:700">${d.name}</div>
        <div style="font-size:0.82rem;opacity:0.85">${d.specialization} · ${d.qualification}</div>
        <div style="margin-top:6px;display:inline-block;background:rgba(255,255,255,0.15);padding:3px 10px;border-radius:99px;font-size:0.75rem;font-weight:700">${vs.toUpperCase()}</div>
      </div>
    </div>
    ${[
      ['📧 Email', d.email],
      ['📞 Phone', d.phone||'—'],
      ['🏥 Specialization', d.specialization||'—'],
      ['🎓 Qualification', d.qualification||'—'],
      ['⏱ Experience', d.experience||'—'],
      ['📅 Applied On', d.appliedAt ? formatDate(d.appliedAt.split('T')[0]) : 'Today'],
      ['📊 Sessions (if any)', dSessions.length + ' sessions'],
      ...(d.rejectionReason ? [['❌ Rejection Reason', d.rejectionReason]] : []),
    ].map(([k,v]) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:0.88rem">
        <span style="color:var(--text-med)">${k}</span>
        <span style="font-weight:600;color:${k.includes('Reason')?'var(--danger)':'var(--text)'}">${v}</span>
      </div>`).join('')}
    <div class="modal-footer" style="margin-top:16px">
      <button class="btn btn-outline" onclick="closeMod()">Close</button>
      ${vs==='pending'||vs==='rejected'?`<button class="btn btn-green" onclick="closeMod();verifyDoctor('${d.id}','approved')">✅ Approve</button>`:''}
      ${vs==='pending'?`<button class="btn btn-danger" onclick="closeMod();openRejectModal('${d.id}')">❌ Reject</button>`:''}
      ${vs==='approved'?`<button class="btn btn-danger" onclick="closeMod();openRejectModal('${d.id}')">⚠️ Revoke Access</button>`:''}
    </div>`);
}

function openAdminAddUserModal() {
  openModal(`
    <div class="modal-header"><div class="modal-title">Add New User</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div class="form-grid">
      <div class="form-row required"><label>Full Name</label><input type="text" id="au-name"></div>
      <div class="form-row required"><label>Email</label><input type="email" id="au-email"></div>
      <div class="form-row required"><label>Role</label><select id="au-role"><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="admin">Admin</option></select></div>
      <div class="form-row"><label>Phone</label><input type="tel" id="au-phone"></div>
      <div class="form-row required"><label>Password</label><input type="password" id="au-pw" value="demo123"></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeMod()">Cancel</button><button class="btn btn-green" onclick="adminAddUser()">Add User</button></div>`);
}
function adminAddUser() {
  const name=document.getElementById('au-name').value, email=document.getElementById('au-email').value;
  if(!name||!email){showToast('Name and email required','error');return;}
  const role=document.getElementById('au-role').value;
  DB.users.push({ id:genId('u'), name, email, password:document.getElementById('au-pw').value, role, phone:document.getElementById('au-phone').value, avatar:name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase() });
  closeMod(); showToast(`User ${name} added!`,'success'); showPage('admin-users');
}
function adminEditUser(id) {

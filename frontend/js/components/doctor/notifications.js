/* ================================================
   DOCTOR — Notifications (new: low stock, bookings, feedback)
   ================================================ */

// DOCTOR — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
let doctorNotifFilter = 'all';
function renderDoctorNotifications(el) {
  const myNotifs = DB.notifications.filter(n => n.userId === currentUser.id);
  const filtered = doctorNotifFilter === 'all' ? myNotifs
    : myNotifs.filter(n => n.type === doctorNotifFilter);
  const unread = myNotifs.filter(n => !n.read).length;

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div><h2>🔔 Notifications</h2><p>${unread} unread notification${unread!==1?'s':''}</p></div>
        <button class="btn btn-sm btn-outline" onclick="doctorMarkAllRead()">✓ Mark All Read</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${[['all','All'],['system','System'],['general','General'],['appointment','Appointment'],['prescription','Prescription']].map(([v,l])=>
        `<button class="filter-btn ${doctorNotifFilter===v?'active':''}" onclick="setDoctorNotifFilter('${v}')">${l}</button>`
      ).join('')}
    </div>
    <div class="card">
      ${filtered.length
        ? filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(n => `
          <div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;${n.read?'opacity:0.75':''}" onclick="doctorMarkRead('${n.id}')">
            <div style="width:40px;height:40px;border-radius:50%;background:${n.priority==='high'||n.priority==='critical'?'#fce4ec':'var(--primary-pale)'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">
              ${n.type==='system'?'⚙️':n.type==='general'?'📢':n.type==='prescription'?'💊':'🔔'}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:${n.read?'600':'700'};font-size:0.9rem;margin-bottom:3px">${n.title}</div>
              <div style="font-size:0.82rem;color:var(--text-med);line-height:1.4">${n.message}</div>
              <div style="font-size:0.72rem;color:var(--text-light);margin-top:5px">${relativeTime(n.createdAt)}</div>
            </div>
            <div style="flex-shrink:0;display:flex;align-items:flex-start;padding-top:4px">
              ${!n.read ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:block"></span>' : ''}
            </div>
          </div>`).join('')
        : `<div class="empty-state"><span class="empty-state-icon">🔔</span><p>No notifications in this category</p></div>`
      }
    </div>`;
}
function setDoctorNotifFilter(f) { doctorNotifFilter=f; showPage('doctor-notifications'); }
function doctorMarkRead(id) {
  const n=DB.notifications.find(n=>n.id===id);
  if(n) n.read=true;
  buildNav();
  showPage('doctor-notifications');
}
function doctorMarkAllRead() {
  DB.notifications.filter(n=>n.userId===currentUser.id).forEach(n=>n.read=true);
  buildNav();
  showToast('All notifications marked as read','success');
  showPage('doctor-notifications');
}


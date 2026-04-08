/* ================================================
   SESSION — 30-min Timeout + Export Engine
   ================================================ */

                <td><strong>₹${o.total}</strong></td>
                <td><span class="order-mode-badge ${o.mode}" style="font-size:0.72rem">${o.mode==='online'?'💳 Online':'🏪 Pickup'}</span></td>
                <td>${o.pickupCode?`<strong style="color:var(--primary)">${o.pickupCode}</strong>`:'—'}</td>
                <td><span class="badge ${statusBadge[o.status]||'badge-gray'}">${o.status}</span></td>
                <td style="white-space:nowrap">
                  ${o.status==='processing'?`<button class="btn btn-sm btn-info" onclick="adminUpdateOrder('${o.id}','shipped');showPage('admin-shop')">Ship</button> `:''}
                  ${o.status==='ready'?`<button class="btn btn-sm btn-green" onclick="markOrderCollected('${o.id}');showPage('admin-shop')">Collected</button> `:''}
                  ${!['delivered','cancelled'].includes(o.status)?`<button class="btn btn-sm btn-danger" onclick="adminUpdateOrder('${o.id}','cancelled');showPage('admin-shop')">Cancel</button>`:''}
                </td>
              </tr>`;
            }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:24px">No orders</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}
function openAdminAddProductModal() { openAddProductModal(); }
function adminUpdateOrder(orderId, newStatus) {
  const o = DB.orders.find(o => o.id === orderId);
  if (!o) return;
  o.status = newStatus;
  if (newStatus === 'shipped') {
    DB.notifications.push({ id: genId('n'), userId: o.patientId, type: 'system', title: '🚚 Your Order Has Been Shipped!', message: `Your herbal remedy order is on its way! Expected delivery in 1-2 days.`, priority: 'normal', read: false, createdAt: new Date().toISOString() });
  }
  showToast(`Order ${newStatus}`, newStatus === 'cancelled' ? 'warning' : 'success');
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENTS — Admin broadcasts to all users
// ═══════════════════════════════════════════════════════════
function renderAnnouncements(el) {
  const isAdmin = currentUser.role === 'admin';
  const myAudience = currentUser.role;
  const visible = DB.announcements
    .filter(a => a.audience === 'all' || a.audience === myAudience)
    .sort((a,b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><h2>📢 Announcements</h2><p>${isAdmin ? 'Broadcast messages to patients and doctors' : 'Latest news from the clinic'}</p></div>
        ${isAdmin ? `<button class="btn btn-green" onclick="openNewAnnouncementModal()">+ New Announcement</button>` : ''}
      </div>
    </div>

    ${visible.length ? visible.map(a => {
      const author = DB.users.find(u => u.id === a.authorId);
      const isNew  = Date.now() - new Date(a.createdAt).getTime() < 3 * 86400000;
      return `
      <div class="card" style="margin-bottom:16px;${a.pinned?'border-left:4px solid var(--primary);':''}" >
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            ${a.pinned ? '<span style="background:var(--primary);color:white;font-size:0.72rem;font-weight:700;padding:3px 9px;border-radius:99px">📌 PINNED</span>' : ''}
            ${isNew    ? '<span style="background:#e3f2fd;color:#1565C0;font-size:0.72rem;font-weight:700;padding:3px 9px;border-radius:99px">🆕 NEW</span>' : ''}
            <span class="badge ${a.audience==='all'?'badge-green':a.audience==='patient'?'badge-blue':'badge-yellow'}" style="font-size:0.72rem">
              ${a.audience === 'all' ? '👥 All Users' : a.audience === 'patient' ? '🧘 Patients' : '👨‍⚕️ Doctors'}
            </span>
          </div>
          ${isAdmin ? `
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" onclick="togglePin('${a.id}')">${a.pinned?'Unpin':'📌 Pin'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${a.id}')">Delete</button>
          </div>` : ''}
        </div>
        <div style="font-family:var(--font-serif);font-size:1.2rem;font-weight:700;color:var(--primary);margin-bottom:8px">${a.title}</div>
        <div style="font-size:0.9rem;color:var(--text-med);line-height:1.65">${a.message}</div>
        <div style="margin-top:12px;font-size:0.75rem;color:var(--text-light)">
          Posted by <strong>${author?.name || 'Admin'}</strong> · ${relativeTime(a.createdAt)}
        </div>
      </div>`;
    }).join('') : `
    <div class="empty-state"><span class="empty-state-icon">📢</span><p>No announcements yet</p>
    ${isAdmin ? `<button class="btn btn-green" onclick="openNewAnnouncementModal()" style="margin-top:12px">Create First Announcement</button>` : ''}</div>`}`;
}

function openNewAnnouncementModal() {
  openModal(`
    <div class="modal-header"><div class="modal-title">📢 New Announcement</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div class="form-row required"><label>Title</label><input type="text" id="ann-title" placeholder="Announcement headline…"></div>
    <div class="form-row required"><label>Message</label><textarea id="ann-message" rows="4" placeholder="Full announcement content…"></textarea></div>
    <div class="form-row"><label>Send To</label>
      <select id="ann-audience">
        <option value="all">👥 All Users (Patients + Doctors)</option>
        <option value="patient">🧘 Patients Only</option>
        <option value="doctor">👨‍⚕️ Doctors Only</option>
      </select>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <input type="checkbox" id="ann-pinned" style="width:16px;height:16px;accent-color:var(--primary)">
      <label for="ann-pinned" style="font-size:0.85rem;font-weight:600;color:var(--text-med);cursor:pointer">📌 Pin this announcement (appears at the top)</label>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <input type="checkbox" id="ann-notify" checked style="width:16px;height:16px;accent-color:var(--primary)">
      <label for="ann-notify" style="font-size:0.85rem;font-weight:600;color:var(--text-med);cursor:pointer">🔔 Also send as in-app notification</label>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-green" onclick="publishAnnouncement()">📢 Publish</button>
    </div>`);
}

function publishAnnouncement() {
  const title    = document.getElementById('ann-title')?.value?.trim();
  const message  = document.getElementById('ann-message')?.value?.trim();
  const audience = document.getElementById('ann-audience')?.value || 'all';
  const pinned   = document.getElementById('ann-pinned')?.checked;
  const notify   = document.getElementById('ann-notify')?.checked;

  if (!title)   { showToast('Please enter a title',   'error'); return; }
  if (!message) { showToast('Please enter a message', 'error'); return; }

  const ann = { id: genId('ann'), title, message, audience, pinned, authorId: currentUser.id, createdAt: new Date().toISOString() };
  DB.announcements.unshift(ann);

  if (notify) {
    // Send as notification to relevant users
    const targets = DB.users.filter(u => audience === 'all' || u.role === audience);
    targets.forEach(u => {
      DB.notifications.push({
        id: genId('n'), userId: u.id, type: 'system', priority: 'normal', read: false,
        title: `📢 ${title}`,
        message,
        createdAt: new Date().toISOString(),
      });
    });
    buildNav();
    showToast(`Announcement published & ${targets.length} users notified! 📢`, 'success');
  } else {
    showToast('Announcement published! 📢', 'success');
  }
  closeMod();
  showPage('announcements');
}

function togglePin(id) {
  const a = DB.announcements.find(a => a.id === id);
  if (a) { a.pinned = !a.pinned; showPage('announcements'); }
}

function deleteAnnouncement(id) {
  openModal(`
    <div class="modal-header"><div class="modal-title">Delete Announcement</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <p style="color:var(--text-med);margin-bottom:20px">This announcement will be permanently removed.</p>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-danger" onclick="DB.announcements=DB.announcements.filter(a=>a.id!=='${id}');closeMod();showPage('announcements')">Delete</button>
    </div>`);
}

// ── Show announcements banner on patient/doctor dashboards ──
function getAnnouncementsBanner() {
  const pinned = DB.announcements.find(a =>
    a.pinned && (a.audience === 'all' || a.audience === currentUser.role)
  );
  if (!pinned) return '';
  return `
    <div style="background:linear-gradient(135deg,#e8f5e9,#f0f7ee);border:1px solid #a5d6a7;border-left:4px solid var(--primary);border-radius:var(--radius-md);padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px;cursor:pointer" onclick="showPage('announcements')">
      <div style="font-size:1.4rem;flex-shrink:0">📢</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:0.9rem;color:var(--primary)">${pinned.title}</div>
        <div style="font-size:0.82rem;color:var(--text-med);margin-top:3px">${pinned.message.slice(0,100)}${pinned.message.length>100?'…':''}</div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-light);flex-shrink:0">View all →</div>
    </div>`;
}

// APP INIT — SPLASH
// ═══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('login-page').classList.add('active');
  }, 1800);
});

// ═══════════════════════════════════════════════════════════
// SESSION TIMEOUT (30 min idle → auto logout)
// ═══════════════════════════════════════════════════════════
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let _idleTimer = null;
let _warningTimer = null;

function resetIdleTimer() {
  clearTimeout(_idleTimer);
  clearTimeout(_warningTimer);
  const warnEl = document.getElementById('session-warning-toast');
  if (warnEl) warnEl.remove();
  if (!currentUser) return;

  // 25 min: show warning
  _warningTimer = setTimeout(() => {
    if (!currentUser) return;
    const div = document.createElement('div');
    div.id = 'session-warning-toast';
    div.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:9999;background:#fff3e0;border:2px solid var(--warning);border-radius:var(--radius-md);padding:14px 20px;font-size:0.88rem;font-weight:500;box-shadow:var(--shadow-lg);max-width:320px';
    div.innerHTML = `⏱ <strong>Session expiring in 5 minutes</strong><br><small>Move your mouse or click anywhere to stay signed in.</small>
      <button onclick="resetIdleTimer()" style="display:block;margin-top:8px;padding:5px 14px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem">Stay Signed In</button>`;
    document.body.appendChild(div);
  }, SESSION_TIMEOUT_MS - 5 * 60 * 1000);

  // 30 min: logout
  _idleTimer = setTimeout(() => {
    if (!currentUser) return;
    showToast('Session expired. Please sign in again.', 'warning');
    setTimeout(() => {
      currentUser = null;
      const warnEl = document.getElementById('session-warning-toast');
      if (warnEl) warnEl.remove();
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-page').classList.add('active');
    }, 1500);
  }, SESSION_TIMEOUT_MS);
}

['mousemove','keydown','click','touchstart','scroll'].forEach(evt => {
  document.addEventListener(evt, resetIdleTimer, { passive: true });
});

// ═══════════════════════════════════════════════════════════
// EXPORT ENGINE — CSV, Excel (XLSX), PDF, Word (HTML→doc)
// ═══════════════════════════════════════════════════════════

// ── Dataset builder ─────────────────────────────────────────
function getExportData(type) {
  if (type === 'patients') {
    return {
      title: 'Patient Report',
      headers: ['Patient ID','Name','Email','Phone','Gender','Dosha','Blood Group','Registered'],
      rows: DB.users.filter(u=>u.role==='patient').map(p=>[
        p.patientCode||'—', p.name, p.email, p.phone||'—',
        p.gender||'—', p.dosha||'—', p.bloodGroup||'—', p.registeredAt||'—'
      ]),
    };
  } else if (type === 'sessions') {
    return {
      title: 'All Sessions Report',
      headers: ['Patient ID','Patient Name','Doctor','Therapy','Date','Time','Status','Duration'],
      rows: DB.sessions.map(s=>{
        const pt=getUser(s.patientId), dr=getUser(s.doctorId), th=getTherapy(s.therapyId);
        return [pt?.patientCode||'—', pt?.name||'—', dr?.name||'—', th?.name||'—',
                s.date, s.time, s.status, (s.duration||60)+'min'];
      }),
    };
  } else if (type === 'revenue') {
    const rows = DB.sessions.filter(s=>s.status==='completed').map(s=>{
      const pt=getUser(s.patientId), dr=getUser(s.doctorId), th=getTherapy(s.therapyId);
      return [s.date, th?.name||'—', '₹'+(th?.price||0), dr?.name||'—', pt?.patientCode||'—', s.status];
    });
    const total = DB.sessions.filter(s=>s.status==='completed').reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);
    return {
      title: 'Revenue Report',
      subtitle: `Total Revenue: ₹${total.toLocaleString('en-IN')}`,
      headers: ['Date','Therapy','Price','Doctor','Patient ID','Status'],
      rows,
    };
  } else if (type === 'orders') {
    return {
      title: 'Shop Orders Report',
      headers: ['Order ID','Patient ID','Mode','Total','Status','Date','Pickup Code'],
      rows: DB.orders.map(o=>{
        const pt=getUser(o.patientId);
        return [o.id, pt?.patientCode||'—', o.mode, '₹'+o.total, o.status, o.placedAt||'—', o.pickupCode||'—'];
      }),
    };
  } else if (type === 'doctors') {
    return {
      title: 'Doctor Performance Report',
      headers: ['Name','Specialization','Status','Total Sessions','Completed','Avg Rating','Revenue'],
      rows: DB.users.filter(u=>u.role==='doctor').map(d=>{
        const sess = DB.sessions.filter(s=>s.doctorId===d.id);
        const comp = sess.filter(s=>s.status==='completed');
        const rev  = comp.reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0);
        const fb   = DB.feedback.filter(f=>sess.some(s=>s.id===f.sessionId));
        const avg  = fb.length ? (fb.reduce((s,f)=>s+f.rating,0)/fb.length).toFixed(1) : '—';
        return [d.name, d.specialization||'—', d.verificationStatus||'approved',
                sess.length, comp.length, avg, '₹'+rev.toLocaleString('en-IN')];
      }),
    };
  } else if (type === 'inventory') {
    return {
      title: 'Inventory / Stock Report',
      headers: ['Product','Category','Price','MRP','Stock','Status','Doctor'],
      rows: DB.products.map(p=>{
        const dr=getUser(p.doctorId);
        const status = p.stock<=0?'Out of Stock':p.stock<=5?'Low Stock':'In Stock';
        return [p.name, p.category, '₹'+p.price, '₹'+p.mrp, p.stock, status, dr?.name||'Clinic'];
      }),
    };
  } else if (type === 'feedback') {
    return {
      title: 'Patient Feedback Report',
      headers: ['Patient','Therapy','Date','Rating','Energy Level','Comments'],
      rows: DB.feedback.map(f=>{
        const pt=getUser(f.patientId), s=DB.sessions.find(ss=>ss.id===f.sessionId), th=s?getTherapy(s.therapyId):null;
        return [pt?.name||'—', th?.name||'—', f.submittedAt||'—', f.rating+'/10',
                (f.energyLevel||'').replace(/_/g,' '), f.comments||'—'];
      }),
    };
  }
  return { title: type, headers: [], rows: [] };
}

// ── CSV Export ──────────────────────────────────────────────
function exportCSV(type) {
  const data = getExportData(type);
  const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = [data.headers.map(esc).join(','), ...data.rows.map(r=>r.map(esc).join(','))].join('\n');
  triggerDownload(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}), type+'_report.csv');
  showToast(`✅ ${data.title} exported as CSV`, 'success');
}

// ── Excel (XLSX) Export ─────────────────────────────────────
function exportExcel(type) {
  if (typeof XLSX === 'undefined') { showToast('Excel library loading, try again…', 'warning'); return; }
  const data = getExportData(type);
  const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);

  // Style header row bold (basic)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({r:0, c:C})];
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '2D5016' } } };
  }

  // Auto column widths
  ws['!cols'] = data.headers.map((h, ci) => {
    const maxLen = Math.max(h.length, ...data.rows.map(r => String(r[ci]||'').length));
    return { wch: Math.min(maxLen + 2, 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, data.title.slice(0,31));

  // Add summary sheet for revenue
  if (type === 'revenue') {
    const summary = [
      ['Panchakarma Management Software — Revenue Summary'],
      ['Generated', new Date().toLocaleString('en-IN')],
      [],
      ['Total Sessions', DB.sessions.length],
      ['Completed Sessions', DB.sessions.filter(s=>s.status==='completed').length],
      ['Cancelled Sessions', DB.sessions.filter(s=>s.status==='cancelled').length],
      ['Total Revenue', '₹'+DB.sessions.filter(s=>s.status==='completed').reduce((sum,s)=>{const t=getTherapy(s.therapyId);return sum+(t?.price||0);},0).toLocaleString('en-IN')],
      ['Shop Revenue', '₹'+DB.orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0).toLocaleString('en-IN')],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    wsSummary['!cols'] = [{wch:30},{wch:30}];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }

  XLSX.writeFile(wb, type+'_report.xlsx');
  showToast(`✅ ${data.title} exported as Excel`, 'success');
}

// ── PDF Export ──────────────────────────────────────────────
function exportPDF(type) {
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    showToast('PDF library loading, try again…', 'warning'); return;
  }
  const { jsPDF } = window.jspdf;
  const data = getExportData(type);
  const doc  = new jsPDF({ orientation: data.rows.length > 10 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();

  // ── Header bar ──
  doc.setFillColor(45, 80, 22);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('Panchakarma Management Software', pageW/2, 9, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(data.title, pageW/2, 16, { align: 'center' });

  // ── Meta line ──
  doc.setTextColor(80, 80, 80); doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}   |   Total Records: ${data.rows.length}`, pageW/2, 27, { align: 'center' });
  if (data.subtitle) { doc.text(data.subtitle, pageW/2, 32, { align: 'center' }); }

  // ── Table ──
  doc.autoTable({
    head: [data.headers],
    body: data.rows,
    startY: data.subtitle ? 36 : 31,
    styles: { fontSize: 8, cellPadding: 3, lineColor: [229, 221, 208], lineWidth: 0.3 },
    headStyles: { fillColor: [45, 80, 22], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 247, 238] },
    columnStyles: {},
    margin: { left: 10, right: 10 },
    didDrawPage: (hookData) => {
      // Footer on every page
      const pgNum  = doc.internal.getCurrentPageInfo().pageNumber;
      const pgTotal= doc.internal.getNumberOfPages();
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text('Department of Computer Science & Engineering — Dr. J. J. Magdum College of Engineering', 10, doc.internal.pageSize.getHeight()-5);
      doc.text(`Page ${pgNum} of ${pgTotal}`, pageW-10, doc.internal.pageSize.getHeight()-5, { align: 'right' });
    },
  });

  doc.save(type+'_report.pdf');
  showToast(`✅ ${data.title} exported as PDF`, 'success');
}

// ── Word/Doc Export (HTML → .doc) ──────────────────────────
function exportWord(type) {
  const data = getExportData(type);
  const now  = new Date().toLocaleString('en-IN');

  const tableRows = data.rows.map(row =>
    `<tr>${row.map((cell,i) => `<td style="border:1px solid #ccc;padding:5pt 8pt;font-size:10pt;${i===0?'font-weight:bold':''}">${cell}</td>`).join('')}</tr>`
  ).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 2cm 1.5cm; }
  body  { font-family: "Times New Roman",serif; font-size:11pt; color:#1A1A1A; }
  h1    { font-size:16pt; color:#2D5016; text-align:center; margin-bottom:4pt; }
  h3    { font-size:11pt; color:#2D5016; text-align:center; font-weight:normal; margin-top:0; }
  .meta { font-size:9pt; color:#888; text-align:center; margin-bottom:12pt; }
  table { border-collapse:collapse; width:100%; margin-top:10pt; }
  thead tr { background:#2D5016; }
  thead th { color:#fff; font-size:9pt; padding:5pt 8pt; border:1px solid #2D5016; text-align:left; }
  tbody tr:nth-child(even){ background:#F0F7EE; }
  td { font-size:9pt; }
  .footer { font-size:8pt; color:#888; text-align:center; margin-top:16pt; border-top:1px solid #ddd; padding-top:6pt; }
</style></head>
<body>
<h1>Panchakarma Management Software</h1>
<h3>${data.title}</h3>
${data.subtitle ? `<div class="meta">${data.subtitle}</div>` : ''}
<div class="meta">Generated: ${now} &nbsp;|&nbsp; Total Records: ${data.rows.length}</div>
<table>
  <thead><tr>${data.headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">Department of Computer Science &amp; Engineering — Dr. J. J. Magdum College of Engineering, Jaysingpur</div>
</body></html>`;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  triggerDownload(blob, type+'_report.doc');
  showToast(`✅ ${data.title} exported as Word`, 'success');
}

// ── Trigger download helper ─────────────────────────────────
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Export modal — choose format ────────────────────────────
function openExportModal(type, label) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">⬇ Export — ${label}</div>
      <button class="modal-close" onclick="closeMod()">✕</button>
    </div>
    <p style="color:var(--text-med);font-size:0.88rem;margin-bottom:20px">Choose the format you want to download:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <button class="btn btn-outline" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="exportExcel('${type}');closeMod()">
        <span style="font-size:1.8rem">📊</span>
        <span style="font-weight:700">Excel (.xlsx)</span>
        <span style="font-size:0.75rem;color:var(--text-light)">Open in Excel / Sheets</span>
      </button>
      <button class="btn btn-outline" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="exportPDF('${type}');closeMod()">
        <span style="font-size:1.8rem">📄</span>
        <span style="font-weight:700">PDF (.pdf)</span>
        <span style="font-size:0.75rem;color:var(--text-light)">Print-ready report</span>
      </button>
      <button class="btn btn-outline" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="exportWord('${type}');closeMod()">
        <span style="font-size:1.8rem">📝</span>
        <span style="font-weight:700">Word (.doc)</span>
        <span style="font-size:0.75rem;color:var(--text-light)">Open in MS Word</span>
      </button>
      <button class="btn btn-outline" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="exportCSV('${type}');closeMod()">
        <span style="font-size:1.8rem">🗂</span>
        <span style="font-weight:700">CSV (.csv)</span>
        <span style="font-size:0.75rem;color:var(--text-light)">Raw data for analysis</span>
      </button>
    </div>
    <div class="modal-footer" style="justify-content:center;margin-top:16px">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
    </div>`);
}


// ═══════════════════════════════════════════════════════════
// SIGN-UP — show patient code after registration
// ═══════════════════════════════════════════════════════════
const _origDoSignup = typeof doSignup === 'function' ? doSignup : null;

// Patch the new-user flow to display the PKM code in a welcome modal
function onPatientSignupSuccess(user) {
  if (!user?.patientCode) return;
  openModal(`
    <div class="modal-header"><div class="modal-title">🌿 Welcome to Panchakarma!</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem;margin-bottom:12px">🎉</div>
      <div style="font-family:var(--font-serif);font-size:1.3rem;color:var(--primary);margin-bottom:8px">Your account is ready, ${user.name.split(' ')[0]}!</div>
      <div style="font-size:0.9rem;color:var(--text-med);margin-bottom:20px">Your unique Patient ID has been assigned:</div>
      <div style="background:linear-gradient(135deg,var(--primary),var(--primary-mid));color:white;border-radius:var(--radius-md);padding:18px 32px;display:inline-block;margin-bottom:20px">
        <div style="font-size:0.72rem;opacity:0.8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Patient ID</div>
        <div style="font-family:var(--font-serif);font-size:2rem;font-weight:700;letter-spacing:4px">${user.patientCode}</div>
      </div>
      <div style="font-size:0.82rem;color:var(--text-light);margin-bottom:20px">Keep this ID safe — use it for all future visits and appointments.</div>
    </div>
    <div class="modal-footer" style="justify-content:center">
      <button class="btn btn-green" onclick="closeMod()">Go to Dashboard →</button>
    </div>`);
}

// ═══════════════════════════════════════════════════════════
// MOBILE NAV — overflow scrollable fix
// ═══════════════════════════════════════════════════════════
(function patchMobileNav() {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 900px) {
      .header-nav {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding-bottom: 2px;
        gap: 2px;
      }
      .header-nav::-webkit-scrollbar { display: none; }
      .nav-btn { font-size: 0.75rem !important; padding: 7px 10px !important; }
      .nav-btn .nav-icon { display: inline-block; }
      .nav-btn .nav-label { display: none; }
    }
    @media (max-width: 600px) {
      .app-main { padding: 12px !important; }
      .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
      .page-header h2 { font-size: 1.4rem !important; }
      .modal-box { padding: 20px 16px !important; }
    }
  `;
  document.head.appendChild(style);
})();


// ADMIN EXPORT BUTTONS — inject into reports page
// ═══════════════════════════════════════════════════════════
function addExportButtons(containerEl) {
  if (!containerEl) return;
  const existing = containerEl.querySelector('#export-panel');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'export-panel';
  bar.innerHTML = `
    <div class="card" style="margin-bottom:20px;border:2px solid var(--primary)">
      <div class="card-header">
        <span class="card-title">⬇ Export Reports</span>
        <span style="font-size:0.78rem;color:var(--text-light)">PDF · Excel · Word · CSV</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
        ${[
          ['patients',  '👥 Patient Registry',      'All registered patients with IDs'],
          ['sessions',  '📅 All Sessions',           'Complete session history'],
          ['revenue',   '💰 Revenue Report',         'Therapy income + shop sales'],
          ['orders',    '🛒 Shop Orders',             'All herbal shop transactions'],
          ['doctors',   '👨‍⚕️ Doctor Performance',   'Sessions, ratings, revenue per doctor'],
          ['inventory', '📦 Stock / Inventory',      'All products with stock levels'],
          ['feedback',  '⭐ Patient Feedback',       'All ratings and comments'],
        ].map(([type, label, desc]) => `
          <div style="border:2px solid var(--border);border-radius:var(--radius-md);padding:14px;transition:all 0.2s;cursor:pointer"
               onmouseenter="this.style.borderColor='var(--primary)'" onmouseleave="this.style.borderColor='var(--border)'"
               onclick="openExportModal('${type}','${label}')">
            <div style="font-size:1.3rem;margin-bottom:5px">${label.split(' ')[0]}</div>
            <div style="font-weight:700;font-size:0.88rem;color:var(--text);margin-bottom:3px">${label.slice(label.indexOf(' ')+1)}</div>
            <div style="font-size:0.75rem;color:var(--text-light);margin-bottom:10px">${desc}</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              <span style="font-size:0.65rem;background:#e8f5e9;color:#2e7d32;padding:2px 7px;border-radius:99px;font-weight:600">📊 Excel</span>
              <span style="font-size:0.65rem;background:#fce4ec;color:#c62828;padding:2px 7px;border-radius:99px;font-weight:600">📄 PDF</span>
              <span style="font-size:0.65rem;background:#e3f2fd;color:#1565c0;padding:2px 7px;border-radius:99px;font-weight:600">📝 Word</span>
              <span style="font-size:0.65rem;background:var(--bg);color:var(--text-light);padding:2px 7px;border-radius:99px;font-weight:600">🗂 CSV</span>
            </div>
          </div>`
        ).join('')}
      </div>
    </div>`;
  containerEl.insertBefore(bar, containerEl.firstChild);
}




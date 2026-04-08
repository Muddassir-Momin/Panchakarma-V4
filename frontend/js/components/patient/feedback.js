/* ================================================
   PATIENT — Feedback + Edit
   ================================================ */

function markNotifRead(id) {
  const n = DB.notifications.find(n=>n.id===id);
  if (n) { n.read = true; buildNav(); showPage('patient-notifications'); }
}
function markAllNotifRead() {
  DB.notifications.filter(n=>n.userId===currentUser.id).forEach(n=>n.read=true);
  buildNav(); showToast('All notifications marked as read'); showPage('patient-notifications');
}

// ═══════════════════════════════════════════════════════════
// PATIENT — FEEDBACK
// ═══════════════════════════════════════════════════════════
let selectedRating = 0;
let editingFeedbackId = null; // null = new submission, string = editing existing

function renderPatientFeedback(el) {
  const completedSessions = DB.sessions.filter(s => s.patientId === currentUser.id && s.status === 'completed');
  const myFeedback = DB.feedback.filter(f => f.patientId === currentUser.id);

  el.innerHTML = `
    <div class="page-header"><h2>⭐ Session Feedback</h2><p>Share your Panchakarma experience</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <!-- Submit / Edit form -->
      <div class="card" id="feedback-form-card">
        <div class="card-header">
          <span class="card-title" id="fb-form-title">Submit New Feedback</span>
          ${editingFeedbackId ? `<button class="btn btn-sm btn-outline" onclick="cancelFeedbackEdit()">✕ Cancel Edit</button>` : ''}
        </div>
        <div class="form-row required">
          <label>Select Session</label>
          <select id="fb-session" ${editingFeedbackId ? 'disabled' : ''}>
            <option value="">Choose a completed session...</option>
            ${completedSessions.map(s => {
              const th = getTherapy(s.therapyId);
              const hasFb = DB.feedback.find(f => f.sessionId === s.id && f.patientId === currentUser.id);
              return `<option value="${s.id}" ${editingFeedbackId && DB.feedback.find(f=>f.id===editingFeedbackId)?.sessionId===s.id?'selected':''}>
                ${th?.name||'?'} — ${formatDate(s.date)}${hasFb&&!editingFeedbackId?' (feedback done)':''}
              </option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-row required">
          <label>Overall Rating (1–10)</label>
          <div class="rating-grid">
            ${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rating-btn ${selectedRating===n?'selected':''}" onclick="setRating(${n})">${n}</button>`).join('')}
          </div>
          <div class="rating-label" id="rating-label">${selectedRating ? getRatingLabel(selectedRating) : 'Select a rating'}</div>
        </div>
        <div class="form-row">
          <label>Symptom Changes</label>
          <textarea id="fb-symptoms" placeholder="Describe any changes in your symptoms..." rows="3">${editingFeedbackId ? (DB.feedback.find(f=>f.id===editingFeedbackId)?.symptoms||'') : ''}</textarea>
        </div>
        <div class="form-row required">
          <label>Energy Level</label>
          <select id="fb-energy">
            <option value="">Select energy level...</option>
            ${[['much_improved','😊 Much Improved'],['slightly_improved','🙂 Slightly Improved'],['no_change','😐 No Change'],['slightly_decreased','😕 Slightly Decreased'],['much_decreased','😞 Much Decreased']].map(([v,l])=>`<option value="${v}" ${editingFeedbackId&&DB.feedback.find(f=>f.id===editingFeedbackId)?.energyLevel===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Additional Comments</label>
          <textarea id="fb-comments" placeholder="Any other feedback for your practitioner..." rows="2">${editingFeedbackId ? (DB.feedback.find(f=>f.id===editingFeedbackId)?.comments||'') : ''}</textarea>
        </div>
        <button class="btn btn-green" style="width:100%;padding:13px;margin-top:4px" onclick="submitFeedback()">
          ${editingFeedbackId ? '💾 Update Feedback' : '★ Submit Feedback'}
        </button>
      </div>

      <!-- Previous Feedback List -->
      <div class="card">
        <div class="card-header"><span class="card-title">My Feedback History</span><span class="badge badge-blue">${myFeedback.length} submitted</span></div>
        ${myFeedback.length ? myFeedback.sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)).map(f => {
          const s = DB.sessions.find(ss=>ss.id===f.sessionId);
          const th = s ? getTherapy(s.therapyId) : null;
          const stars = '★'.repeat(Math.round(f.rating/2)) + '☆'.repeat(5-Math.round(f.rating/2));
          const isEditing = editingFeedbackId === f.id;
          return `<div style="border:2px solid ${isEditing?'var(--primary)':'var(--border)'};border-radius:var(--radius-md);padding:14px;margin-bottom:12px;transition:all 0.2s;${isEditing?'background:var(--primary-pale)':''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
              <div>
                <strong style="font-size:0.92rem">${th?.name||'Session'}</strong>
                <div style="font-size:0.75rem;color:var(--text-light);margin-top:2px">${formatDate(f.submittedAt)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                <span style="color:var(--accent);font-size:0.9rem">${stars}</span>
                <span style="font-weight:700;color:var(--primary);font-size:0.88rem">${f.rating}/10</span>
              </div>
            </div>
            ${f.symptoms?`<div style="font-size:0.85rem;color:var(--text-med);margin-bottom:6px;line-height:1.4">${f.symptoms}</div>`:''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
              <span class="badge badge-green" style="font-size:0.72rem">${(f.energyLevel||'').replace(/_/g,' ')}</span>
              <button class="btn btn-sm ${isEditing?'btn-outline':'btn-green'}" onclick="startFeedbackEdit('${f.id}')">
                ${isEditing ? '✕ Editing…' : '✏️ Edit'}
              </button>
            </div>
          </div>`;
        }).join('') : '<div class="empty-state"><span class="empty-state-icon">⭐</span><p>No feedback yet</p></div>'}
      </div>
    </div>`;

  // Pre-fill rating if editing
  if (editingFeedbackId) {
    const fb = DB.feedback.find(f => f.id === editingFeedbackId);
    if (fb) { selectedRating = fb.rating; }
  }
}

function startFeedbackEdit(feedbackId) {
  editingFeedbackId = feedbackId;
  const fb = DB.feedback.find(f => f.id === feedbackId);
  if (fb) selectedRating = fb.rating;
  showPage('patient-feedback');
  setTimeout(() => {
    const card = document.getElementById('feedback-form-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function cancelFeedbackEdit() {
  editingFeedbackId = null;
  selectedRating = 0;
  showPage('patient-feedback');
}

function setRating(n) {
  selectedRating = n;
  document.querySelectorAll('.rating-btn').forEach((b,i)=>{b.classList.toggle('selected',i+1===n);});
  const lbl = document.getElementById('rating-label');
  if(lbl) lbl.textContent = getRatingLabel(n);
}
function getRatingLabel(n) {
  if(n<=3) return '😞 Poor experience';
  if(n<=5) return '😐 Fair experience';
  if(n<=7) return '🙂 Good experience';
  if(n<=9) return '😊 Great experience!';
  return '🤩 Excellent — 10/10!';
}

function submitFeedback() {
  const sessionId = document.getElementById('fb-session').value;
  const energy    = document.getElementById('fb-energy').value;
  const symptoms  = document.getElementById('fb-symptoms')?.value || '';
  const comments  = document.getElementById('fb-comments')?.value || '';

  if (!sessionId || !selectedRating || !energy) {
    showToast('Please fill all required fields', 'error'); return;
  }

  if (editingFeedbackId) {
    // ── UPDATE existing feedback ──────────────────
    const fb = DB.feedback.find(f => f.id === editingFeedbackId);
    if (fb) {
      fb.rating      = selectedRating;
      fb.energyLevel = energy;
      fb.symptoms    = symptoms;
      fb.comments    = comments;
      fb.editedAt    = getDateStr(0);
    }
    editingFeedbackId = null;
    selectedRating = 0;
    showToast('Feedback updated successfully! 🙏', 'success');
  } else {
    // ── NEW feedback ──────────────────────────────
    const alreadyDone = DB.feedback.find(f => f.sessionId === sessionId && f.patientId === currentUser.id);
    if (alreadyDone) {
      showToast('You already submitted feedback for this session. Click ✏️ Edit to update it.', 'warning');
      return;
    }
    DB.feedback.push({
      id: genId('f'), patientId: currentUser.id, sessionId,
      rating: selectedRating, energyLevel: energy,

/* ================================================
   SHARED — Settings, Preferences
   ================================================ */

              <select id="prof-bg">
                ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=>`<option ${u.bloodGroup===g?'selected':''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-row"><label>Allergies / Sensitivities</label><input type="text" id="prof-allergy" value="${u.allergies||'None'}" placeholder="e.g. Sesame oil, Ghee..."></div>
            <div class="form-row"><label>Emergency Contact</label><input type="tel" id="prof-emergency" value="${u.emergencyContact||''}" placeholder="+91 XXXXX XXXXX"></div>
            ` : ''}
            ${u.role==='doctor' ? `
            <div class="form-row"><label>Specialization</label><input type="text" id="prof-spec" value="${u.specialization||''}"></div>
            <div class="form-row"><label>Qualification</label><input type="text" id="prof-qual" value="${u.qualification||''}"></div>
            <div class="form-row"><label>Years of Experience</label><input type="text" id="prof-exp" value="${u.experience||''}"></div>
            <div class="form-row full"><label>Bio / About</label><textarea id="prof-bio" placeholder="Brief professional bio..." rows="3">${u.bio||''}</textarea></div>
            ` : ''}
          </div>
          <div style="display:flex;gap:10px;margin-top:8px">
            <button class="btn btn-green" onclick="saveProfile()">💾 Save Changes</button>
            <button class="btn btn-outline" onclick="showPage('${currentUser.role}-dashboard')">Cancel</button>
          </div>
        </div>

        <!-- Change Password Card -->
        <div class="card" style="margin-top:0">
          <div class="card-title" style="margin-bottom:16px">🔒 Change Password</div>
          <div class="form-grid">
            <div class="form-row full">
              <label>Current Password</label>
              <div style="position:relative">
                <input type="password" id="pw-current" placeholder="Enter current password" style="padding-right:44px">
                <button onclick="togglePw('pw-current',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:var(--text-light)">👁️</button>
              </div>
            </div>
            <div class="form-row">
              <label>New Password</label>
              <div style="position:relative">
                <input type="password" id="pw-new" placeholder="Min. 6 characters" oninput="checkPasswordStrength(this.value)" style="padding-right:44px">
                <button onclick="togglePw('pw-new',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:var(--text-light)">👁️</button>
              </div>
              <div class="pw-strength-wrap" id="pw-strength-wrap">
                <div class="pw-strength-bar"><div class="pw-strength-fill" id="pw-strength-fill"></div></div>
                <div class="pw-strength-label" id="pw-strength-label"></div>
              </div>
            </div>
            <div class="form-row">
              <label>Confirm New Password</label>
              <div style="position:relative">
                <input type="password" id="pw-confirm" placeholder="Repeat new password" style="padding-right:44px">
                <button onclick="togglePw('pw-confirm',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:var(--text-light)">👁️</button>
              </div>
            </div>
          </div>
          <button class="btn btn-green" onclick="changePassword()">Update Password</button>
        </div>
      </div>
    </div>`;
}

function toggleAvatarPicker() {
  const p = document.getElementById('avatar-picker');
  if (p) p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
}

function changeAvatarColor(color) {
  const d = document.getElementById('profile-avatar-display');
  if (d) d.style.background = color;
  currentUser.avatarColor = color;
  // Update header avatar too
  const ha = document.getElementById('header-avatar');
  if (ha) ha.style.background = color;
  showToast('Avatar colour updated!', 'success');
  toggleAvatarPicker();
}

function saveProfile() {
  const u = currentUser;
  u.name  = document.getElementById('prof-name')?.value?.trim()  || u.name;
  u.phone = document.getElementById('prof-phone')?.value?.trim() || '';
  u.address = document.getElementById('prof-addr')?.value?.trim() || '';

  if (u.role === 'patient') {
    u.dob           = document.getElementById('prof-dob')?.value       || u.dob;
    u.gender        = document.getElementById('prof-gender')?.value    || u.gender;
    u.dosha         = document.getElementById('prof-dosha')?.value     || u.dosha;
    u.bloodGroup    = document.getElementById('prof-bg')?.value        || u.bloodGroup;
    u.allergies     = document.getElementById('prof-allergy')?.value   || u.allergies;
    u.emergencyContact = document.getElementById('prof-emergency')?.value || u.emergencyContact;
  }
  if (u.role === 'doctor') {
    u.specialization = document.getElementById('prof-spec')?.value?.trim() || u.specialization;
    u.qualification  = document.getElementById('prof-qual')?.value?.trim() || u.qualification;
    u.experience     = document.getElementById('prof-exp')?.value?.trim()  || u.experience;
    u.bio            = document.getElementById('prof-bio')?.value?.trim()  || '';
  }

  // Update avatar initials from name
  const parts = u.name.trim().split(' ').filter(Boolean);
  u.avatar = parts.length >= 2
    ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
    : parts[0].slice(0,2).toUpperCase();

  // Sync with DB
  const dbUser = DB.users.find(x => x.id === u.id);
  if (dbUser) Object.assign(dbUser, u);

  // Update header
  const ha = document.getElementById('header-avatar');
  if (ha) ha.childNodes[0].textContent = u.avatar;

  showToast('Profile saved successfully! 🌿', 'success');
  showPage('profile');
}

function changePassword() {
  const current = document.getElementById('pw-current')?.value;
  const newPw   = document.getElementById('pw-new')?.value;
  const confirm = document.getElementById('pw-confirm')?.value;

  if (!current)           { showToast('Please enter your current password', 'error');  return; }
  if (current !== currentUser.password) { showToast('Current password is incorrect', 'error'); return; }
  if (!newPw || newPw.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
  if (newPw !== confirm)  { showToast('New passwords do not match', 'error'); return; }
  if (newPw === current)  { showToast('New password must be different from current', 'warning'); return; }

  currentUser.password = newPw;
  const dbUser = DB.users.find(x => x.id === currentUser.id);
  if (dbUser) dbUser.password = newPw;

  // Clear fields
  ['pw-current','pw-new','pw-confirm'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const fill = document.getElementById('pw-strength-fill'); if (fill) fill.style.width = '0';
  const lbl  = document.getElementById('pw-strength-label'); if (lbl) lbl.textContent = '';

  showToast('Password changed successfully! 🔒', 'success');
}

// ═══════════════════════════════════════════════════════════
// SHARED — SETTINGS
// ═══════════════════════════════════════════════════════════
const USER_PREFS = {};  // per-session preferences store

function renderSettings(el) {
  const u = currentUser;
  const prefs = USER_PREFS[u.id] = USER_PREFS[u.id] || {
    emailNotif: true, smsReminders: true, preProcedure: true,
    postProcedure: true, generalUpdates: false, shopUpdates: true,
    language: 'en', theme: 'light', sessionTimeout: '30',
  };

  // Build recent activity from notifications
  const recentActivity = DB.notifications
    .filter(n => n.userId === u.id)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  el.innerHTML=`
    <div class="page-header"><h2>⚙️ Settings</h2><p>Preferences, security, and account management</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

      <!-- Notification Preferences -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">🔔 Notification Preferences</div>
        ${[
          ['emailNotif',    'Email Notifications',   'Receive updates and alerts via email',      prefs.emailNotif],

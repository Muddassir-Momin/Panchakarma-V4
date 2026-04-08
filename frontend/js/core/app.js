/* ================================================
   APP — Auth, Login, Signup, Logout, Splash, Init
   ================================================ */

};

let currentUser = null;
let currentPage = '';
let currentLoginRole = 'patient';
let signupRole = 'patient';

// ═══════════════════════════════════════════════════════════
// AUTH — MODE SWITCHING  (Sign In ↔ Sign Up)
// ═══════════════════════════════════════════════════════════
function switchAuthMode(mode) {
  document.getElementById('card-signin').classList.toggle('active', mode === 'signin');
  document.getElementById('card-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('tab-signin').classList.toggle('active', mode === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  ['signin-error','signup-error','signup-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('show'); el.textContent = ''; }
  });
}

// ═══════════════════════════════════════════════════════════
// AUTH — SIGN IN
// ═══════════════════════════════════════════════════════════
function switchLoginTab(role) { currentLoginRole = role; }  // legacy alias
function switchSigninRole(role, btn) {
  currentLoginRole = role;
  document.querySelectorAll('#signin-role-tabs .auth-role-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const errEl = document.getElementById('signin-error');
  if (errEl) errEl.classList.remove('show');
}

function demoLogin(role) {
  const DEMO = {
    patient: { email:'priya@demo.com',  password:'demo123'  },
    doctor:  { email:'doctor@demo.com', password:'demo123'  },
    admin:   { email:'admin@demo.com',  password:'admin123' },
  };
  const si = document.getElementById('signin-email');     if (si) si.value = DEMO[role].email;
  const sp = document.getElementById('signin-password');  if (sp) sp.value = DEMO[role].password;
  document.querySelectorAll('#signin-role-tabs .auth-role-tab').forEach((b,i) => {
    b.classList.toggle('active', ['patient','doctor','admin'][i] === role);
  });
  currentLoginRole = role;
  handleLogin();
}

function handleLogin() {
  const email = (document.getElementById('signin-email')?.value || '').trim();
  const pw    =  document.getElementById('signin-password')?.value || '';
  const errEl =  document.getElementById('signin-error');

  if (!email || !pw) {
    if (errEl) { errEl.textContent = 'Please enter your email and password.'; errEl.classList.add('show'); }
    return;
  }

  const btn = document.getElementById('signin-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span>Signing in…</span>'; }

  setTimeout(() => {
    const user = DB.users.find(u => u.email === email && u.password === pw);
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>Sign In</span><span>→</span>'; }
    if (!user) {
      if (errEl) { errEl.textContent = 'Invalid email or password. Please try again.'; errEl.classList.add('show'); }
      const card = document.getElementById('card-signin');
      if (card) { card.style.animation='none'; void card.offsetHeight; card.style.animation='shake 0.4s ease'; }
      return;
    }
    if (errEl) errEl.classList.remove('show');

    // ── DOCTOR VERIFICATION CHECK ──────────────────────────────
    if (user.role === 'doctor') {
      const status = user.verificationStatus || 'pending';
      if (status === 'pending' || status === 'rejected') {
        currentUser = user;
        showPendingScreen(user, status);
        return;
      }
    }

    currentUser = user;
    bootApp();
  }, 380);
}

// ═══════════════════════════════════════════════════════════
// DOCTOR VERIFICATION — PENDING / REJECTED SCREEN
// ═══════════════════════════════════════════════════════════
function showPendingScreen(user, status) {
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('pending-page').classList.add('active');

  const el = document.getElementById('pending-card-content');

  if (status === 'pending') {
    el.innerHTML = `
      <div class="pending-icon-wrap pending">
        <div class="pending-pulse"></div>
        ⏳
      </div>
      <div class="pending-title">Verification Pending</div>
      <div class="pending-subtitle">
        Your doctor application is under review by our clinic administrators.<br>
        You will receive access once your credentials are verified.
      </div>

      <div class="pending-steps">
        <div class="pending-step">
          <div class="pending-step-dot done">✓</div>
          <div class="pending-step-label">Registered</div>
        </div>
        <div class="pending-step">
          <div class="pending-step-dot active">🔍</div>
          <div class="pending-step-label">Under Review</div>
        </div>
        <div class="pending-step">
          <div class="pending-step-dot wait">✓</div>
          <div class="pending-step-label">Approved</div>
        </div>
        <div class="pending-step">
          <div class="pending-step-dot wait">🏠</div>
          <div class="pending-step-label">Dashboard</div>
        </div>
      </div>

      <div class="pending-info-box">
        <div class="pending-info-label">Your Application Details</div>
        <div class="pending-info-row"><span class="pending-info-key">Name</span><span class="pending-info-value">${user.name}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Email</span><span class="pending-info-value">${user.email}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Specialization</span><span class="pending-info-value">${user.specialization || '—'}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Qualification</span><span class="pending-info-value">${user.qualification || '—'}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Applied</span><span class="pending-info-value">${user.appliedAt ? formatDate(user.appliedAt.split('T')[0]) : 'Today'}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Status</span><span class="pending-info-value" style="color:var(--warning);font-weight:700">⏳ Awaiting Admin Approval</span></div>
      </div>

      <p style="font-size:0.82rem;color:var(--text-light);margin-bottom:20px;line-height:1.6">
        ⏱ Typical review time is <strong>24–48 hours</strong>.<br>
        You will receive an email notification once your account is approved or if additional information is required.
      </p>

      <button class="btn-primary" onclick="logoutFromPending()" style="margin-bottom:12px">← Back to Sign In</button>
      <button class="btn-primary" style="background:transparent;color:var(--primary);border:2px solid var(--primary);box-shadow:none" onclick="checkApprovalStatus()">🔄 Check Status</button>`;

  } else if (status === 'rejected') {
    el.innerHTML = `
      <div class="pending-icon-wrap rejected">
        ❌
      </div>
      <div class="pending-title">Application Rejected</div>
      <div class="pending-subtitle">
        Unfortunately your doctor application was not approved at this time.<br>
        Please contact the clinic administrator for more information.
      </div>

      <div class="pending-info-box rejected">
        <div class="pending-info-label">Rejection Details</div>
        <div class="pending-info-row"><span class="pending-info-key">Name</span><span class="pending-info-value">${user.name}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Email</span><span class="pending-info-value">${user.email}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Reason</span><span class="pending-info-value" style="color:var(--danger)">${user.rejectionReason || 'Credentials could not be verified'}</span></div>
        <div class="pending-info-row"><span class="pending-info-key">Status</span><span class="pending-info-value" style="color:var(--danger);font-weight:700">❌ Rejected</span></div>
      </div>

      <p style="font-size:0.82rem;color:var(--text-light);margin-bottom:20px;line-height:1.6">
        You may re-apply with updated credentials or contact us at <strong>admin@panchakarma.com</strong>.
      </p>

      <button class="btn-primary" onclick="logoutFromPending()">← Back to Sign In</button>`;
  }
}

function logoutFromPending() {
  currentUser = null;
  document.getElementById('pending-page').classList.remove('active');
  document.getElementById('login-page').classList.add('active');
  document.getElementById('signin-email').value = '';
  document.getElementById('signin-password').value = '';
  switchAuthMode('signin');
}

function checkApprovalStatus() {
  if (!currentUser) return;
  const fresh = DB.users.find(u => u.id === currentUser.id);
  if (!fresh) return;
  if (fresh.verificationStatus === 'approved') {
    currentUser = fresh;
    document.getElementById('pending-page').classList.remove('active');
    showToast('🎉 Your account has been approved! Welcome!', 'success');
    bootApp();
  } else {
    showToast('Still pending. Please check back later.', 'info');
    // Re-render in case status changed to rejected
    showPendingScreen(fresh, fresh.verificationStatus);
  }
}

function showForgotPassword() {
  openModal(`
    <div class="modal-header"><div class="modal-title">🔑 Reset Password</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <p style="color:var(--text-med);margin-bottom:20px;font-size:0.9rem;line-height:1.6">Enter your registered email and we will send you a reset link.</p>
    <div class="form-row"><label>Email Address</label><input type="email" id="forgot-email" placeholder="your@email.com"></div>
    <div id="forgot-msg" style="display:none;margin-top:12px;padding:10px 14px;border-radius:8px;font-size:0.85rem"></div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-green" onclick="sendPasswordReset()">Send Reset Link</button>
    </div>`);
}
function sendPasswordReset() {
  const email = document.getElementById('forgot-email')?.value?.trim();
  const msgEl = document.getElementById('forgot-msg');
  if (!email) { showToast('Please enter your email','error'); return; }
  const user = DB.users.find(u => u.email === email);
  if (!msgEl) return;
  msgEl.style.display = 'block';
  if (user) {
    msgEl.style.cssText = 'display:block;background:#e8f5e9;color:#2e7d32;margin-top:12px;padding:10px 14px;border-radius:8px;font-size:0.85px';
    msgEl.innerHTML = `✅ A reset link has been sent to <strong>${email}</strong>.`;
  } else {
    msgEl.style.cssText = 'display:block;background:#fce4ec;color:#c62828;margin-top:12px;padding:10px 14px;border-radius:8px;font-size:0.85px';
    msgEl.textContent = 'No account found with this email address.';
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH — SIGN UP
// ═══════════════════════════════════════════════════════════
function switchSignupRole(role, btn) {
  signupRole = role;
  document.querySelectorAll('#signup-role-tabs .auth-role-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('su-patient-fields').style.display = role === 'patient' ? '' : 'none';
  document.getElementById('su-doctor-fields').style.display  = role === 'doctor'  ? '' : 'none';
  clearSignupErrors();
}

function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId); if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁️';
}

function checkPasswordStrength(pw) {
  const wrap  = document.getElementById('pw-strength-wrap');
  const fill  = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!wrap) return;
  wrap.style.display = pw.length ? 'block' : 'none';
  let score = 0;
  if (pw.length >= 6)           score++;
  if (pw.length >= 10)          score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const lvls = [
    {p:20,c:'#DC3545',t:'Very Weak'},{p:40,c:'#fd7e14',t:'Weak'},
    {p:60,c:'#FFC107',t:'Fair'},{p:80,c:'#20c997',t:'Good'},{p:100,c:'#28A745',t:'Strong 💪'},
  ];
  const l = lvls[Math.min(score,5)-1] || lvls[0];
  fill.style.width=l.p+'%'; fill.style.background=l.c;
  label.style.color=l.c; label.textContent=l.t;
}

function clearSignupErrors() {
  ['su-firstname','su-lastname','su-email','su-password','su-confirm','su-spec'].forEach(id => {
    const el=document.getElementById(id); if(el) el.classList.remove('error');
    const er=document.getElementById('err-'+id); if(er) er.classList.remove('show');
  });
  ['signup-error','signup-success'].forEach(id => {
    const el=document.getElementById(id); if(el){el.classList.remove('show');el.textContent='';}
  });
}

function showFieldError(fid, msg) {
  const inp=document.getElementById(fid); if(inp) inp.classList.add('error');
  const err=document.getElementById('err-'+fid); if(err){err.textContent=msg;err.classList.add('show');}
}

function handleSignup() {
  clearSignupErrors();
  let valid = true;

  const first   = document.getElementById('su-firstname')?.value?.trim();
  const last    = document.getElementById('su-lastname')?.value?.trim();
  const email   = document.getElementById('su-email')?.value?.trim();
  const phone   = document.getElementById('su-phone')?.value?.trim();
  const pw      = document.getElementById('su-password')?.value;
  const confirm = document.getElementById('su-confirm')?.value;
  const terms   = document.getElementById('su-terms')?.checked;

  if (!first) { showFieldError('su-firstname','First name is required'); valid=false; }
  if (!last)  { showFieldError('su-lastname', 'Last name is required');  valid=false; }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRx.test(email)) { showFieldError('su-email','Enter a valid email address'); valid=false; }
  else if (DB.users.find(u=>u.email===email)) { showFieldError('su-email','This email is already registered'); valid=false; }

  if (!pw || pw.length < 6) { showFieldError('su-password','Minimum 6 characters required'); valid=false; }
  if (pw !== confirm)       { showFieldError('su-confirm','Passwords do not match');          valid=false; }

  if (signupRole==='doctor' && !document.getElementById('su-spec')?.value) {
    showFieldError('su-spec','Please select your specialization'); valid=false;
  }

  if (!terms) {
    const errEl=document.getElementById('signup-error');
    errEl.textContent='Please accept the Terms of Service to continue.'; errEl.classList.add('show');
    valid=false;
  }

  if (!valid) return;

  const btn = document.getElementById('signup-btn');
  if (btn) { btn.disabled=true; btn.innerHTML='<span>Creating account…</span>'; }

  setTimeout(() => {
    if (btn) { btn.disabled=false; btn.innerHTML='<span>Create Account</span><span>→</span>'; }

    const fullName = `${first} ${last}`;
    const avatar   = (first[0]+last[0]).toUpperCase();
    const isDr     = signupRole === 'doctor';
    const newUser  = {
      id: genId('u'), name:fullName, email, password:pw, role:signupRole,
      phone:phone||'', avatar, isNew:true,
      // Doctor-specific verification
      verificationStatus: isDr ? 'pending' : undefined,
      appliedAt: isDr ? new Date().toISOString() : undefined,
      dob:            document.getElementById('su-dob')?.value    || '',
      gender:         document.getElementById('su-gender')?.value || '',
      dosha:          document.getElementById('su-dosha')?.value  || 'Vata',
      address:'', bloodGroup:'—', allergies:'None', emergencyContact:'',
      specialization: document.getElementById('su-spec')?.value  || '',
      qualification:  document.getElementById('su-qual')?.value  || '',
      experience:     document.getElementById('su-exp')?.value   || '',
      rating:0, patients:0,
    };
    DB.users.push(newUser);

    // Notify admins about new doctor application
    if (isDr) {
      DB.users.filter(u => u.role === 'admin').forEach(admin => {
        DB.notifications.push({
          id:genId('n'), userId:admin.id, type:'system', priority:'high', read:false,
          title:`🩺 New Doctor Application — ${fullName}`,
          message:`${fullName} (${newUser.specialization}) has applied for a doctor account. Please review and verify their credentials in Admin → Doctor Verification.`,
          createdAt: new Date().toISOString(),
        });
      });
    }

    DB.notifications.push({
      id:genId('n'), userId:newUser.id, type:'system', priority:'normal', read:false,
      title: isDr ? `🌿 Application Submitted, ${first}!` : `🌿 Welcome to Panchakarma, ${first}!`,
      message: isDr
        ? 'Your doctor application is under review. You will be notified once approved by our admin team. Typical review time: 24-48 hours.'
        : 'Your patient account is ready. Book sessions, track your progress, and shop herbal remedies!',
      createdAt: new Date().toISOString(),
    });

    const sEl=document.getElementById('signup-success');

    if (isDr) {
      sEl.textContent=`✅ Application submitted! Your account is pending admin approval.`; sEl.classList.add('show');
      const btn2 = document.getElementById('signup-btn');
      if (btn2) { btn2.disabled=false; btn2.innerHTML='<span>Create Account</span><span>→</span>'; }
      // Show pending screen after brief delay
      setTimeout(() => { currentUser=newUser; showPendingScreen(newUser,'pending'); }, 1400);
    } else {
      sEl.textContent=`✅ Account created! Welcome, ${first}. Signing you in…`; sEl.classList.add('show');
      setTimeout(() => { currentUser=newUser; bootApp(); setTimeout(() => onPatientSignupSuccess(newUser), 600); }, 1200);
    }
  }, 500);
}

function showTerms() {
  openModal(`
    <div class="modal-header"><div class="modal-title">📋 Terms of Service</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div style="max-height:360px;overflow-y:auto;font-size:0.87rem;color:var(--text-med);line-height:1.7">
      <p><strong>1. Acceptance</strong><br>By creating an account you agree to these terms and our Privacy Policy.</p>
      <p style="margin-top:12px"><strong>2. Account Responsibility</strong><br>You are responsible for maintaining the security of your credentials. Provide accurate information.</p>
      <p style="margin-top:12px"><strong>3. Medical Disclaimer</strong><br>This platform is for appointment management only. Always consult a qualified Ayurvedic practitioner for medical decisions.</p>
      <p style="margin-top:12px"><strong>4. Privacy</strong><br>Your health data is stored securely and never shared with third parties without consent.</p>
      <p style="margin-top:12px"><strong>5. Herbal Shop</strong><br>Products are listed for reference. Verify suitability with your doctor before purchasing.</p>
      <p style="margin-top:16px;color:var(--text-light);font-size:0.78rem">Last updated: January 2025</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-green" onclick="closeMod();document.getElementById('su-terms').checked=true">Accept & Close</button>
    </div>`);
}

function logout() {
  currentUser = null;
  DB.cart = [];
  document.getElementById('app').classList.remove('active');
  document.getElementById('pending-page').classList.remove('active');
  document.getElementById('login-page').classList.add('active');
  const em=document.getElementById('signin-email'); if(em) em.value='';
  const pw=document.getElementById('signin-password'); if(pw) pw.value='';
  const er=document.getElementById('signin-error'); if(er) er.classList.remove('show');
  switchAuthMode('signin');
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════
function getDateStr(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr-12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}
function getUser(id) { return DB.users.find(u => u.id === id); }
function getTherapy(id) { return DB.therapies.find(t => t.id === id); }
function uuid() { return 'id-' + Math.random().toString(36).substr(2,9); }
function genId(prefix) { return prefix + Date.now() + Math.floor(Math.random()*1000); }
function calcAge(dob) { if (!dob) return null; const diff = Date.now() - new Date(dob).getTime(); return Math.floor(diff / (365.25*24*3600*1000)); }

// ── Patient Code Generator ─────────────────────────────────
function generatePatientCode() {
  const cfg    = DB.clinicConfig;
  const num    = String(cfg.patientIdCounter++).padStart(4, '0');
  return `${cfg.patientIdPrefix}-${num}`;
}

// ── Doctor Daily Capacity ──────────────────────────────────
// Returns { used, limit, available, slots[] } for a given doctor on a given date
function getDoctorDayCapacity(doctorId, date) {
  const doctor   = getUser(doctorId);
  const limit    = doctor?.dailyLimit || DB.clinicConfig.defaultDailyLimit;
  const sessions = DB.sessions.filter(s =>
    s.doctorId === doctorId &&
    s.date     === date &&
    s.status   !== 'cancelled'
  );
  const used  = sessions.length;
  const avail = Math.max(0, limit - used);

  // Build available time slots
  const workStart  = doctor?.workStart || DB.clinicConfig.workingHours.start;
  const workEnd    = doctor?.workEnd   || DB.clinicConfig.workingHours.end;
  const slotMins   = DB.clinicConfig.slotDuration;
  const bookedTimes = sessions.map(s => s.time);

  const slots = [];
  let [sh, sm] = workStart.split(':').map(Number);
  const [eh, em] = workEnd.split(':').map(Number);
  while (sh * 60 + sm + slotMins <= eh * 60 + em) {
    const timeStr = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
    if (!bookedTimes.includes(timeStr)) {
      slots.push(timeStr);
    }
    sm += slotMins;
    while (sm >= 60) { sm -= 60; sh++; }
  }
  return { used, limit, available: avail, slots, doctor };
}

// ── Check if doctor is at daily capacity for a date ───────
function isDoctorAtCapacity(doctorId, date) {
  const cap = getDoctorDayCapacity(doctorId, date);
  return cap.available <= 0;
}

// ── Duplicate Patient Detection ────────────────────────────
// Returns existing patients who share the same name OR phone (not email — email is unique by design)
function findDuplicatePatients(name, phone) {
  const nameLower = name.toLowerCase().trim();
  return DB.users.filter(u => {
    if (u.role !== 'patient') return false;
    const nameMatch  = u.name.toLowerCase().trim() === nameLower;
    const phoneMatch = phone && u.phone && u.phone.replace(/\s/g,'') === phone.replace(/\s/g,'');
    return nameMatch || phoneMatch;
  });
}

function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}

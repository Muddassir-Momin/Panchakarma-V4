/* ================================================
   ROUTER — bootApp, buildNav, showPage, renderPage
   ================================================ */

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
}
function closeMod() { document.getElementById('modal-overlay').classList.remove('open'); }

// ═══════════════════════════════════════════════════════════
// APP BOOT
// ═══════════════════════════════════════════════════════════
function bootApp() {
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('app').classList.add('active');

  // Set header
  const badge = document.getElementById('role-badge');
  badge.textContent = currentUser.role === 'doctor' ? '👨‍⚕️ Doctor' : currentUser.role === 'admin' ? '⚙️ Admin' : '🧘 Patient';
  badge.className = `role-badge ${currentUser.role === 'doctor' ? 'doctor' : currentUser.role === 'admin' ? 'admin' : 'patient'}`;
  document.getElementById('header-avatar').childNodes[0].textContent = currentUser.avatar;

  // Build nav
  buildNav();

  // Start idle session timer
  resetIdleTimer();

  // Load first page
  const firstPage = { patient: 'patient-dashboard', doctor: 'doctor-dashboard', admin: 'admin-dashboard' };
  showPage(firstPage[currentUser.role]);
}

function buildNav() {
  const navDef = {
    patient: [
      { id: 'patient-dashboard',     label: 'Dashboard',     icon: '🏠' },
      { id: 'patient-schedule',      label: 'Schedule',      icon: '📅' },
      { id: 'patient-progress',      label: 'Progress',      icon: '📈' },
      { id: 'patient-notifications', label: 'Notifications', icon: '🔔', badge: true },
      { id: 'patient-feedback',      label: 'Feedback',      icon: '⭐' },
      { id: 'patient-shop',          label: 'Herbal Shop',   icon: '🛒', cartBadge: true },
      { id: 'announcements',         label: 'News',          icon: '📢' },
    ],
    doctor: [
      { id: 'doctor-dashboard',       label: 'Dashboard',     icon: '🏠' },
      { id: 'doctor-patients',        label: 'Patients',      icon: '👥' },
      { id: 'doctor-schedule',        label: 'Schedule',      icon: '📅' },
      { id: 'doctor-treatments',      label: 'Treatments',    icon: '🌿' },
      { id: 'doctor-notifications',   label: 'Notifications', icon: '🔔', badge: true },
      { id: 'doctor-shop',            label: 'Herbal Shop',   icon: '🏪' },
      { id: 'doctor-reports',         label: 'Reports',       icon: '📊' },
      { id: 'announcements',     label: 'News',       icon: '📢' },
    ],
    admin: [
      { id: 'admin-dashboard',    label: 'Dashboard',    icon: '🏠' },
      { id: 'admin-users',        label: 'Users',        icon: '👥' },
      { id: 'admin-verify',       label: 'Verify Docs',  icon: '🩺', verifyBadge: true },
      { id: 'admin-therapies',    label: 'Therapies',    icon: '🌿' },
      { id: 'admin-appointments', label: 'Appointments', icon: '📅' },
      { id: 'admin-shop',         label: 'Shop Mgmt',    icon: '🏪' },
      { id: 'admin-reports',      label: 'Reports',      icon: '📊' },
      { id: 'announcements',      label: 'Announce',     icon: '📢' },
    ]
  };
  const nav = document.getElementById('main-nav');
  const items = navDef[currentUser.role] || [];
  nav.innerHTML = items.map(item => {
    const unread      = item.badge       ? DB.notifications.filter(n => n.userId === currentUser.id && !n.read).length : 0;
    const cartCount   = item.cartBadge   ? DB.cart.filter(c => c.userId === currentUser.id).reduce((s,c)=>s+c.qty,0) : 0;
    const verifyCount = item.verifyBadge ? DB.users.filter(u => u.role==='doctor' && u.verificationStatus==='pending').length : 0;
    const badgeVal    = unread || cartCount || verifyCount;
    return `<button class="nav-btn" onclick="showPage('${item.id}')" id="nav-${item.id}">
      ${item.icon} ${item.label}
      ${badgeVal > 0 ? `<span class="notif-badge">${badgeVal}</span>` : ''}
    </button>`;
  }).join('');
}

function showPage(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-' + pageId);
  if (pg) {
    pg.classList.add('active');
    const navBtn = document.getElementById('nav-' + pageId);
    if (navBtn) navBtn.classList.add('active');
    renderPage(pageId, pg);
  }
}

function renderPage(id, el) {
  switch(id) {
    case 'patient-dashboard': renderPatientDashboard(el); break;
    case 'patient-schedule': renderPatientSchedule(el); break;
    case 'patient-progress': renderPatientProgress(el); break;
    case 'patient-notifications': renderPatientNotifications(el); break;
    case 'patient-feedback': renderPatientFeedback(el); break;
    case 'doctor-dashboard': renderDoctorDashboard(el); break;
    case 'doctor-patients': renderDoctorPatients(el); break;
    case 'doctor-schedule': renderDoctorSchedule(el); break;
    case 'doctor-treatments': renderDoctorTreatments(el); break;
    case 'doctor-reports':        renderDoctorReports(el);        break;
    case 'doctor-notifications':  renderDoctorNotifications(el);  break;
    case 'admin-dashboard': renderAdminDashboard(el); break;
    case 'admin-users':   renderAdminUsers(el); break;
    case 'admin-verify':  window._adminUserFilter='verification'; renderAdminUsers(el); break;
    case 'admin-verify': renderAdminVerify(el); break;
    case 'admin-therapies': renderAdminTherapies(el); break;
    case 'admin-appointments': renderAdminAppointments(el); break;
    case 'admin-reports': renderAdminReports(el); break;
    case 'announcements': renderAnnouncements(el); break;

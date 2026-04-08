/* ================================================
   CONSTANTS — Clinic Config, Roles, Nav Items
   ================================================ */

const CLINIC = Object.freeze({ DAILY_LIMIT:8, BOOKING_ADVANCE_DAYS:30, PATIENT_ID_PREFIX:'PKM', CANCEL_NOTICE_HOURS:24, MAX_RESCHEDULE_COUNT:3, LOW_STOCK_THRESHOLD:5, SESSION_TIMEOUT_MS:30*60*1000 });
const ROLES  = Object.freeze({ PATIENT:'patient', DOCTOR:'doctor', ADMIN:'admin' });
const NAV    = Object.freeze({
  patient:[ {id:'patient-dashboard',label:'Home',icon:'🏠'},{id:'patient-schedule',label:'Sessions',icon:'📅'},{id:'patient-progress',label:'Progress',icon:'📈'},{id:'patient-shop',label:'Shop',icon:'🛒'},{id:'patient-notifications',label:'Alerts',icon:'🔔',badge:true} ],
  doctor: [ {id:'doctor-dashboard',label:'Home',icon:'🏠'},{id:'doctor-patients',label:'Patients',icon:'👥'},{id:'doctor-schedule',label:'Schedule',icon:'📅'},{id:'doctor-treatments',label:'Treat',icon:'🌿'},{id:'doctor-notifications',label:'Alerts',icon:'🔔',badge:true},{id:'doctor-shop',label:'Shop',icon:'🏪'},{id:'doctor-reports',label:'Reports',icon:'📊'} ],
  admin:  [ {id:'admin-dashboard',label:'Home',icon:'🏠'},{id:'admin-users',label:'Users',icon:'👥',badge:true},{id:'admin-appointments',label:'Appts',icon:'📅'},{id:'admin-reports',label:'Reports',icon:'📊'},{id:'admin-therapies',label:'Therapy',icon:'🌿'} ],
});

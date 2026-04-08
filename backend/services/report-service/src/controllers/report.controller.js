'use strict';

const { Op, fn, col, literal } = require('sequelize');
const db     = require('../models');
const R      = require('../../../../shared/utils/response');
const { ROLES } = require('../../../../shared/constants');
const logger = require('../../../../shared/utils/logger');

function monthRange(monthsBack = 6) {
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      year:  d.getFullYear(),
      month: d.getMonth() + 1,
      start: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,
      end:   new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split('T')[0],
    });
  }
  return months;
}

// ── GET /api/reports/admin ────────────────────────────────
exports.adminReport = async (req, res) => {
  try {
    if (req.user.role !== ROLES.ADMIN) return R.forbidden(res);

    const [
      totalPatients, totalDoctors, activeDoctors, pendingDoctors,
      totalSessions, completedSessions, cancelledSessions,
      feedbackData, shopOrders
    ] = await Promise.all([
      db.User.count({ where: { role: 'patient' } }),
      db.User.count({ where: { role: 'doctor' } }),
      db.User.count({ where: { role: 'doctor', verificationStatus: 'approved' } }),
      db.User.count({ where: { role: 'doctor', verificationStatus: 'pending' } }),
      db.Session.count(),
      db.Session.count({ where: { status: 'completed' } }),
      db.Session.count({ where: { status: 'cancelled' } }),
      db.Feedback.findAll({ attributes: ['rating'] }),
      db.Order.findAll({ where: { status: { [Op.ne]: 'cancelled' } }, attributes: ['total','createdAt','mode'] }),
    ]);

    const avgRating = feedbackData.length
      ? (feedbackData.reduce((s,f) => s + f.rating, 0) / feedbackData.length).toFixed(1)
      : 0;

    // Revenue by completed sessions + therapy
    const therapyRevRows = await db.Session.findAll({
      where: { status: 'completed' },
      include: [{ model: db.Therapy, as: 'therapy', attributes: ['id','name','price'] }],
      attributes: [],
    });

    const therapyRevMap = {};
    therapyRevRows.forEach(s => {
      if (!s.therapy) return;
      therapyRevMap[s.therapy.name] = (therapyRevMap[s.therapy.name] || 0) + Number(s.therapy.price);
    });
    const totalTherapyRev = Object.values(therapyRevMap).reduce((a,b) => a+b, 0);
    const totalShopRev    = shopOrders.reduce((s,o) => s + Number(o.total), 0);

    // 6-month revenue trend (from real data)
    const months = monthRange(6);
    const monthlyTrend = await Promise.all(months.map(async m => {
      const sessions = await db.Session.findAll({
        where: { status: 'completed', date: { [Op.between]: [m.start, m.end] } },
        include: [{ model: db.Therapy, as: 'therapy', attributes: ['price'] }],
        attributes: [],
      });
      const therapyRev = sessions.reduce((s,ss) => s + Number(ss.therapy?.price || 0), 0);

      const orders = await db.Order.findAll({
        where: { status: { [Op.ne]: 'cancelled' }, createdAt: { [Op.between]: [new Date(m.start), new Date(m.end + 'T23:59:59')] } },
        attributes: ['total'],
      });
      const shopRev = orders.reduce((s,o) => s + Number(o.total), 0);

      return { label: m.label, therapyRev, shopRev, total: therapyRev + shopRev };
    }));

    // Doctor performance
    const doctors = await db.User.findAll({
      where: { role: 'doctor', verificationStatus: 'approved' },
      attributes: ['id','name','specialization','rating'],
    });
    const doctorPerf = await Promise.all(doctors.map(async d => {
      const sessions   = await db.Session.count({ where: { doctorId: d.id, status: 'completed' } });
      const uniquePats = await db.Session.count({
        where: { doctorId: d.id },
        distinct: true, col: 'patientId',
      });
      const sessionsRaw = await db.Session.findAll({
        where: { doctorId: d.id, status: 'completed' },
        include: [{ model: db.Therapy, as: 'therapy', attributes: ['price'] }],
        attributes: [],
      });
      const revenue = sessionsRaw.reduce((s,ss) => s + Number(ss.therapy?.price || 0), 0);
      return { id: d.id, name: d.name, specialization: d.specialization,
               rating: d.rating, sessions, uniquePatients: uniquePats, revenue };
    }));

    return R.success(res, {
      overview: {
        totalPatients, totalDoctors, activeDoctors, pendingDoctors,
        totalSessions, completedSessions, cancelledSessions,
        adherenceRate: totalSessions > 0 ? Math.round(completedSessions/totalSessions*100) : 0,
        avgRating: Number(avgRating), totalReviews: feedbackData.length,
        totalTherapyRev, totalShopRev, totalRev: totalTherapyRev + totalShopRev,
      },
      monthlyTrend,
      therapyRevenue: Object.entries(therapyRevMap)
        .sort((a,b) => b[1]-a[1])
        .map(([name,rev]) => ({ name, rev, share: totalTherapyRev > 0 ? Math.round(rev/totalTherapyRev*100) : 0 })),
      doctorPerformance: doctorPerf,
      sessionStatus: { scheduled: totalSessions - completedSessions - cancelledSessions, completedSessions, cancelledSessions },
    });
  } catch (err) {
    logger.error('[Report] admin error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/reports/doctor ───────────────────────────────
exports.doctorReport = async (req, res) => {
  try {
    if (req.user.role !== ROLES.DOCTOR) return R.forbidden(res);
    const dId = req.user.id;

    const sessions    = await db.Session.findAll({
      where: { doctorId: dId },
      include: [{ model: db.Therapy, as: 'therapy', attributes: ['id','name','price','color'] }],
    });
    const completed   = sessions.filter(s => s.status === 'completed');
    const upcoming    = sessions.filter(s => s.status === 'scheduled');
    const uniquePats  = [...new Set(sessions.map(s => s.patientId))].length;
    const totalRev    = completed.reduce((s,ss) => s + Number(ss.therapy?.price||0), 0);
    const feedbacks   = await db.Feedback.findAll({ where: { doctorId: dId } });
    const avgRating   = feedbacks.length
      ? (feedbacks.reduce((s,f) => s+f.rating,0)/feedbacks.length).toFixed(1) : 0;

    // Sessions per therapy
    const therapyMap = {};
    sessions.forEach(s => {
      if (!s.therapy) return;
      therapyMap[s.therapy.name] = {
        name: s.therapy.name, color: s.therapy.color,
        count: (therapyMap[s.therapy.name]?.count || 0) + 1,
      };
    });

    // 6-month trends for this doctor
    const months = monthRange(6);
    const trend = await Promise.all(months.map(async m => {
      const ss = await db.Session.findAll({
        where: { doctorId: dId, status: 'completed', date: { [Op.between]: [m.start, m.end] } },
        include: [{ model: db.Therapy, as: 'therapy', attributes: ['price'] }], attributes: [],
      });
      const rev = ss.reduce((s,x) => s + Number(x.therapy?.price||0), 0);
      return { label: m.label, sessions: ss.length, revenue: rev };
    }));

    return R.success(res, {
      summary: { totalSessions: sessions.length, completed: completed.length, upcoming: upcoming.length,
                 uniquePatients: uniquePats, totalRevenue: totalRev, avgRating: Number(avgRating), totalFeedback: feedbacks.length },
      therapyBreakdown: Object.values(therapyMap),
      monthlyTrend: trend,
      recentFeedback: feedbacks.slice(-5).reverse(),
    });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── GET /api/reports/patient ──────────────────────────────
exports.patientReport = async (req, res) => {
  try {
    if (req.user.role !== ROLES.PATIENT) return R.forbidden(res);
    const pId = req.user.id;

    const sessions    = await db.Session.findAll({
      where: { patientId: pId },
      include: [{ model: db.Therapy, as: 'therapy', attributes: ['id','name','price'] }],
      order: [['date','ASC']],
    });
    const completed   = sessions.filter(s => s.status === 'completed');
    const milestones  = await db.Milestone.findAll({ where: { patientId: pId } });
    const feedback    = await db.Feedback.findAll({ where: { patientId: pId }, order: [['submittedAt','ASC']] });
    const adherence   = sessions.length > 0 ? Math.round(completed.length/sessions.length*100) : 0;

    // Progress over time (feedback ratings)
    const progressTrend = feedback.map(f => ({
      date:   f.submittedAt, rating: f.rating, energyLevel: f.energyLevel,
    }));

    return R.success(res, {
      summary: {
        totalSessions: sessions.length, completedSessions: completed.length, adherencePct: adherence,
        milestones: milestones.length, completedMilestones: milestones.filter(m=>m.status==='completed').length,
        totalFeedback: feedback.length,
      },
      progressTrend,
      milestones,
    });
  } catch (err) {
    return R.serverError(res);
  }
};

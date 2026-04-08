'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/models');

describe('Session Capacity Enforcement', () => {
  it('GET /api/sessions/capacity returns used/limit/available', async () => {
    const res = await request(app)
      .get('/api/sessions/capacity')
      .query({ doctorId: 'd1', date: '2025-06-15' })
      .set('Authorization', `Bearer ${global.testToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('limit');
    expect(res.body.data).toHaveProperty('used');
    expect(res.body.data).toHaveProperty('available');
    expect(res.body.data).toHaveProperty('slots');
    expect(Array.isArray(res.body.data.slots)).toBe(true);
  });
});

describe('Session Booking Validation', () => {
  it('rejects missing therapyId', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${global.testToken}`)
      .send({ doctorId:'d1', date:'2025-06-20', time:'10:00' });
    expect(res.status).toBe(422);
  });

  it('rejects booking on doctor non-working day', async () => {
    // d1 works Mon-Fri; find a Saturday
    const sat = new Date();
    while (sat.getDay() !== 6) sat.setDate(sat.getDate() + 1);
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${global.testToken}`)
      .send({ therapyId:'t1', doctorId:'d1', date:sat.toISOString().split('T')[0], time:'10:00' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not work/i);
  });

  it('enforces maximum reschedule count', async () => {
    // Create a session with rescheduleCount already at max
    const session = await db.Session.create({
      patientId:'u1', doctorId:'d1', therapyId:'t1',
      date:'2025-06-25', time:'10:00', status:'scheduled',
      duration:60, rescheduleCount: 3, // max = 3
    });
    const res = await request(app)
      .patch(`/api/sessions/${session.id}/reschedule`)
      .set('Authorization', `Bearer ${global.testToken}`)
      .send({ date:'2025-06-26', time:'11:00' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reschedules/i);
    await session.destroy({ force: true });
  });
});

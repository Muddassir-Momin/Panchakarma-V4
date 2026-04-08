'use strict';

const request  = require('supertest');
const bcrypt   = require('bcryptjs');
const app      = require('../src/app');
const db       = require('../src/models');

let testUserId;
let authToken;

beforeAll(async () => {
  await db.sequelize.sync({ force: false });
  const hash = await bcrypt.hash('TestPass123!', 12);
  const u = await db.User.create({
    name:'Test Patient', email:'test_auth_2024@pkms.test',
    password:hash, role:'patient', avatar:'TP',
    patientCode:'PKM-9999',
  });
  testUserId = u.id;
});

afterAll(async () => {
  if (testUserId) await db.User.destroy({ where:{ id:testUserId }, force:true });
  await db.sequelize.close();
});

describe('POST /api/auth/signup', () => {
  it('rejects missing fields',   () => request(app).post('/api/auth/signup').send({}).expect(422));
  it('rejects invalid email',    () => request(app).post('/api/auth/signup').send({ firstName:'A',lastName:'B',email:'bad',password:'pass1234',role:'patient' }).expect(422));
  it('rejects short password',   () => request(app).post('/api/auth/signup').send({ firstName:'A',lastName:'B',email:'valid@test.com',password:'short',role:'patient' }).expect(422));
  it('rejects duplicate email',  () => request(app).post('/api/auth/signup').send({ firstName:'Test',lastName:'User',email:'test_auth_2024@pkms.test',password:'TestPass123!',role:'patient' }).expect(409));
  it('creates patient account',  async () => {
    const res = await request(app).post('/api/auth/signup').send({
      firstName:'New', lastName:'Patient', email:`new.${Date.now()}@pkms.test`,
      password:'TestPass123!', role:'patient', dosha:'Vata',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.patientCode).toMatch(/^PKM-\d{4}$/);
    expect(res.body.data.token).toBeDefined();
    // Cleanup
    await db.User.destroy({ where:{ id:res.body.data.user.id }, force:true });
  });
  it('creates pending doctor',   async () => {
    const res = await request(app).post('/api/auth/signup').send({
      firstName:'Dr', lastName:'Test', email:`dr.${Date.now()}@pkms.test`,
      password:'TestPass123!', role:'doctor', specialization:'Ayurveda',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.requiresVerification).toBe(true);
    expect(res.body.data.token).toBeNull();
    await db.User.destroy({ where:{ id:res.body.data.user.id }, force:true });
  });
});

describe('POST /api/auth/login', () => {
  it('rejects missing email',    () => request(app).post('/api/auth/login').send({ password:'x' }).expect(422));
  it('rejects wrong password',   () => request(app).post('/api/auth/login').send({ email:'test_auth_2024@pkms.test', password:'WrongPass' }).expect(401));
  it('rejects unknown email',    () => request(app).post('/api/auth/login').send({ email:'nobody@pkms.test', password:'anything' }).expect(401));
  it('returns token on success', async () => {
    const res = await request(app).post('/api/auth/login').send({ email:'test_auth_2024@pkms.test', password:'TestPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
    authToken = res.body.data.token;
  });
});

describe('GET /api/auth/me', () => {
  it('rejects no token',      () => request(app).get('/api/auth/me').expect(401));
  it('rejects invalid token', () => request(app).get('/api/auth/me').set('Authorization','Bearer bad').expect(403));
  it('returns user on valid', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization',`Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test_auth_2024@pkms.test');
    expect(res.body.data.password).toBeUndefined();
  });
});

describe('POST /api/auth/change-password', () => {
  it('rejects wrong current password', async () => {
    const res = await request(app).post('/api/auth/change-password')
      .set('Authorization',`Bearer ${authToken}`)
      .send({ currentPassword:'Wrong!', newPassword:'NewPass456!' });
    expect(res.status).toBe(400);
  });
  it('changes password successfully', async () => {
    const res = await request(app).post('/api/auth/change-password')
      .set('Authorization',`Bearer ${authToken}`)
      .send({ currentPassword:'TestPass123!', newPassword:'NewPass456!' });
    expect(res.status).toBe(200);
    // Can now login with new password
    const login = await request(app).post('/api/auth/login')
      .send({ email:'test_auth_2024@pkms.test', password:'NewPass456!' });
    expect(login.status).toBe(200);
  });
});

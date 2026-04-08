'use strict';

/**
 * shared/models/index.js
 *
 * Single source of truth for all Sequelize model definitions.
 * Each service requires this file, passing its own sequelize instance.
 *
 * Usage in a service:
 *   const { Sequelize } = require('sequelize');
 *   const seq = new Sequelize(...);
 *   const { User, Session, ... } = require('../../../shared/models')(seq);
 */

const { DataTypes } = require('sequelize');

module.exports = function defineModels(sequelize) {

  // ── User ──────────────────────────────────────────────────
  const User = sequelize.define('User', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:        { type: DataTypes.STRING(100), allowNull: false },
    email:       { type: DataTypes.STRING(255), allowNull: false, unique: true,
                   set(v) { this.setDataValue('email', v?.toLowerCase().trim()); } },
    password:    { type: DataTypes.STRING(255), allowNull: false },
    role:        { type: DataTypes.ENUM('patient','doctor','admin'), allowNull: false },
    avatar:      { type: DataTypes.STRING(4), defaultValue: '??' },
    avatarColor: { type: DataTypes.STRING(10), defaultValue: '#2D5016' },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
    phone:       { type: DataTypes.STRING(20), allowNull: true },
    // Patient fields
    patientCode:      { type: DataTypes.STRING(20), unique: true, allowNull: true },
    dob:              { type: DataTypes.DATEONLY, allowNull: true },
    gender:           { type: DataTypes.ENUM('Male','Female','Other'), allowNull: true },
    dosha:            { type: DataTypes.STRING(20), allowNull: true },
    bloodGroup:       { type: DataTypes.STRING(5), allowNull: true },
    allergies:        { type: DataTypes.STRING(255), allowNull: true },
    emergencyContact: { type: DataTypes.STRING(20), allowNull: true },
    address:          { type: DataTypes.STRING(255), allowNull: true },
    registeredAt:     { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    registeredByDoctorId: { type: DataTypes.UUID, allowNull: true },
    // Doctor fields
    specialization:     { type: DataTypes.STRING(100), allowNull: true },
    qualification:      { type: DataTypes.STRING(100), allowNull: true },
    experience:         { type: DataTypes.STRING(50), allowNull: true },
    bio:                { type: DataTypes.TEXT, allowNull: true },
    rating:             { type: DataTypes.DECIMAL(3,2), defaultValue: 0 },
    verificationStatus: { type: DataTypes.ENUM('pending','approved','rejected'), allowNull: true },
    rejectionReason:    { type: DataTypes.STRING(500), allowNull: true },
    appliedAt:          { type: DataTypes.DATE, allowNull: true },
    dailyLimit:         { type: DataTypes.INTEGER, defaultValue: 8 },
    workStart:          { type: DataTypes.STRING(5), defaultValue: '09:00' },
    workEnd:            { type: DataTypes.STRING(5), defaultValue: '18:00' },
    workingDays:        { type: DataTypes.JSON, defaultValue: ['Mon','Tue','Wed','Thu','Fri'] },
    // Auth
    passwordResetToken:  { type: DataTypes.STRING(255), allowNull: true },
    passwordResetExpiry: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'users', timestamps: true, paranoid: true,
    indexes: [
      { fields: ['email'] }, { fields: ['role'] },
      { fields: ['patientCode'] }, { fields: ['verificationStatus'] },
    ],
  });

  // ── Therapy ───────────────────────────────────────────────
  const Therapy = sequelize.define('Therapy', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:        { type: DataTypes.STRING(80), allowNull: false },
    category:    { type: DataTypes.STRING(60), allowNull: false },
    duration:    { type: DataTypes.INTEGER, allowNull: false, comment: 'minutes' },
    price:       { type: DataTypes.DECIMAL(10,2), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    color:       { type: DataTypes.STRING(10), defaultValue: '#4A7C2B' },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'therapies', timestamps: true });

  // ── Session ───────────────────────────────────────────────
  const Session = sequelize.define('Session', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId:       { type: DataTypes.UUID, allowNull: false },
    doctorId:        { type: DataTypes.UUID, allowNull: false },
    therapyId:       { type: DataTypes.UUID, allowNull: false },
    date:            { type: DataTypes.DATEONLY, allowNull: false },
    time:            { type: DataTypes.STRING(5), allowNull: false },
    duration:        { type: DataTypes.INTEGER, defaultValue: 60 },
    status:          { type: DataTypes.ENUM('scheduled','completed','cancelled','rescheduled'),
                       defaultValue: 'scheduled' },
    notes:           { type: DataTypes.TEXT, allowNull: true },
    clinicalNotes:   { type: DataTypes.TEXT, allowNull: true },
    rescheduleCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    completedAt:     { type: DataTypes.DATE, allowNull: true },
    cancelledAt:     { type: DataTypes.DATE, allowNull: true },
    cancelReason:    { type: DataTypes.STRING(300), allowNull: true },
  }, {
    tableName: 'sessions', timestamps: true,
    indexes: [
      { fields: ['patientId'] }, { fields: ['doctorId'] },
      { fields: ['date'] }, { fields: ['status'] },
    ],
  });

  // ── Notification ──────────────────────────────────────────
  const Notification = sequelize.define('Notification', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:    { type: DataTypes.UUID, allowNull: false },
    sessionId: { type: DataTypes.UUID, allowNull: true },
    type:      { type: DataTypes.ENUM('pre_procedure','post_procedure','general','system'),
                 defaultValue: 'system' },
    priority:  { type: DataTypes.ENUM('normal','high','critical'), defaultValue: 'normal' },
    title:     { type: DataTypes.STRING(200), allowNull: false },
    message:   { type: DataTypes.TEXT, allowNull: false },
    read:      { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'notifications', timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['read'] }],
  });

  // ── Milestone ─────────────────────────────────────────────
  const Milestone = sequelize.define('Milestone', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId:     { type: DataTypes.UUID, allowNull: false },
    name:          { type: DataTypes.STRING(200), allowNull: false },
    status:        { type: DataTypes.ENUM('pending','in_progress','completed'), defaultValue: 'pending' },
    pct:           { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    targetDate:    { type: DataTypes.DATEONLY, allowNull: true },
    completedDate: { type: DataTypes.DATEONLY, allowNull: true },
    notes:         { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: 'milestones', timestamps: true });

  // ── Feedback ──────────────────────────────────────────────
  const Feedback = sequelize.define('Feedback', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId:   { type: DataTypes.UUID, allowNull: false },
    sessionId:   { type: DataTypes.UUID, allowNull: false },
    doctorId:    { type: DataTypes.UUID, allowNull: false },
    rating:      { type: DataTypes.TINYINT, allowNull: false,
                   validate: { min: 1, max: 10 } },
    energyLevel: { type: DataTypes.ENUM('much_improved','slightly_improved','same','slightly_worse'),
                   defaultValue: 'same' },
    symptoms:    { type: DataTypes.TEXT, allowNull: true },
    comments:    { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATEONLY, allowNull: false },
  }, {
    tableName: 'feedback', timestamps: true,
    indexes: [{ unique: true, fields: ['sessionId','patientId'] }],
  });

  // ── Prescription ──────────────────────────────────────────
  const Prescription = sequelize.define('Prescription', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    doctorId:  { type: DataTypes.UUID, allowNull: false },
    date:      { type: DataTypes.DATEONLY, allowNull: false },
    medicines: { type: DataTypes.JSON, allowNull: false },
    diet:      { type: DataTypes.TEXT, allowNull: true },
    lifestyle: { type: DataTypes.TEXT, allowNull: true },
    notes:     { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: 'prescriptions', timestamps: true });

  // ── Product ───────────────────────────────────────────────
  const Product = sequelize.define('Product', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId:    { type: DataTypes.UUID, allowNull: false },
    name:        { type: DataTypes.STRING(150), allowNull: false },
    category:    { type: DataTypes.STRING(60), allowNull: false },
    price:       { type: DataTypes.DECIMAL(10,2), allowNull: false },
    mrp:         { type: DataTypes.DECIMAL(10,2), allowNull: false },
    stock:       { type: DataTypes.INTEGER, defaultValue: 0 },
    unit:        { type: DataTypes.STRING(40), allowNull: true },
    emoji:       { type: DataTypes.STRING(8), defaultValue: '🌿' },
    description: { type: DataTypes.TEXT, allowNull: true },
    tags:        { type: DataTypes.JSON, defaultValue: [] },
    dosha:       { type: DataTypes.JSON, defaultValue: [] },
    recommended: { type: DataTypes.BOOLEAN, defaultValue: false },
    isNew:       { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'products', timestamps: true });

  // ── Order ─────────────────────────────────────────────────
  const Order = sequelize.define('Order', {
    id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId:         { type: DataTypes.UUID, allowNull: false },
    mode:              { type: DataTypes.ENUM('online','pickup'), allowNull: false },
    status:            { type: DataTypes.ENUM('processing','ready','shipped','delivered','cancelled'),
                         defaultValue: 'processing' },
    total:             { type: DataTypes.DECIMAL(10,2), allowNull: false },
    address:           { type: DataTypes.STRING(400), allowNull: true },
    pickupCode:        { type: DataTypes.STRING(12), unique: true, allowNull: true },
    pickupDate:        { type: DataTypes.DATEONLY, allowNull: true },
    pickupTime:        { type: DataTypes.STRING(30), allowNull: true },
    estimatedDelivery: { type: DataTypes.DATEONLY, allowNull: true },
    placedAt:          { type: DataTypes.DATEONLY, allowNull: false },
  }, {
    tableName: 'orders', timestamps: true,
    indexes: [{ fields: ['patientId'] }, { fields: ['status'] }, { fields: ['pickupCode'] }],
  });

  // ── OrderItem ─────────────────────────────────────────────
  const OrderItem = sequelize.define('OrderItem', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId:   { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    qty:       { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  }, { tableName: 'order_items', timestamps: false });

  // ── AuditLog ──────────────────────────────────────────────
  const AuditLog = sequelize.define('AuditLog', {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    action:     { type: DataTypes.STRING(60), allowNull: false },
    actorId:    { type: DataTypes.UUID, allowNull: false },
    actorRole:  { type: DataTypes.STRING(20), allowNull: false },
    targetId:   { type: DataTypes.UUID, allowNull: true },
    targetType: { type: DataTypes.STRING(30), allowNull: true },
    metadata:   { type: DataTypes.JSON, defaultValue: {} },
    timestamp:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'audit_logs', timestamps: false,
    indexes: [{ fields: ['actorId'] }, { fields: ['targetId'] }, { fields: ['action'] }],
  });

  // ── Announcement ──────────────────────────────────────────
  const Announcement = sequelize.define('Announcement', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    authorId:  { type: DataTypes.UUID, allowNull: false },
    title:     { type: DataTypes.STRING(200), allowNull: false },
    message:   { type: DataTypes.TEXT, allowNull: false },
    audience:  { type: DataTypes.ENUM('all','patient','doctor'), defaultValue: 'all' },
    pinned:    { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'announcements', timestamps: true });

  // ── Associations ──────────────────────────────────────────
  Session.belongsTo(User,    { as: 'patient',  foreignKey: 'patientId' });
  Session.belongsTo(User,    { as: 'doctor',   foreignKey: 'doctorId' });
  Session.belongsTo(Therapy, { as: 'therapy',  foreignKey: 'therapyId' });
  Session.hasOne(Feedback,   { foreignKey: 'sessionId', onDelete: 'CASCADE' });

  User.hasMany(Session,      { as: 'patientSessions', foreignKey: 'patientId' });
  User.hasMany(Session,      { as: 'doctorSessions',  foreignKey: 'doctorId' });
  User.hasMany(Notification, { foreignKey: 'userId',  onDelete: 'CASCADE' });
  User.hasMany(Milestone,    { foreignKey: 'patientId', onDelete: 'CASCADE' });
  User.hasMany(Feedback,     { as: 'givenFeedback', foreignKey: 'patientId' });
  User.hasMany(Prescription, { as: 'prescriptions', foreignKey: 'patientId' });
  User.hasMany(Order,        { foreignKey: 'patientId' });
  User.hasMany(Product,      { foreignKey: 'doctorId' });

  Notification.belongsTo(User,    { foreignKey: 'userId' });
  Notification.belongsTo(Session, { foreignKey: 'sessionId' });

  Feedback.belongsTo(User,    { as: 'patient', foreignKey: 'patientId' });
  Feedback.belongsTo(User,    { as: 'doctor',  foreignKey: 'doctorId' });
  Feedback.belongsTo(Session, { foreignKey: 'sessionId' });

  Prescription.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
  Prescription.belongsTo(User, { as: 'doctor',  foreignKey: 'doctorId' });

  Order.belongsTo(User,          { as: 'patient', foreignKey: 'patientId' });
  Order.hasMany(OrderItem,       { as: 'items',   foreignKey: 'orderId', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Order,     { foreignKey: 'orderId' });
  OrderItem.belongsTo(Product,   { as: 'product', foreignKey: 'productId' });

  Product.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });

  Announcement.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

  return {
    sequelize, User, Therapy, Session, Notification,
    Milestone, Feedback, Prescription, Product,
    Order, OrderItem, AuditLog, Announcement,
  };
};

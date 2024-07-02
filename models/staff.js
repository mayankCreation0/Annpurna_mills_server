// models/Staff.js
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String },
  dateOfJoining: { type: Date, default: Date.now },
  currentMonthPay: { type: String},
  CurrentYearPay: { type: String},
});

module.exports = mongoose.model('Staff', staffSchema);

// models/StaffAttendance.js
const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  status: { type: String, required: true },
  moneyTaken: { type: Number },
  remark: { type: String },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

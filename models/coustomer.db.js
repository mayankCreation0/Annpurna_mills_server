const mongoose = require('mongoose');
const coustomerSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
    Gender: { type: String, required: true },
    Address: { type: String, required: true },
    Amount: { type: Number, required: true },
    Rate: { type: Number, required: true },
    Category: { type: String, required: true },
    Weight: { type: String, required: true },
    Status: { type: String, required: true },
    date: { type: Date, unique: true },
    PhoneNumber: { type: Number },
    Remarks: { type: String },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Coustomer',coustomerSchema);
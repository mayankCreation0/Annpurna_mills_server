const mongoose = require('mongoose');
const coustomerSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
    Gender: { type: String },
    Address: { type: String },
    Amount: { type: Number },
    Rate: { type: Number },
    Category: { type: String },
    Weight: { type: String },
    Status: { type: String },
    date: { type: Date, default: new Date },
    // paymentDate: { type: Date, default: new Date },
    // paymentAmount: { type: Number},
    PhoneNumber: { type: Number },
    Remarks: { type: String },
    // previousPayments: [
    //   {
    //     amount: { type: Number },
    //     date: { type: Date },
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coustomer',coustomerSchema);
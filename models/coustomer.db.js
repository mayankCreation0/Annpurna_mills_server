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
    date: { type: Date },
    paymentDate: { type: Date, default: new Date },
    paymentAmount: { type: Number, default: 0 },
    PhoneNumber: { type: Number },
    Remarks: { type: String },
    previousPayments: [
      {
        amount: { type: Number },
        date: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coustomer',coustomerSchema);
const mongoose = require('mongoose');
const coustomerSchema = new mongoose.Schema(
  {
    Name: { type: "string", required: true },
    Gender: { type: "string", required: true },
    Address: { type: "string", required: true },
    Amount: { type: "Number", required: true },
    Rate: { type: "Number", required: true },
    Category: { type: "string", required: true},
    date: { type: Date, unique: true },
    PhoneNumber: { type: "Number" },
    Remarks: { type: "string"}
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Coustomer',coustomerSchema);
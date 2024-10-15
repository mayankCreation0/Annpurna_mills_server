const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    Amount: { type: Number, required: true },
    Rate: { type: Number, required: true },
    Category: { type: String, required: true },
    Weight: { type: String },
    Status: { type: String, default: 'Active' },
    Date: { type: Date, default: Date.now },
    Remarks: { type: String },
    PreviousPayments: [{
        PaidDate: { type: Date, default: Date.now },
        PaidAmount: { type: Number },
    }],
    PaidLoan: {
        LoanPaidDate: { type: Date },
        loanPaidAmount: { type: Number },
    },
    media: {
        image: {
            url: String,
            publicId: String,
            width: Number,
            height: Number,
            format: String
        },
        video: {
            url: String,
            publicId: String,
            duration: Number,
            format: String,
            bitrate: Number
        }
    }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Gender: { type: String },
    Address: { type: String },
    PhoneNumber: { type: String },
    Loans: [loanSchema],
    schemaVersion: { type: Number, default: 2 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
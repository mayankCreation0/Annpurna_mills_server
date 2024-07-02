const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        Name: { type: String },
        Gender: { type: String },
        Address: { type: String },
        Amount: { type: Number },
        Rate: { type: Number },
        Category: { type: String },
        Weight: { type: String },
        Status: { type: String },
        Date: { type: Date, default: new Date },
        PhoneNumber: { type: String },
        Remarks: { type: String },
        PreviousPayments: [
            {
                PaidDate: { type: Date, default: new Date },
                PaidAmount: { type: Number },
            },
        ],
        PaidLoan:[
            {
                LoanPaidDate: { type: Date, default: new Date },
                loanPaidAmount: { type: Number },
            }
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Customer', customerSchema);

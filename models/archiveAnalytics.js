const mongoose = require('mongoose');

const yearlyAnalyticsSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    customerCount: { type: Number, required: true },
    totalLoanTakenAmount: { type: Number, required: true },
    totalLoanRepaidAmount: { type: Number, required: true }
});

module.exports = mongoose.model('YearlyAnalytics', yearlyAnalyticsSchema);

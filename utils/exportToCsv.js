// // const mongoose = require('mongoose');
// const cron = require('node-cron');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// const Customer = require('../models/customer');  // Adjust the path as necessary
// const YearlyAnalytics = require('../models/archiveAnalytics');  // Adjust the path as necessary

// // mongoose.connect('mongodb://localhost:27017/yourdbname', { useNewUrlParser: true, useUnifiedTopology: true });

// async function archiveAndDeleteOldData() {
//     try {
//         const yearToArchive = new Date().getFullYear() - 2;
//         const startOfYear = new Date(yearToArchive, 0, 1);
//         const endOfYear = new Date(yearToArchive + 1, 0, 1);

//         // Find customers to archive
//         const customersToArchive = await Customer.find({
//             Status: 'completed',
//             Date: { $gte: startOfYear, $lt: endOfYear }
//         });

//         if (customersToArchive.length === 0) {
//             console.log('No data to archive for the year', yearToArchive);
//             return;
//         }

//         // Write customers to CSV
//         const csvWriter = createCsvWriter({
//             path: `./archives/customers_${yearToArchive}.csv`,
//             header: [
//                 { id: 'Name', title: 'Name' },
//                 { id: 'Gender', title: 'Gender' },
//                 { id: 'Address', title: 'Address' },
//                 { id: 'Amount', title: 'Amount' },
//                 { id: 'Rate', title: 'Rate' },
//                 { id: 'Category', title: 'Category' },
//                 { id: 'Weight', title: 'Weight' },
//                 { id: 'Status', title: 'Status' },
//                 { id: 'Date', title: 'Date' },
//                 { id: 'PhoneNumber', title: 'PhoneNumber' },
//                 { id: 'Remarks', title: 'Remarks' },
//                 { id: 'PreviousPayments', title: 'PreviousPayments' },
//                 { id: 'PaidLoan', title: 'PaidLoan' }
//             ]
//         });

//         await csvWriter.writeRecords(customersToArchive);

//         // Calculate yearly analytics
//         const totalLoanTakenAmount = customersToArchive.reduce((sum, customer) => sum + customer.Amount, 0);
//         const totalLoanRepaidAmount = customersToArchive.reduce((sum, customer) => {
//             return sum + customer.PaidLoan.reduce((loanSum, loan) => loanSum + loan.loanPaidAmount, 0);
//         }, 0);

//         const yearlyAnalytics = new YearlyAnalytics({
//             year: yearToArchive,
//             customerCount: customersToArchive.length,
//             totalLoanTakenAmount,
//             totalLoanRepaidAmount
//         });

//         await yearlyAnalytics.save();

//         // Delete archived customers
//         await Customer.deleteMany({
//             Status: 'completed',
//             Date: { $gte: startOfYear, $lt: endOfYear }
//         });

//         console.log(`Archived and deleted customer data for the year ${yearToArchive}`);

//     } catch (error) {
//         console.error('Error archiving data:', error);
//     }
// }

// // Schedule the task to run at the end of each year
// cron.schedule('0 0 1 1 *', archiveAndDeleteOldData);

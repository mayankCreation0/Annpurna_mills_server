const express = require('express');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const nodemailer = require('nodemailer');
const Customer = require('../models/customer');
const YearlyAnalytics = require('../models/archiveAnalytics');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    tls: {
        ciphers: "SSLv3",
    },
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    }
});

// Function to archive and delete old data
async function archiveAndDeleteOldData() {
    try {
        const yearToArchive = new Date().getFullYear() - 2;
        const startOfYear = new Date(yearToArchive, 0, 1);
        const endOfYear = new Date(yearToArchive + 1, 0, 1);

        // Find customers to archive
        const customersToArchive = await Customer.find({
            Status: 'Completed',
            Date: { $gte: startOfYear, $lt: endOfYear }
        });

        if (customersToArchive.length === 0) {
            console.log('No data to archive for the year', yearToArchive);
            return null;
        }

        // Generate CSV data in-memory
        const csvStringifier = createCsvStringifier({
            header: [
                { id: 'Name', title: 'Name' },
                { id: 'Gender', title: 'Gender' },
                { id: 'Address', title: 'Address' },
                { id: 'Amount', title: 'Amount' },
                { id: 'Rate', title: 'Rate' },
                { id: 'Category', title: 'Category' },
                { id: 'Weight', title: 'Weight' },
                { id: 'Status', title: 'Status' },
                { id: 'Date', title: 'Date' },
                { id: 'PhoneNumber', title: 'PhoneNumber' },
                { id: 'Remarks', title: 'Remarks' },
                { id: 'PreviousPayments', title: 'PreviousPayments' },
                { id: 'PaidLoan', title: 'PaidLoan' }
            ]
        });

        const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(customersToArchive);

        // Calculate yearly analytics
        const totalLoanTakenAmount = customersToArchive.reduce((sum, customer) => sum + customer.Amount, 0);
        const totalLoanRepaidAmount = customersToArchive.reduce((sum, customer) => {
            return sum + customer.PaidLoan.reduce((loanSum, loan) => loanSum + loan.loanPaidAmount, 0);
        }, 0);

        const yearlyAnalytics = new YearlyAnalytics({
            year: yearToArchive,
            customerCount: customersToArchive.length,
            totalLoanTakenAmount,
            totalLoanRepaidAmount
        });

        await yearlyAnalytics.save();

        console.log(`Archived customer data for the year ${yearToArchive}`);

        return csvData; // Return the CSV data as a string
    } catch (error) {
        console.error('Error archiving data:', error);
        throw error; // Propagate the error for handling in routes
    }
}

// Function to send email with the CSV file as an attachment
async function sendEmailWithAttachment(csvData) {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: process.env.SENDER_EMAIL,
        subject: `Customer Data Archive for ${new Date().getFullYear() - 2}`,
        text: `Please find attached the customer data archive for the year ${new Date().getFullYear() - 2}.`,
        attachments: [
            {
                filename: `customers_${new Date().getFullYear() - 2}.csv`,
                content: csvData,
                contentType: 'text/csv'
            }
        ]
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { archiveAndDeleteOldData, sendEmailWithAttachment };
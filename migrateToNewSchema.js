// File: scripts/migrateToNewSchema.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define the current schema (which is actually the "old" schema in this case)
const customerSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Gender: { type: String },
    Address: { type: String },
    Amount: { type: Number, required: true },
    Rate: { type: Number },
    Category: { type: String },
    Weight: { type: String },
    Status: { type: String, default: 'Active' },
    Date: { type: Date, default: Date.now },
    PhoneNumber: { type: String },
    Remarks: { type: String },
    PreviousPayments: [{
        PaidDate: { type: Date, default: Date.now },
        PaidAmount: { type: Number },
    }],
    PaidLoan: [{
        LoanPaidDate: { type: Date, default: Date.now },
        loanPaidAmount: { type: Number },
    }],
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
}, {
    timestamps: true
});

// Define the new schema
const loanSchema = new mongoose.Schema({
    Amount: { type: Number, required: true },
    Rate: { type: Number },
    Category: { type: String },
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

const newCustomerSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Gender: { type: String },
    Address: { type: String },
    PhoneNumber: { type: String },
    Loans: [loanSchema],
    schemaVersion: { type: Number, default: 2 }
}, {
    timestamps: true
});

// Create models
const Customer = mongoose.model('Customer', customerSchema);
const NewCustomer = mongoose.model('NewCustomer', newCustomerSchema);

function normalizeString(str) {
    return str.toLowerCase().trim();
}

async function migrateData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Fetch all customers from the current schema
        const customers = await Customer.find({});
        console.log(`Found ${customers.length} customers to process`);

        const skippedCustomers = [];
        const customerMap = new Map();

        // First pass: group customers by phone number or name+address
        for (const customer of customers) {
            const key = customer.PhoneNumber ? customer.PhoneNumber : `${normalizeString(customer.Name)}|${normalizeString(customer.Address)}`;

            if (!customerMap.has(key)) {
                customerMap.set(key, []);
            }
            customerMap.get(key).push(customer);
        }

        // Second pass: migrate grouped customers
        for (const [key, groupedCustomers] of customerMap) {
            try {
                const primaryCustomer = groupedCustomers[0];
                const newCustomer = new NewCustomer({
                    Name: primaryCustomer.Name,
                    Gender: primaryCustomer.Gender,
                    Address: primaryCustomer.Address,
                    PhoneNumber: primaryCustomer.PhoneNumber,
                    Loans: groupedCustomers.map(customer => ({
                        Amount: customer.Amount,
                        Rate: customer.Rate,
                        Category: customer.Category,
                        Weight: customer.Weight,
                        Status: customer.Status,
                        Date: customer.Date,
                        Remarks: customer.Remarks,
                        PreviousPayments: customer.PreviousPayments,
                        PaidLoan: customer.PaidLoan.length > 0 ? customer.PaidLoan[0] : undefined,
                        media: customer.media
                    })).filter(loan => loan.Amount !== undefined),
                    schemaVersion: 2
                });

                if (newCustomer.Loans.length === 0) {
                    throw new Error('No valid loans found for this customer group');
                }

                await newCustomer.save();
                console.log(`Migrated customer group: ${primaryCustomer.Name} (${groupedCustomers.length} records)`);
            } catch (error) {
                console.error(`Error migrating customer group ${key}:`, error.message);
                skippedCustomers.push({ key, customers: groupedCustomers.map(c => ({ id: c._id, name: c.Name })), reason: error.message });
            }
        }

        console.log('Migration completed');
        if (skippedCustomers.length > 0) {
            console.log('The following customer groups were skipped and need manual review:');
            console.log(JSON.stringify(skippedCustomers, null, 2));
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

migrateData();



// const mongoose = require('mongoose');
// const Customer = require('./models/customer'); // Adjust the path as needed

// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// async function migrateCustomers() {
//     try {
//         const customers = await Customer.find({ schemaVersion: { $ne: 2 } });
//         console.log(`Found ${customers.length} customers to migrate`);

//         for (const customer of customers) {
//             customer.Loans = [{
//                 Amount: customer.Amount,
//                 Rate: customer.Rate,
//                 Category: customer.Category,
//                 Weight: customer.Weight,
//                 Status: customer.Status,
//                 Date: customer.Date,
//                 Remarks: customer.Remarks,
//                 PreviousPayments: customer.PreviousPayments || [],
//                 PaidLoan: customer.PaidLoan && customer.PaidLoan.length > 0 ? customer.PaidLoan[0] : undefined,
//                 media: customer.media
//             }];

//             customer.schemaVersion = 2;

//             // Remove old fields
//             customer.Amount = undefined;
//             customer.Rate = undefined;
//             customer.Category = undefined;
//             customer.Weight = undefined;
//             customer.Status = undefined;
//             customer.Date = undefined;
//             customer.Remarks = undefined;
//             customer.PreviousPayments = undefined;
//             customer.PaidLoan = undefined;
//             customer.media = undefined;

//             await customer.save();
//             console.log(`Migrated customer: ${customer._id}`);
//         }

//         console.log('Migration completed');
//     } catch (error) {
//         console.error('Migration failed:', error);
//     } finally {
//         mongoose.disconnect();
//     }
// }

// migrateCustomers();
const Customer = require('../models/customer');
const { handleMediaUpload } = require('../utils/imageUploads');
const cloudinary = require('cloudinary').v2;

// Utility functions
function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

const addCustomer = async (req, res) => {
  try {
    const { Name, Address, PhoneNumber, ...loanData } = req.body;

    // Normalize the name and address for comparison
    const normalizedName = Name.toLowerCase().trim();
    const normalizedAddress = Address ? Address.toLowerCase().trim() : '';

    // Check for existing customer
    let existingCustomer = null;

    if (PhoneNumber) {
      existingCustomer = await Customer.findOne({ PhoneNumber });
    }

    if (!existingCustomer) {
      existingCustomer = await Customer.findOne({
        Name: { $regex: new RegExp('^' + normalizedName + '$', 'i') },
        Address: { $regex: new RegExp('^' + normalizedAddress + '$', 'i') }
      });
    }

    let newCustomer;

    if (existingCustomer) {
      // Add new loan to existing customer
      existingCustomer.Loans.push(loanData);
      newCustomer = await existingCustomer.save();
    } else {
      // Create new customer
      newCustomer = new Customer({
        Name,
        Address,
        PhoneNumber,
        Loans: [loanData],
        schemaVersion: 2
      });
    }

    // Handle media upload
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        const mediaData = await handleMediaUpload(req.files);
        newCustomer.Loans[newCustomer.Loans.length - 1].media = mediaData;
      } catch (mediaError) {
        console.error('Error processing media:', mediaError);
        newCustomer.Loans[newCustomer.Loans.length - 1].media = { error: 'Failed to process media' };
      }
    }

    await newCustomer.save();
    // Invalidate cache
    await req.redis.del('customers');
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'An error occurred while adding the customer' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { search, category, sortBy } = req.query;
    const cacheKey = `customers:${search || ''}:${category || ''}:${sortBy || ''}`;

    // Try to get data from cache
    let cachedData = await req.redis.get(cacheKey);
    let customers;

    if (cachedData) {
      customers = JSON.parse(cachedData);
    } else {
      let query = {};

      if (search) {
        query.$or = [
          { Name: new RegExp(search, 'i') },
          { PhoneNumber: new RegExp(search, 'i') },
          { 'Loans.Category': new RegExp(search, 'i') }
        ];
      }

      if (category) {
        query['Loans.Category'] = category;
      }

      let sortOption = { 'Loans.Date': -1 };
      if (sortBy) {
        if (sortBy === 'Amount') {
          sortOption = { 'Loans.Amount': 1 };
        } else if (sortBy === '-Amount') {
          sortOption = { 'Loans.Amount': -1 };
        } else if (sortBy === 'Date') {
          sortOption = { 'Loans.Date': -1 };
        } else if (sortBy === '-Date') {
          sortOption = { 'Loans.Date': 1 };
        }
      }

      customers = await Customer.find(query).sort(sortOption).lean();

      // Transform the data to ensure it matches the new schema
      customers = customers.map(customer => {
        if (customer.schemaVersion === 2) {
          return customer;
        } else {
          // Transform old schema to new schema
          return {
            _id: customer._id,
            Name: customer.Name,
            Gender: customer.Gender,
            Address: customer.Address,
            PhoneNumber: customer.PhoneNumber,
            Loans: [{
              Amount: customer.Amount,
              Rate: customer.Rate,
              Category: customer.Category,
              Weight: customer.Weight,
              Status: customer.Status,
              Date: customer.Date,
              Remarks: customer.Remarks,
              PreviousPayments: customer.PreviousPayments || [],
              PaidLoan: customer.PaidLoan && customer.PaidLoan.length > 0 ? customer.PaidLoan[0] : undefined,
              media: customer.media
            }],
            schemaVersion: 2,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
          };
        }
      });

      // Cache the result for 5 minutes
      await req.redis.setex(cacheKey, 300, JSON.stringify(customers));
    }

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'An error occurred while fetching customers' });
  }
};
const getCustomersById = async (req, res) => {
  try {
    const cacheKey = `customer:${req.params.id}`;

    // Try to get data from cache
    const cachedData = await req.redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    const customer = await Customer.findById(req.params.id);
    console.log("param",customer,req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Cache the result for 5 minutes
    await req.redis.setex(cacheKey, 300, JSON.stringify(customer));
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'An error occurred while fetching the customer' });
  }
};
// const getCustomersById = async (req, res) => {
//   try {
//     const customer = await Customer.findById(req.params.id);
//     if (!customer) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }

//     // Transform the data to ensure it matches the new schema
//     let transformedCustomer;
//     if (customer.schemaVersion === 2) {
//       transformedCustomer = customer;
//     } else {
//       transformedCustomer = {
//         _id: customer._id,
//         Name: customer.Name,
//         Gender: customer.Gender,
//         Address: customer.Address,
//         PhoneNumber: customer.PhoneNumber,
//         Loans: [{
//           Amount: customer.Amount,
//           Rate: customer.Rate,
//           Category: customer.Category,
//           Weight: customer.Weight,
//           Status: customer.Status,
//           Date: customer.Date,
//           Remarks: customer.Remarks,
//           PreviousPayments: customer.PreviousPayments || [],
//           PaidLoan: customer.PaidLoan && customer.PaidLoan.length > 0 ? customer.PaidLoan[0] : undefined,
//           media: customer.media
//         }],
//         schemaVersion: 2,
//         createdAt: customer.createdAt,
//         updatedAt: customer.updatedAt
//       };
//     }

//     res.json(transformedCustomer);
//   } catch (error) {
//     console.error('Error fetching customer:', error);
//     res.status(500).json({ error: 'An error occurred while fetching the customer' });
//   }
// };

const updateCustomer = async (req, res) => {
  try {
    const { customerData, loanData } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update customer data
    if (customerData) {
      Object.assign(customer, customerData);
    }

    // Update loan data
    if (loanData && Array.isArray(loanData)) {
      customer.Loans = loanData.map(updatedLoan => {
        const existingLoan = customer.Loans.id(updatedLoan._id);
        if (existingLoan) {
          // Update existing loan
          Object.assign(existingLoan, updatedLoan);

          // Explicitly handle PaidLoan
          if (updatedLoan.PaidLoan) {
            existingLoan.PaidLoan = updatedLoan.PaidLoan;
          }

          return existingLoan;
        } else {
          // If it's a new loan, return the updatedLoan as is
          return updatedLoan;
        }
      });
    }

    // Handle media upload
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        const mediaData = await handleMediaUpload(req.files);
        if (customer.Loans.length > 0) {
          customer.Loans[customer.Loans.length - 1].media = mediaData;
        }
      } catch (mediaError) {
        console.error('Error processing media:', mediaError);
      }
    }

    await customer.save();

    await req.redis.del(`customer:${req.params.id}`);
    await req.redis.del('customers');
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'An error occurred while updating the customer' });
  }
};


const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete associated media from Cloudinary for all loans
    for (const loan of customer.Loans) {
      if (loan.media) {
        if (loan.media.image && loan.media.image.publicId) {
          await cloudinary.uploader.destroy(loan.media.image.publicId);
        }
        if (loan.media.video && loan.media.video.publicId) {
          await cloudinary.uploader.destroy(loan.media.video.publicId, { resource_type: 'video' });
        }
      }
    }

    // Delete customer from the database
    await Customer.findByIdAndDelete(customerId);

    // Invalidate specific customer cache
    await req.redis.del(`customer:${customerId}`);

    // Invalidate all customers cache
    const keys = await req.redis.keys('customers:*');
    if (keys.length > 0) {
      await req.redis.del(keys);
    }

    // Invalidate analytics cache if it exists
    await req.redis.del('analytics');

    res.json({ message: 'Customer and associated media deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'An error occurred while deleting the customer' });
  }
};

async function getAnalytics(req, res) {
  try {
    const now = new Date();
    const startOfCurrentMonth = getStartOfMonth(now);
    const startOfPreviousMonth = getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const startOfCurrentYear = getStartOfYear(now);
    const startOfPreviousYear = getStartOfYear(new Date(now.getFullYear() - 1, 0, 1));

    // Updated aggregation pipeline for yearly data
    const yearlyData = await Customer.aggregate([
      { $unwind: "$Loans" },
      {
        $group: {
          _id: { year: { $year: "$Loans.Date" } },
          uniqueCustomers: { $addToSet: "$_id" },
          totalLoanTakenAmount: { $sum: "$Loans.Amount" },
          totalLoans: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          customerCount: { $size: "$uniqueCustomers" },
          totalLoanTakenAmount: 1,
          totalLoans: 1,
          averageLoanAmount: { $divide: ["$totalLoanTakenAmount", "$totalLoans"] }
        }
      },
      { $sort: { year: 1 } }
    ]);

    // Updated aggregation pipeline for monthly data
    const allMonthlyData = await Customer.aggregate([
      { $unwind: "$Loans" },
      {
        $group: {
          _id: { year: { $year: "$Loans.Date" }, month: { $month: "$Loans.Date" } },
          uniqueCustomers: { $addToSet: "$_id" },
          totalLoanTakenAmount: { $sum: "$Loans.Amount" },
          totalLoans: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          customerCount: { $size: "$uniqueCustomers" },
          totalLoanTakenAmount: 1,
          totalLoans: 1,
          averageLoanAmount: { $divide: ["$totalLoanTakenAmount", "$totalLoans"] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    // Updated aggregation pipeline for yearly loan repaid data
    const yearlyLoanRepaidData = await Customer.aggregate([
      { $unwind: "$Loans" },
      { $unwind: "$Loans.PaidLoan" },
      {
        $group: {
          _id: { year: { $year: "$Loans.PaidLoan.LoanPaidDate" } },
          totalLoanRepaidAmount: { $sum: "$Loans.PaidLoan.loanPaidAmount" },
          totalRepaidLoans: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          totalLoanRepaidAmount: 1,
          totalRepaidLoans: 1,
          averageRepaidAmount: { $divide: ["$totalLoanRepaidAmount", "$totalRepaidLoans"] }
        }
      },
      { $sort: { year: 1 } }
    ]);

    const allMonthlyLoanRepaidData = await Customer.aggregate([
      { $unwind: "$Loans" },
      { $unwind: "$Loans.PaidLoan" },
      {
        $group: {
          _id: { year: { $year: "$Loans.PaidLoan.LoanPaidDate" }, month: { $month: "$Loans.PaidLoan.LoanPaidDate" } },
          totalLoanRepaidAmount: { $sum: "$Loans.PaidLoan.loanPaidAmount" },
          totalRepaidLoans: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalLoanRepaidAmount: 1,
          totalRepaidLoans: 1,
          averageRepaidAmount: { $divide: ["$totalLoanRepaidAmount", "$totalRepaidLoans"] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    // Prepare data for last 8 months
    const last8Months = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last8Months.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
    }

    const monthlyData = last8Months.map(({ year, month }) => {
      const found = allMonthlyData.find(d => d.year === year && d.month === month);
      return {
        year,
        month,
        customerCount: found ? found.customerCount : 0,
        totalLoanTakenAmount: found ? found.totalLoanTakenAmount : 0,
        totalLoans: found ? found.totalLoans : 0,
        averageLoanAmount: found ? found.averageLoanAmount : 0
      };
    });

    const monthlyLoanRepaidData = last8Months.map(({ year, month }) => {
      const found = allMonthlyLoanRepaidData.find(d => d.year === year && d.month === month);
      return {
        year,
        month,
        totalLoanRepaidAmount: found ? found.totalLoanRepaidAmount : 0,
        totalRepaidLoans: found ? found.totalRepaidLoans : 0,
        averageRepaidAmount: found ? found.averageRepaidAmount : 0
      };
    });

    // Current and previous month/year data for growth calculations
    const [currentMonthData, previousMonthData, currentYearData, previousYearData] = await Promise.all([
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.Date": { $gte: startOfCurrentMonth } } },
        {
          $group: {
            _id: null,
            uniqueCustomers: { $addToSet: "$_id" },
            totalLoanTakenAmount: { $sum: "$Loans.Amount" },
            totalLoans: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            customerCount: { $size: "$uniqueCustomers" },
            totalLoanTakenAmount: 1,
            totalLoans: 1,
            averageLoanAmount: { $divide: ["$totalLoanTakenAmount", "$totalLoans"] }
          }
        }
      ]),
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.Date": { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth } } },
        {
          $group: {
            _id: null,
            uniqueCustomers: { $addToSet: "$_id" },
            totalLoanTakenAmount: { $sum: "$Loans.Amount" },
            totalLoans: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            customerCount: { $size: "$uniqueCustomers" },
            totalLoanTakenAmount: 1,
            totalLoans: 1,
            averageLoanAmount: { $divide: ["$totalLoanTakenAmount", "$totalLoans"] }
          }
        }
      ]),
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.Date": { $gte: startOfCurrentYear } } },
        {
          $group: {
            _id: null,
            uniqueCustomers: { $addToSet: "$_id" },
            totalLoanTakenAmount: { $sum: "$Loans.Amount" },
            totalLoans: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            customerCount: { $size: "$uniqueCustomers" },
            totalLoanTakenAmount: 1,
            totalLoans: 1,
            averageLoanAmount: { $divide: ["$totalLoanTakenAmount", "$totalLoans"] }
          }
        }
      ]),
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.Date": { $gte: startOfPreviousYear, $lt: startOfCurrentYear } } },
        {
          $group: {
            _id: null,
            uniqueCustomers: { $addToSet: "$_id" },
            totalLoanTakenAmount: { $sum: "$Loans.Amount" },
            totalLoans: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            customerCount: { $size: "$uniqueCustomers" },
            totalLoanTakenAmount: 1,
            totalLoans: 1,
            averageLoanAmount: { $divide: ["$totalLoanTakenAmount", "$totalLoans"] }
          }
        }
      ])
    ]);

    const currentMonthStats = currentMonthData[0] || { customerCount: 0, totalLoanTakenAmount: 0, totalLoans: 0 };
    const previousMonthStats = previousMonthData[0] || { customerCount: 0, totalLoanTakenAmount: 0, totalLoans: 0 };
    const currentYearStats = currentYearData[0] || { customerCount: 0, totalLoanTakenAmount: 0, totalLoans: 0 };
    const previousYearStats = previousYearData[0] || { customerCount: 0, totalLoanTakenAmount: 0, totalLoans: 0 };

    // Calculate growth rates
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    const momCustomerGrowth = calculateGrowth(currentMonthStats.customerCount, previousMonthStats.customerCount);
    const yoyCustomerGrowth = calculateGrowth(currentYearStats.customerCount, previousYearStats.customerCount);
    const momLoanCountGrowth = calculateGrowth(currentMonthStats.totalLoans, previousMonthStats.totalLoans);
    const yoyLoanCountGrowth = calculateGrowth(currentYearStats.totalLoans, previousYearStats.totalLoans);
    const momAmountGrowth = calculateGrowth(currentMonthStats.totalLoanTakenAmount, previousMonthStats.totalLoanTakenAmount);
    const yoyAmountGrowth = calculateGrowth(currentYearStats.totalLoanTakenAmount, previousYearStats.totalLoanTakenAmount);

    // Calculate repayment rates
    const [currentMonthRepaid, previousMonthRepaid, currentYearRepaid, previousYearRepaid] = await Promise.all([
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.PaidLoan.LoanPaidDate": { $gte: startOfCurrentMonth } } },
        {
          $group: {
            _id: null,
            totalRepaidAmount: { $sum: "$Loans.PaidLoan.loanPaidAmount" },
            totalRepaidLoans: { $sum: 1 }
          }
        }
      ]),
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.PaidLoan.LoanPaidDate": { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth } } },
        {
          $group: {
            _id: null,
            totalRepaidAmount: { $sum: "$Loans.PaidLoan.loanPaidAmount" },
            totalRepaidLoans: { $sum: 1 }
          }
        }
      ]),
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.PaidLoan.LoanPaidDate": { $gte: startOfCurrentYear } } },
        {
          $group: {
            _id: null,
            totalRepaidAmount: { $sum: "$Loans.PaidLoan.loanPaidAmount" },
            totalRepaidLoans: { $sum: 1 }
          }
        }
      ]),
      Customer.aggregate([
        { $unwind: "$Loans" },
        { $match: { "Loans.PaidLoan.LoanPaidDate": { $gte: startOfPreviousYear, $lt: startOfCurrentYear } } },
        {
          $group: {
            _id: null,
            totalRepaidAmount: { $sum: "$Loans.PaidLoan.loanPaidAmount" },
            totalRepaidLoans: { $sum: 1 }
          }
        }
      ])
    ]);

    const currentMonthRepaidStats = currentMonthRepaid[0] || { totalRepaidAmount: 0, totalRepaidLoans: 0 };
    const previousMonthRepaidStats = previousMonthRepaid[0] || { totalRepaidAmount: 0, totalRepaidLoans: 0 };
    const currentYearRepaidStats = currentYearRepaid[0] || { totalRepaidAmount: 0, totalRepaidLoans: 0 };
    const previousYearRepaidStats = previousYearRepaid[0] || { totalRepaidAmount: 0, totalRepaidLoans: 0 };

    const momRepaidAmountGrowth = calculateGrowth(currentMonthRepaidStats.totalRepaidAmount, previousMonthRepaidStats.totalRepaidAmount);
    const yoyRepaidAmountGrowth = calculateGrowth(currentYearRepaidStats.totalRepaidAmount, previousYearRepaidStats.totalRepaidAmount);
    const momRepaidLoanCountGrowth = calculateGrowth(currentMonthRepaidStats.totalRepaidLoans, previousMonthRepaidStats.totalRepaidLoans);
    const yoyRepaidLoanCountGrowth = calculateGrowth(currentYearRepaidStats.totalRepaidLoans, previousYearRepaidStats.totalRepaidLoans);

    // Calculate repayment rates
    const currentMonthRepaymentRate = (currentMonthRepaidStats.totalRepaidLoans / currentMonthStats.totalLoans * 100).toFixed(1);
    const previousMonthRepaymentRate = (previousMonthRepaidStats.totalRepaidLoans / previousMonthStats.totalLoans * 100).toFixed(1);
    const currentYearRepaymentRate = (currentYearRepaidStats.totalRepaidLoans / currentYearStats.totalLoans * 100).toFixed(1);
    const previousYearRepaymentRate = (previousYearRepaidStats.totalRepaidLoans / previousYearStats.totalLoans * 100).toFixed(1);

    res.json({
      currentMonth: {
        ...currentMonthStats,
        totalLoanRepaidAmount: currentMonthRepaidStats.totalRepaidAmount,
        repaidLoans: currentMonthRepaidStats.totalRepaidLoans,
        repaymentRate: currentMonthRepaymentRate
      },
      previousMonth: {
        ...previousMonthStats,
        totalLoanRepaidAmount: previousMonthRepaidStats.totalRepaidAmount,
        repaidLoans: previousMonthRepaidStats.totalRepaidLoans,
        repaymentRate: previousMonthRepaymentRate
      },
      currentYear: {
        ...currentYearStats,
        totalLoanRepaidAmount: currentYearRepaidStats.totalRepaidAmount,
        repaidLoans: currentYearRepaidStats.totalRepaidLoans,
        repaymentRate: currentYearRepaymentRate
      },
      previousYear: {
        ...previousYearStats,
        totalLoanRepaidAmount: previousYearRepaidStats.totalRepaidAmount,
        repaidLoans: previousYearRepaidStats.totalRepaidLoans,
        repaymentRate: previousYearRepaymentRate
      },
      growth: {
        momCustomerGrowth,
        yoyCustomerGrowth,
        momLoanCountGrowth,
        yoyLoanCountGrowth,
        momAmountGrowth,
        yoyAmountGrowth,
        momRepaidAmountGrowth,
        yoyRepaidAmountGrowth,
        momRepaidLoanCountGrowth,
        yoyRepaidLoanCountGrowth
      },
      yearlyData,
      monthlyData,
      yearlyLoanRepaidData,
      monthlyLoanRepaidData
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'An error occurred while generating analytics' });
  }
}

module.exports = { addCustomer, getAnalytics, updateCustomer, getCustomers, getCustomersById, deleteCustomer };
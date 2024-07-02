const Customer = require('../models/customer');
// Utility function to get the start of a month
function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Utility function to get the start of a year
function getStartOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

async function addCustomer(req, res) {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}

async function updateCustomer(req, res) {
  const customerId = req.params.id;
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(customerId, req.body, { new: true });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}

async function getCustomers(req, res) {
  try {
    const { search, category, sortBy } = req.query;
    let query = {};

    if (search) {
      query = { Name: new RegExp(search, 'i') };
    }

    if (category) {
      query.Category = category;
    }

    // Parse sortBy parameter to handle sorting by both amount and date
    let sortOption;
    if (sortBy) {
      if (sortBy === 'Amount') {
        sortOption = { Amount: 1, Date: -1 }; // Sort by Amount ascending, Date descending
      } else if (sortBy === '-Amount') {
        sortOption = { Amount: -1, Date: -1 }; // Sort by Amount descending, Date descending
      } else if (sortBy === 'Date') {
        sortOption = { Date: -1, Amount: -1 }; // Sort by Date descending, Amount descending
      } else if (sortBy === '-Date') {
        sortOption = { Date: 1, Amount: -1 }; // Sort by Date ascending, Amount descending
      }
    } else {
      // Default sorting by Date descending if sortBy parameter is not provided
      sortOption = { Date: -1 };
    }

    const customers = await Customer.find(query).sort(sortOption);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}


async function getAnalytics(req, res) {
  try {
    const now = new Date();
    const startOfCurrentMonth = getStartOfMonth(now);
    const startOfPreviousMonth = getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const startOfCurrentYear = getStartOfYear(now);
    const startOfPreviousYear = getStartOfYear(new Date(now.getFullYear() - 1, 0, 1));

    // Aggregate data for yearly and monthly trends
    const yearlyData = await Customer.aggregate([
      {
        $group: {
          _id: { year: { $year: "$Date" } },
          customerCount: { $sum: 1 },
          totalLoanTakenAmount: { $sum: "$Amount" }
        }
      },
      { $sort: { "_id.year": 1 } } // Sort by year
    ]);

    const allMonthlyData = await Customer.aggregate([
      {
        $group: {
          _id: { year: { $year: "$Date" }, month: { $month: "$Date" } },
          customerCount: { $sum: 1 },
          totalLoanTakenAmount: { $sum: "$Amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } } // Sort by year and month
    ]);

    const yearlyLoanRepaidData = await Customer.aggregate([
      { $unwind: "$PaidLoan" },
      {
        $group: {
          _id: { year: { $year: "$PaidLoan.LoanPaidDate" } },
          totalLoanRepaidAmount: { $sum: "$PaidLoan.loanPaidAmount" }
        }
      },
      { $sort: { "_id.year": 1 } } // Sort by year
    ]);

    const allMonthlyLoanRepaidData = await Customer.aggregate([
      { $unwind: "$PaidLoan" },
      {
        $group: {
          _id: { year: { $year: "$PaidLoan.LoanPaidDate" }, month: { $month: "$PaidLoan.LoanPaidDate" } },
          totalLoanRepaidAmount: { $sum: "$PaidLoan.loanPaidAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } } // Sort by year and month
    ]);

    // Prepare data for last 8 months
    const last8Months = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last8Months.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
    }

    const monthlyData = last8Months.map(({ year, month }) => {
      const found = allMonthlyData.find(d => d._id.year === year && d._id.month === month);
      return {
        year,
        month,
        customerCount: found ? found.customerCount : 0,
        totalLoanTakenAmount: found ? found.totalLoanTakenAmount : 0
      };
    });

    const monthlyLoanRepaidData = last8Months.map(({ year, month }) => {
      const found = allMonthlyLoanRepaidData.find(d => d._id.year === year && d._id.month === month);
      return {
        year,
        month,
        totalLoanRepaidAmount: found ? found.totalLoanRepaidAmount : 0
      };
    });

    // Current and previous month/year data for growth calculations
    const [currentMonthData, previousMonthData, currentYearData, previousYearData, currentMonthLoanRepaidData, previousMonthLoanRepaidData, currentYearLoanRepaidData, previousYearLoanRepaidData] = await Promise.all([
      Customer.aggregate([
        { $match: { Date: { $gte: startOfCurrentMonth } } },
        { $group: { _id: null, customerCount: { $sum: 1 }, totalLoanTakenAmount: { $sum: '$Amount' } } }
      ]),
      Customer.aggregate([
        { $match: { Date: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth } } },
        { $group: { _id: null, customerCount: { $sum: 1 }, totalLoanTakenAmount: { $sum: '$Amount' } } }
      ]),
      Customer.aggregate([
        { $match: { Date: { $gte: startOfCurrentYear } } },
        { $group: { _id: null, customerCount: { $sum: 1 }, totalLoanTakenAmount: { $sum: '$Amount' } } }
      ]),
      Customer.aggregate([
        { $match: { Date: { $gte: startOfPreviousYear, $lt: startOfCurrentYear } } },
        { $group: { _id: null, customerCount: { $sum: 1 }, totalLoanTakenAmount: { $sum: '$Amount' } } }
      ]),
      Customer.aggregate([
        { $match: { "PaidLoan.LoanPaidDate": { $gte: startOfCurrentMonth } } },
        { $unwind: "$PaidLoan" },
        { $group: { _id: null, totalLoanRepaidAmount: { $sum: "$PaidLoan.loanPaidAmount" } } }
      ]),
      Customer.aggregate([
        { $match: { "PaidLoan.LoanPaidDate": { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth } } },
        { $unwind: "$PaidLoan" },
        { $group: { _id: null, totalLoanRepaidAmount: { $sum: "$PaidLoan.loanPaidAmount" } } }
      ]),
      Customer.aggregate([
        { $match: { "PaidLoan.LoanPaidDate": { $gte: startOfCurrentYear } } },
        { $unwind: "$PaidLoan" },
        { $group: { _id: null, totalLoanRepaidAmount: { $sum: "$PaidLoan.loanPaidAmount" } } }
      ]),
      Customer.aggregate([
        { $match: { "PaidLoan.LoanPaidDate": { $gte: startOfPreviousYear, $lt: startOfCurrentYear } } },
        { $unwind: "$PaidLoan" },
        { $group: { _id: null, totalLoanRepaidAmount: { $sum: "$PaidLoan.loanPaidAmount" } } }
      ])
    ]);

    const currentMonthStats = currentMonthData[0] || { customerCount: 0, totalLoanTakenAmount: 0 };
    const previousMonthStats = previousMonthData[0] || { customerCount: 0, totalLoanTakenAmount: 0 };
    const currentYearStats = currentYearData[0] || { customerCount: 0, totalLoanTakenAmount: 0 };
    const previousYearStats = previousYearData[0] || { customerCount: 0, totalLoanTakenAmount: 0 };

    const currentMonthLoanRepaidStats = currentMonthLoanRepaidData[0] || { totalLoanRepaidAmount: 0 };
    const previousMonthLoanRepaidStats = previousMonthLoanRepaidData[0] || { totalLoanRepaidAmount: 0 };
    const currentYearLoanRepaidStats = currentYearLoanRepaidData[0] || { totalLoanRepaidAmount: 0 };
    const previousYearLoanRepaidStats = previousYearLoanRepaidData[0] || { totalLoanRepaidAmount: 0 };

    const momCustomerGrowth = (((currentMonthStats.customerCount - previousMonthStats.customerCount) / (previousMonthStats.customerCount || 1)) * 100).toFixed(1);
    const yoyCustomerGrowth = (((currentYearStats.customerCount - previousYearStats.customerCount) / (previousYearStats.customerCount || 1)) * 100).toFixed(1);
    const momAmountGrowth = (((currentMonthStats.totalLoanTakenAmount - previousMonthStats.totalLoanTakenAmount) / (previousMonthStats.totalLoanTakenAmount || 1)) * 100).toFixed(1);
    const yoyAmountGrowth = (((currentYearStats.totalLoanTakenAmount - previousYearStats.totalLoanTakenAmount) / (previousYearStats.totalLoanTakenAmount || 1)) * 100).toFixed(1);

    const momLoanRepaidAmountGrowth = (((currentMonthLoanRepaidStats.totalLoanRepaidAmount - previousMonthLoanRepaidStats.totalLoanRepaidAmount) / (previousMonthLoanRepaidStats.totalLoanRepaidAmount || 1)) * 100).toFixed(1);
    const yoyLoanRepaidAmountGrowth = (((currentYearLoanRepaidStats.totalLoanRepaidAmount - previousYearLoanRepaidStats.totalLoanRepaidAmount) / (previousYearLoanRepaidStats.totalLoanRepaidAmount || 1)) * 100).toFixed(1);

    res.json({
      currentMonth: currentMonthStats,
      previousMonth: previousMonthStats,
      currentYear: currentYearStats,
      previousYear: previousYearStats,
      momCustomerGrowth,
      yoyCustomerGrowth,
      momAmountGrowth,
      yoyAmountGrowth,
      currentMonthLoanRepaidStats,
      previousMonthLoanRepaidStats,
      currentYearLoanRepaidStats,
      previousYearLoanRepaidStats,
      momLoanRepaidAmountGrowth,
      yoyLoanRepaidAmountGrowth,
      yearlyData,
      monthlyData,
      yearlyLoanRepaidData,
      monthlyLoanRepaidData
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}


async function getCustomersById(req, res) {
  const customerId = req.params.id;
  try {
    const coustomer = await Customer.findById(customerId);
    res.json(coustomer);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}



async function deleteCustomer(req, res) {
  const customerId = req.params.id;
  try {
    await Customer.findByIdAndDelete(customerId);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}

module.exports = { addCustomer, getAnalytics, updateCustomer, getCustomers, getCustomersById, deleteCustomer };

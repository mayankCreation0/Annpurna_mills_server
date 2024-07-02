const Staff = require('../models/staff');
const StaffAttendance = require('../models/staffAttendance');

// Create a new staff profile
exports.createStaff = async (req, res) => {
  try {
    const { name, position, dateOfJoining } = req.body;
    const newStaff = new Staff({ name, position, dateOfJoining });
    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all staff profiles
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single staff profile by ID with additional details
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);

    const currentMonthAttendance = await StaffAttendance.find({
      staff: req.params.id,
      date: { $gte: currentMonthStart }
    }).sort({ date: -1 });

    const currentYearAttendance = await StaffAttendance.find({
      staff: req.params.id,
      date: { $gte: currentYearStart }
    }).sort({ date: -1 });

    // Function to filter unique dates keeping the latest record
    const getUniqueLatestAttendance = (attendanceRecords) => {
      const dateMap = new Map();
      attendanceRecords.forEach(record => {
        const dateString = record.date.toISOString().split('T')[0];
        if (!dateMap.has(dateString)) {
          dateMap.set(dateString, record);
        }
      });
      return Array.from(dateMap.values());
    };

    const uniqueMonthAttendance = getUniqueLatestAttendance(currentMonthAttendance);
    const uniqueYearAttendance = getUniqueLatestAttendance(currentYearAttendance);

    const totalMonthMoney = uniqueMonthAttendance.reduce((acc, record) => acc + (record.moneyTaken || 0), 0);
    const totalYearMoney = uniqueYearAttendance.reduce((acc, record) => acc + (record.moneyTaken || 0), 0);

    const totalDaysPresent = uniqueYearAttendance.reduce((acc, record) => {
      if (record.status === 'present') return acc + 1;
      if (record.status === 'half day') return acc + 0.5;
      return acc;
    }, 0);

    const totalDaysPresentCurrentMonth = uniqueMonthAttendance.reduce((acc, record) => {
      if (record.status === 'present') return acc + 1;
      if (record.status === 'half day') return acc + 0.5;
      return acc;
    }, 0);

    const response = {
      ...staff.toObject(),
      currentMonthPay: `₹${totalMonthMoney}`,
      currentYearPay: `₹${totalYearMoney}`,
      totalDaysPresent,
      totalDaysPresentCurrentMonth
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Update a staff profile by ID
exports.updateStaff = async (req, res) => {
  try {
    const { name, position, dateOfJoining } = req.body;
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, position, dateOfJoining },
      { new: true, runValidators: true }
    );
    if (!updatedStaff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.status(200).json(updatedStaff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a staff profile by ID
exports.deleteStaff = async (req, res) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

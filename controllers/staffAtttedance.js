// controllers/staffAttendanceController.js
const StaffAttendance = require('../models/staffAttendance');

// Create a new attendance record for a staff member
exports.createAttendance = async (req, res) => {
  try {
    const { staffId, status, moneyTaken, remark, date } = req.body;
    const newAttendance = new StaffAttendance({
      staff: staffId,
      status,
      moneyTaken,
      remark,
      date,
    });
    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all attendance records for a staff member
exports.getAttendanceByStaffId = async (req, res) => {
  try {
    const attendance = await StaffAttendance.find({ staff: req.params.staffId }).populate('staff');
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single attendance record by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await StaffAttendance.findById(req.params.id).populate('staff');
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an attendance record by ID
exports.updateAttendance = async (req, res) => {
  try {
    const { status, moneyTaken, remark, date } = req.body;
    const updatedAttendance = await StaffAttendance.findByIdAndUpdate(
      req.params.id,
      { status, moneyTaken, remark, date },
      { new: true, runValidators: true }
    );
    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.status(200).json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an attendance record by ID
exports.deleteAttendance = async (req, res) => {
  try {
    const deletedAttendance = await StaffAttendance.findByIdAndDelete(req.params.id);
    if (!deletedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

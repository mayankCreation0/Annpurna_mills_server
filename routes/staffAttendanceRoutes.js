const express = require('express');
const router = express.Router();
const staffAttendanceController  = require('../controllers/staffAtttedance');
const auth = require('../middlewares/middleware');

router.post('/add',auth, staffAttendanceController.createAttendance);
router.get('/staff/:staffId',auth, staffAttendanceController.getAttendanceByStaffId);
router.get('/get/:id',auth, staffAttendanceController.getAttendanceById);
router.patch('/update/:id',auth, staffAttendanceController.updateAttendance);
router.delete('/delete/:id',auth, staffAttendanceController.deleteAttendance);

module.exports = router;    
const express= require('express');
const router = express.Router();
const staffController =require('../controllers/staffController');
const auth = require('../middlewares/middleware');

router.post('/add',auth, staffController.createStaff);
router.get('/get',auth, staffController.getAllStaff);
router.get('/get/:id',auth, staffController.getStaffById);
router.patch('/update/:id',auth, staffController.updateStaff);
router.delete('/delete/:id',auth, staffController.deleteStaff);


module.exports = router;
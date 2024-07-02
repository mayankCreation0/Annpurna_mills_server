const express = require('express');
const router = express.Router();
const auth = require('../middlewares/middleware')
const { addCustomer, updateCustomer, deleteCustomer, getCustomers, getCustomersById, getAnalytics } = require('../controllers/customercontroller')

router.post('/add',auth, addCustomer);
router.patch('/update/:id',auth, updateCustomer);
router.get('/get', auth, getCustomers);
router.get('/get/analytics', auth, getAnalytics);
router.get('/get/:id', auth, getCustomersById);
router.delete('/delete/:id',auth, deleteCustomer);

module.exports = router;
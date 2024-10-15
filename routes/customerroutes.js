const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middlewares/middleware');
const YearlyAnalytics = require('../models/archiveAnalytics');
const { archiveAndDeleteOldData, sendEmailWithAttachment } = require('../utils/archiving');
const { addCustomer, updateCustomer, deleteCustomer, getCustomers, getCustomersById, getAnalytics } = require('../controllers/customercontroller');
const customer = require('../models/customer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/add', auth, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), addCustomer);

router.patch('/update/:id', auth, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), updateCustomer);

router.get('/get', auth, getCustomers);
router.get('/get/analytics', auth, getAnalytics);
router.get('/get/:id', auth, getCustomersById);
router.delete('/delete/:id', auth, deleteCustomer);

router.get('/analytics/yearly', auth, async (req, res) => {
    try {
        const analytics = await YearlyAnalytics.find();
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.get('/archive-and-send-email', async (req, res) => {
    try {
        const csvData = await archiveAndDeleteOldData();
        if (!csvData) {
            return res.status(404).send('No data to archive');
        }
        await sendEmailWithAttachment(csvData);

        const yearToArchive = new Date().getFullYear() - 2;
        const startOfYear = new Date(yearToArchive, 0, 1);
        const endOfYear = new Date(yearToArchive + 1, 0, 1);

        await customer.deleteMany({
            Status: 'Completed',
            Date: { $gte: startOfYear, $lt: endOfYear }
        });

        console.log(`Deleted customer data for the year ${yearToArchive}`);
        res.status(200).send('CSV file has been sent via email successfully and data has been deleted');
    } catch (error) {
        console.error('Error sending email with CSV:', error);
        res.status(500).send('Error sending email with CSV');
    }
});

module.exports = router;
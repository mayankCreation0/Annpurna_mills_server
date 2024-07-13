const express = require('express');
const router = express.Router();
const auth = require('../middlewares/middleware')
const YearlyAnalytics = require('../models/archiveAnalytics'); 
const { archiveAndDeleteOldData, sendEmailWithAttachment } = require('../utils/archiving');
const { addCustomer, updateCustomer, deleteCustomer, getCustomers, getCustomersById, getAnalytics } = require('../controllers/customercontroller');
const customer = require('../models/customer');

router.post('/add', addCustomer);
router.patch('/update/:id',auth, updateCustomer);
router.get('/get',auth, getCustomers);
router.get('/get/analytics', auth, getAnalytics);
router.get('/get/:id', auth, getCustomersById);
router.delete('/delete/:id',auth, deleteCustomer);
router.get('/analytics/yearly', async (req, res) => {
    try {
        const analytics = await YearlyAnalytics.find();
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});
// router.post('/archive-manual', async (req, res) => {
//     try {
//         const csvFilePath = await archiveAndDeleteOldData();

//         // Send the CSV file as a download attachment
//         res.download(csvFilePath, `customers_${new Date().getFullYear() - 2}.csv`, (err) => {
//             if (err) {
//                 console.error('Error sending CSV file:', err);
//                 res.status(500).json({ error: 'Failed to download CSV file' });
//             } else {
//                 console.log('CSV file download successful');
//             }
//         });
//     } catch (error) {
//         console.error('Error archiving data:', error);
//         res.status(500).json({ error: 'An error occurred during manual archiving' });
//     }
// });
// router.get('/download-csv', async (req, res) => {
//     try {
//         const csvFilePath = await archiveAndDeleteOldData();

//         if (!csvFilePath) {
//             return res.status(404).send('No data to archive');
//         }

//         // Set appropriate headers for CSV download
//         res.setHeader('Content-Type', 'text/csv');
//         res.setHeader('Content-Disposition', `attachment; filename=customers_${new Date().getFullYear() - 2}.csv`);
//         res.sendFile(csvFilePath);
//     } catch (error) {
//         console.error('Error downloading CSV:', error);
//         res.status(500).send('Error downloading CSV');
//     }
// });



router.get('/archive-and-send-email', async (req, res) => {
    try {
        const csvData = await archiveAndDeleteOldData();

        if (!csvData) {
            return res.status(404).send('No data to archive');
        }

        await sendEmailWithAttachment(csvData);

        // Delete archived customers only if the email is sent successfully
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
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middlewares/middleware');

router.post('/update-location', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const geo = {
            country: req.headers['x-vercel-ip-country'],
            city: req.headers['x-vercel-ip-city'],
            latitude: req.headers['x-vercel-ip-latitude'],
            longitude: req.headers['x-vercel-ip-longitude']
        };

        const deviceIndex = user.devices.findIndex(device =>
            device.ipAddress === req.deviceInfo.ipAddress &&
            device.deviceBrand === req.deviceInfo.deviceBrand &&
            device.deviceModel === req.deviceInfo.deviceModel
        );

        if (deviceIndex > -1) {
            user.devices[deviceIndex].location = {
                latitude: geo.latitude,
                longitude: geo.longitude,
                city: geo.city,
                country: geo.country
            };
            user.devices[deviceIndex].lastLogin = new Date();
            user.devices[deviceIndex].isActive = true;
        } else {
            user.devices.push({
                ...req.deviceInfo,
                lastLogin: new Date(),
                isActive: true,
                location: {
                    latitude: geo.latitude,
                    longitude: geo.longitude,
                    city: geo.city,
                    country: geo.country
                }
            });
        }

        await user.save();
        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/active-devices', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const activeDevices = user.devices.filter(device => device.isActive);
        res.json(activeDevices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
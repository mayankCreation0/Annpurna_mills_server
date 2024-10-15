const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const UAParser = require('ua-parser-js');

async function login(req, res) {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '7d' });

        // Parse user agent
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

        // Get IP address
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Use Vercel's geolocation data if available
        const geo = req.headers['x-vercel-ip-country'] ? {
            country: req.headers['x-vercel-ip-country'],
            city: req.headers['x-vercel-ip-city'],
            latitude: req.headers['x-vercel-ip-latitude'],
            longitude: req.headers['x-vercel-ip-longitude']
        } : null;

        const deviceInfo = {
            deviceName: `${uaResult.browser.name} on ${uaResult.os.name}`,
            deviceBrand: uaResult.device.vendor || 'Unknown',
            deviceModel: uaResult.device.model || 'Unknown',
            deviceType: uaResult.device.type || 'desktop',
            ipAddress: ip,
            browser: uaResult.browser.name,
            operatingSystem: uaResult.os.name,
            lastLogin: new Date(),
            isActive: true,
            location: geo ? {
                latitude: geo.latitude,
                longitude: geo.longitude,
                city: geo.city,
                country: geo.country
            } : null
        };

        // Update user's devices
        const deviceIndex = user.devices.findIndex(device =>
            device.ipAddress === deviceInfo.ipAddress &&
            device.deviceBrand === deviceInfo.deviceBrand &&
            device.deviceModel === deviceInfo.deviceModel
        );

        if (deviceIndex > -1) {
            user.devices[deviceIndex] = { ...user.devices[deviceIndex], ...deviceInfo };
        } else {
            user.devices.push(deviceInfo);
        }

        await user.save();

        const userData = {
            id: user._id,
            name: user.name,
            username: user.username,
        };

        res.json({
            userData,
            token,
            deviceInfo,
            message: 'Login successful'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
}


async function signup(req, res) {
    const { name, username, password } = req.body;
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, username, password: hashedPassword });
        res.status(201).json({ name, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
}


module.exports = { signup, login };

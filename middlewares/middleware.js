const jwt = require('jsonwebtoken');
const UAParser = require('ua-parser-js');
require('dotenv').config();

const auth = (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (token) {
            token = token.split(" ")[1];
            let user = jwt.verify(token, process.env.SECRET_KEY);
            req.userId = user.userId;

            // Parse user agent
            const parser = new UAParser(req.headers['user-agent']);
            const uaResult = parser.getResult();

            // Get IP address
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // Use Vercel's geolocation headers
            const location = {
                country: req.headers['x-vercel-ip-country'],
                city: req.headers['x-vercel-ip-city'],
                latitude: parseFloat(req.headers['x-vercel-ip-latitude']),
                longitude: parseFloat(req.headers['x-vercel-ip-longitude']),
                region: req.headers['x-vercel-ip-region']
            };

            // Extract device information
            req.deviceInfo = {
                deviceName: `${uaResult.browser.name} on ${uaResult.os.name}`,
                deviceBrand: uaResult.device.vendor || 'Unknown',
                deviceModel: uaResult.device.model || 'Unknown',
                deviceType: uaResult.device.type || 'desktop',
                ipAddress: ip,
                browser: uaResult.browser.name,
                operatingSystem: uaResult.os.name,
                location: location.country ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    city: location.city,
                    country: location.country,
                    region: location.region
                } : null
            };
        } else {
            return res.status(401).json({ message: 'Unauthorized user' });
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Unauthorized user' });
    }
};

module.exports = auth;
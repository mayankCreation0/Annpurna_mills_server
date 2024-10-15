const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    devices: [{
        deviceName: String,
        deviceBrand: String,
        deviceModel: String,
        deviceType: String,
        ipAddress: String,
        browser: String,
        operatingSystem: String,
        lastLogin: Date,
        isActive: { type: Boolean, default: true },
        location: {
            latitude: Number,
            longitude: Number,
            city: String,
            country: String
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
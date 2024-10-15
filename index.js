const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authroutes');
const customerRoutes = require('./routes/customerroutes');
const staffRoutes = require('./routes/Staffroutes');
const staffAttendanceRoutes = require('./routes/staffAttendanceRoutes');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const Redis = require('ioredis');
const deviceRoutes = require('./routes/deviceRoutes');

require("dotenv").config();
if (process.env.NODE_ENV === "test") {
    const result = require("dotenv").config({ path: ".env.test" });

    process.env = {
        ...process.env,
        ...result.parsed,
    };
}

// console.log('MongoDb URI:', process.env.MongoDb); // Log the MongoDB URI to check if it's loaded
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

let redis;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
} else {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    });
}

redis.on('error', (err) => console.log('Redis Client Error', err));

const app = express();
// Make Redis client available to route handlers
app.use((req, res, next) => {
    req.redis = redis;
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
const port = process.env.PORT || 3000;

// Connect to MongoDB
const mongoURI = process.env.MongoDb;

if (!mongoURI) {
    console.error('MongoDB URI not set in environment variables');
    process.exit(1);
}

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit process with failure
    });

// Base route to verify server is live
app.get('/', (req, res) => {
    res.send("Annpurna Mills Server is Live");
});

// Function to fetch metal rates
// const fetchGoldRates = async () => {
//     try {
//         const { data } = await axios.get('https://www.creditmantri.com/gold-rate-kolkata/');
//         const $ = cheerio.load(data);

//         const goldRates = [];

//         $('.gold-card').each((index, element) => {
//             const rate = $(element).find('.txt-bold.font-size').text().trim();
//             goldRates.push(rate);
//         });

//         return goldRates;
//     } catch (error) {
//         console.error('Error fetching gold rates:', error);
//         throw error;
//     }
// };

const fetchGoldRates = async () => {
    try {
        const { data } = await axios.get('https://www.hindustantimes.com/gold-prices');
        const $ = cheerio.load(data);

        const goldRates = {
            '22k': {
                pricePerGram: '',
                priceChangePerGram: '',
                isUp: false
            },
            '24k': {
                pricePerGram: '',
                priceChangePerGram: '',
                isUp: false
            }
        };

        const parseGoldRate = (index) => {
            const goldRateBox = $('.gpBoxHolder .gpBox').eq(index);
            const price = parseFloat(goldRateBox.find('strong').text().trim().replace(/[₹,]/g, ''));
            const priceChange = parseFloat(goldRateBox.find('span').text().trim().replace(/[+,]/g, ''));
            const isUp = goldRateBox.find('span').hasClass('up');

            return {
                pricePerGram: (price / 10).toFixed(2),
                priceChangePerGram: (priceChange / 10).toFixed(2),
                isUp: isUp
            };
        };

        goldRates['22k'] = parseGoldRate(1);
        goldRates['24k'] = parseGoldRate(0);

        return goldRates;
    } catch (error) {
        console.error('Error fetching gold rates:', error);
        throw error;
    }
};
// Function to fetch and parse silver rates
const fetchSilverRates = async () => {
    try {
        const { data } = await axios.get('https://www.goldpriceindia.com/silver-price-india.php');
        const $ = cheerio.load(data);

        let silverRate = $('.prc.align-center.pad-15').first().find('.txt-high').first().text().trim();

        // If no rate is found in txt-high, check txt-low
        if (!silverRate) {
            silverRate = $('.prc.align-center.pad-15').first().find('.txt-low').first().text().trim();
        }
        if (!silverRate) {
            silverRate = $('.prc.align-center.pad-15').first().find('.txt-neutral').first().text().trim();
        }

        return { weight: '1 kg', price: silverRate };
    } catch (error) {
        console.error('Error fetching silver rates:', error);
        throw error;
    }
};

// Route to fetch and return metal rates
app.get('/api/metal-rates', async (req, res) => {
    try {
        const goldRates = await fetchGoldRates();
        const silverRate = await fetchSilverRates();

        res.json([goldRates, silverRate]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching metal rates' });
    }
});

// Other routes
app.use('/', authRoutes);
app.use('/user/device', deviceRoutes);
app.use('/user', customerRoutes);
app.use('/staff', staffRoutes);
app.use('/attendance', staffAttendanceRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
module.exports = app;
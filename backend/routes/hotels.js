const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

// Get all hotels
router.get('/', async (req, res) => {
    try {
        const hotels = await Hotel.find({ status: 'active' });
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create hotel
router.post('/', async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json(hotel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
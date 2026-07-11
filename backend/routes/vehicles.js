const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// Get all vehicles
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'active' });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create vehicle
router.post('/', async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
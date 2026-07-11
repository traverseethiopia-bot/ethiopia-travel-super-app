const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');

// Add to wishlist
router.post('/', async (req, res) => {
    try {
        const { userId, tourId } = req.body;
        
        const existing = await Wishlist.findOne({ userId, tourId });
        if (existing) {
            return res.status(400).json({ error: 'Already in wishlist' });
        }

        const wishlist = new Wishlist({ userId, tourId });
        await wishlist.save();
        res.status(201).json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user wishlist
router.get('/:userId', async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ userId: req.params.userId })
            .populate('tourId');
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from wishlist
router.delete('/:userId/:tourId', async (req, res) => {
    try {
        await Wishlist.findOneAndDelete({
            userId: req.params.userId,
            tourId: req.params.tourId
        });
        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Tour = require('../models/Tour');

// Add review
router.post('/', async (req, res) => {
    try {
        const { tourId, userId, userName, rating, comment } = req.body;

        const review = new Review({
            tourId,
            userId,
            userName,
            rating,
            comment
        });
        await review.save();

        // Update tour rating
        const reviews = await Review.find({ tourId });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Tour.findByIdAndUpdate(tourId, {
            rating: avgRating,
            reviews: reviews.length
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tour reviews
router.get('/tour/:tourId', async (req, res) => {
    try {
        const reviews = await Review.find({ tourId: req.params.tourId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user reviews
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId })
            .populate('tourId')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
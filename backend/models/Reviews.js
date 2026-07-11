const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    tourId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tour', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    userName: { 
        type: String,
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    comment: { 
        type: String,
        default: '' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Review', ReviewSchema);
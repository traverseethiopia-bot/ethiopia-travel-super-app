const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema({
    day: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String,
        default: '📌' 
    }
});

const TourSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    duration: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    category: { 
        type: String, 
        enum: ['historical', 'cultural', 'adventure', 'nature', 'city', 'food'], 
        required: true 
    },
    images: { 
        type: [String], 
        default: [] 
    },
    guide: { 
        type: String, 
        required: true 
    },
    company: { 
        type: String 
    },
    hostId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    itinerary: [ItinerarySchema],
    rating: { 
        type: Number, 
        default: 0 
    },
    reviews: { 
        type: Number, 
        default: 0 
    },
    featured: { 
        type: Boolean, 
        default: false 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Tour', TourSchema);
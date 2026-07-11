const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        default: 0 
    },
    price: { 
        type: Number, 
        required: true 
    },
    amenities: { 
        type: String 
    },
    images: { 
        type: [String], 
        default: [] 
    },
    icon: { 
        type: String, 
        default: '🏨' 
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    hostId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Hotel', HotelSchema);
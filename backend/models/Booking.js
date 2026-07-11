const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
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
    userEmail: { 
        type: String, 
        required: true 
    },
    userPhone: { 
        type: String, 
        required: true 
    },
    date: { 
        type: String, 
        required: true 
    },
    people: { 
        type: Number, 
        required: true, 
        default: 1 
    },
    totalPrice: { 
        type: Number, 
        required: true 
    },
    paymentMethod: { 
        type: String,
        enum: ['telebirr', 'card', 'bank', 'cash'],
        default: 'telebirr'
    },
    receiptImage: { 
        type: String,
        default: '' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'cancelled'], 
        default: 'pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
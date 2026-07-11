const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true 
    },
    plate: { 
        type: String, 
        required: true 
    },
    capacity: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    features: { 
        type: String 
    },
    icon: { 
        type: String, 
        default: '🚙' 
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    company: { 
        type: String 
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

module.exports = mongoose.model('Vehicle', VehicleSchema);
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String 
    },
    profileImage: { 
        type: String,
        default: '' 
    },
    role: { 
        type: String, 
        enum: ['guest', 'host', 'guide', 'admin'], 
        default: 'guest' 
    },
    
    // For Hosts
    companyName: { 
        type: String 
    },
    license: { 
        type: String 
    },
    tin: { 
        type: String 
    },
    licenseDocument: { 
        type: String 
    },
    
    // For Guides
    specialty: { 
        type: String 
    },
    languages: { 
        type: String 
    },
    diploma: { 
        type: String 
    },
    diplomaDocument: { 
        type: String 
    },
    idDocument: { 
        type: String 
    },
    experience: { 
        type: String 
    },
    pricePerHour: { 
        type: Number, 
        default: 50 
    },
    rating: { 
        type: Number, 
        default: 0 
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
    },
    verified: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', UserSchema);
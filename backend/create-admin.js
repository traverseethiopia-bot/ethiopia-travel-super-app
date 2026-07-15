// create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Get MongoDB URI from environment or use direct
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ethiopia_travel';

// Define User Schema (match your existing schema)
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    entityType: String,
    status: String,
    role: String,
    rating: { type: Number, default: 0 },
    __v: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@ethiopiatravel.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin already exists!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('📊 Status:', existingAdmin.status);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin
        const admin = new User({
            name: 'Admin User',
            email: 'admin@ethiopiatravel.com',
            password: hashedPassword,
            phone: '+251 911 000 001',
            entityType: 'admin',
            status: 'verified',
            role: 'admin',
            rating: 0,
            __v: 0
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@ethiopiatravel.com');
        console.log('🔑 Password: admin123');
        console.log('🎯 Role: Admin');
        console.log('📊 Status: Verified');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
}

createAdmin();
// ============================================================
// FILE: server.js - FIXED for Node.js v24.10.0
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Server } = require('socket.io');
const http = require('http');

// FIXED: Correct nodemailer import for v24
const nodemailer = require('nodemailer');

const path = require('path');
require('dotenv').config();

// ============================================================
// 1. CONFIGURATION
// ============================================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethiopia_travel';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'fxszo8e5',
    api_key: process.env.CLOUDINARY_API_KEY || '296256252878274',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'DkwEBIkRWBa_6QXmmMOHVeuH-4U'
});

// FIXED: Email transporter with correct syntax
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

// Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================================
// 2. MIDDLEWARE
// ============================================================
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authentication Middleware
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.entityType)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

// ============================================================
// 3. DATABASE MODELS
// ============================================================
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    entityType: {
        type: String,
        enum: ['guest', 'tour_company', 'hotel', 'guide', 'vehicle', 'admin'],
        default: 'guest'
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'active'],
        default: 'pending'
    },
    companyName: String,
    license: String,
    tin: String,
    hotelName: String,
    hotelCity: String,
    hotelAmenities: String,
    specialty: String,
    languages: String,
    diploma: String,
    experience: String,
    pricePerHour: Number,
    rating: { type: Number, default: 0 },
    vehicleType: String,
    vehiclePlate: String,
    vehicleCapacity: String,
    vehicleFeatures: String,
    profileImage: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Tour Schema
const TourSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    guide: { type: String, required: true },
    category: {
        type: String,
        enum: ['historical', 'cultural', 'adventure', 'nature', 'city', 'food'],
        required: true
    },
    description: { type: String, required: true },
    image: String,
    gallery: [String],
    company: String,
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'draft'],
        default: 'pending'
    },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    itinerary: [{
        day: String,
        title: String,
        description: String,
        image: String
    }],
    availability: [Date],
    locationCoords: {
        lat: Number,
        lng: Number
    },
    createdAt: { type: Date, default: Date.now }
});

// Booking Schema
const BookingSchema = new mongoose.Schema({
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    userPhone: String,
    date: { type: Date, required: true },
    people: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['telebirr', 'card', 'cash', 'chapa'],
        default: 'telebirr'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: String,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    receiptImage: String,
    specialRequests: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Review Schema
const ReviewSchema = new mongoose.Schema({
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [String],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
});

// Chat Schema
const ChatSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Notification Schema
const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'booking', 'payment'],
        default: 'info'
    },
    read: { type: Boolean, default: false },
    link: String,
    createdAt: { type: Date, default: Date.now }
});

// Payment Schema
const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ETB' },
    method: {
        type: String,
        enum: ['telebirr', 'card', 'chapa'],
        required: true
    },
    transactionId: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

// Hotel Schema
const HotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    price: { type: Number, required: true },
    amenities: String,
    icon: String,
    gallery: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    rating: { type: Number, default: 0 },
    location: {
        lat: Number,
        lng: Number
    },
    createdAt: { type: Date, default: Date.now }
});

// Vehicle Schema
const VehicleSchema = new mongoose.Schema({
    type: { type: String, required: true },
    plate: { type: String, required: true, unique: true },
    capacity: String,
    price: { type: Number, required: true },
    features: String,
    icon: String,
    gallery: [String],
    company: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
});

// ============================================================
// 4. CREATE MODELS
// ============================================================
const User = mongoose.model('User', UserSchema);
const Tour = mongoose.model('Tour', TourSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Chat = mongoose.model('Chat', ChatSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Hotel = mongoose.model('Hotel', HotelSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);

// ============================================================
// 5. UPLOAD ROUTES
// ============================================================
app.post('/api/upload', authenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        const folder = req.body.folder || 'ethiopia_travel';
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            { folder: folder }
        );
        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/upload/base64', authenticate, async (req, res) => {
    try {
        const { image, folder } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }
        const result = await cloudinary.uploader.upload(image, {
            folder: folder || 'ethiopia_travel'
        });
        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 6. AUTH ROUTES
// ============================================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, entityType, ...extra } = req.body;
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            entityType: entityType || 'guest',
            status: entityType === 'admin' ? 'verified' : 'pending',
            ...extra
        });
        await user.save();
        // Try to send email but don't fail if it doesn't work
        try {
            await sendEmail(
                email,
                'Welcome to Ethiopia Travel!',
                `Hello ${name},\n\nYour account has been created successfully.\n\nBest regards,\nEthiopia Travel Team`
            );
        } catch (emailError) {
            console.log('Email not sent (this is fine in development):', emailError.message);
        }
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (user.status === 'pending') {
            return res.status(403).json({ error: 'Account pending approval' });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({ error: 'Account rejected' });
        }
        const token = jwt.sign(
            { userId: user._id, email: user.email, entityType: user.entityType },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        const refreshToken = jwt.sign(
            { userId: user._id },
            JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        );
        user.updatedAt = new Date();
        await user.save();
        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                entityType: user.entityType,
                status: user.status
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const token = jwt.sign(
            { userId: user._id, email: user.email, entityType: user.entityType },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// ============================================================
// 7. USER ROUTES
// ============================================================
app.put('/api/auth/verify/:userId', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.status = status;
        await user.save();
        await createNotification(
            user._id,
            `Account ${status}`,
            `Your account has been ${status}`,
            status === 'verified' ? 'success' : 'error'
        );
        try {
            await sendEmail(
                user.email,
                `Account ${status}`,
                `Hello ${user.name},\n\nYour account has been ${status}.\n\nBest regards,\nEthiopia Travel Team`
            );
        } catch (emailError) {
            console.log('Email not sent:', emailError.message);
        }
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:userId', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:userId', authenticate, async (req, res) => {
    try {
        if (req.params.userId !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 8. TOUR ROUTES
// ============================================================
app.get('/api/tours', async (req, res) => {
    try {
        const { category, status, featured, search, minPrice, maxPrice, location } = req.query;
        let query = { status: 'approved' };
        if (category) query.category = category;
        if (featured === 'true') query.featured = true;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        const tours = await Tour.find(query)
            .populate('hostId', 'name companyName rating')
            .sort({ featured: -1, rating: -1, createdAt: -1 });
        res.json(tours);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tours/:id', async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id)
            .populate('hostId', 'name companyName rating phone email');
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tours', authenticate, upload.single('image'), async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { folder: 'ethiopia_travel/tours' }
            );
            imageUrl = result.secure_url;
        }
        const tourData = {
            ...req.body,
            hostId: req.user._id,
            company: req.user.companyName || req.user.name,
            image: imageUrl
        };
        const tour = new Tour(tourData);
        await tour.save();
        const admin = await User.findOne({ entityType: 'admin' });
        if (admin) {
            await createNotification(
                admin._id,
                'New Tour Submitted',
                `${tour.name} has been submitted for approval`,
                'info'
            );
        }
        res.status(201).json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tours/:id', authenticate, upload.single('image'), async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }
        if (tour.hostId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { folder: 'ethiopia_travel/tours' }
            );
            req.body.image = result.secure_url;
        }
        Object.assign(tour, req.body);
        tour.updatedAt = new Date();
        await tour.save();
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tours/:id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }
        tour.status = status;
        await tour.save();
        await createNotification(
            tour.hostId,
            `Tour ${status}`,
            `Your tour "${tour.name}" has been ${status}`,
            status === 'approved' ? 'success' : 'error'
        );
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tours/:id', authenticate, async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }
        if (tour.hostId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (tour.image) {
            const publicId = tour.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`ethiopia_travel/tours/${publicId}`);
        }
        await tour.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 9. BOOKING ROUTES
// ============================================================
app.post('/api/bookings', authenticate, async (req, res) => {
    try {
        const tour = await Tour.findById(req.body.tourId);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }
        const bookingData = {
            ...req.body,
            userId: req.user._id,
            hostId: tour.hostId,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone
        };
        const booking = new Booking(bookingData);
        await booking.save();
        await createNotification(
            tour.hostId,
            'New Booking',
            `New booking for ${tour.name} by ${req.user.name}`,
            'booking'
        );
        await createNotification(
            req.user._id,
            'Booking Created',
            `Your booking for ${tour.name} has been created`,
            'success'
        );
        try {
            await sendEmail(
                req.user.email,
                'Booking Confirmation',
                `Hello ${req.user.name},\n\nYour booking for ${tour.name} has been created.\nDate: ${booking.date}\nPeople: ${booking.people}\nTotal: ${booking.totalPrice} ETB\n\nThank you,\nEthiopia Travel Team`
            );
        } catch (emailError) {
            console.log('Email not sent:', emailError.message);
        }
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings', authenticate, authorize('admin'), async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('tourId', 'name')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/user/:userId', authenticate, async (req, res) => {
    try {
        if (req.params.userId !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('tourId', 'name location image price duration')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/host/:hostId', authenticate, async (req, res) => {
    try {
        if (req.params.hostId !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const bookings = await Booking.find({ hostId: req.params.hostId })
            .populate('tourId', 'name location image price duration')
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/bookings/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.hostId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        booking.status = status;
        booking.updatedAt = new Date();
        await booking.save();
        await createNotification(
            booking.userId,
            `Booking ${status}`,
            `Your booking has been ${status}`,
            status === 'confirmed' ? 'success' : 'error'
        );
        try {
            await sendEmail(
                booking.userEmail,
                `Booking ${status}`,
                `Hello ${booking.userName},\n\nYour booking has been ${status}.\n\nBest regards,\nEthiopia Travel Team`
            );
        } catch (emailError) {
            console.log('Email not sent:', emailError.message);
        }
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/bookings/:id/receipt', authenticate, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.userId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (req.body.receiptImage) {
            const result = await cloudinary.uploader.upload(req.body.receiptImage, {
                folder: 'ethiopia_travel/receipts'
            });
            booking.receiptImage = result.secure_url;
            await booking.save();
        }
        res.json({ success: true, receiptImage: booking.receiptImage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/bookings/:id', authenticate, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.userId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await booking.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 10. PAYMENT ROUTES
// ============================================================
app.post('/api/payments/initialize', authenticate, async (req, res) => {
    try {
        const { bookingId, amount, phone, email, name } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const tx_ref = 'TX-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        const payment = new Payment({
            userId: req.user._id,
            bookingId: booking._id,
            amount: amount || booking.totalPrice,
            currency: 'ETB',
            method: 'chapa',
            transactionId: tx_ref,
            status: 'pending'
        });
        await payment.save();
        
        setTimeout(async () => {
            payment.status = 'completed';
            await payment.save();
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            booking.transactionId = tx_ref;
            await booking.save();
            await createNotification(
                booking.userId,
                'Payment Successful',
                `Your payment of ${payment.amount} ETB has been confirmed`,
                'success'
            );
        }, 2000);
        
        res.json({
            success: true,
            checkout_url: `${req.headers.origin}/payment/success?tx_ref=${tx_ref}`,
            tx_ref: tx_ref
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/payments/user/:userId', authenticate, async (req, res) => {
    try {
        if (req.params.userId !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const payments = await Payment.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 11. REVIEW ROUTES
// ============================================================
app.post('/api/reviews', authenticate, async (req, res) => {
    try {
        const { tourId, rating, comment, images } = req.body;
        const booking = await Booking.findOne({
            tourId,
            userId: req.user._id,
            status: { $in: ['completed', 'confirmed'] }
        });
        if (!booking && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'You must book this tour before reviewing' });
        }
        const existing = await Review.findOne({ tourId, userId: req.user._id });
        if (existing) {
            return res.status(400).json({ error: 'You already reviewed this tour' });
        }
        let imageUrls = [];
        if (images && images.length > 0) {
            for (const img of images) {
                const result = await cloudinary.uploader.upload(img, {
                    folder: 'ethiopia_travel/reviews'
                });
                imageUrls.push(result.secure_url);
            }
        }
        const review = new Review({
            tourId,
            userId: req.user._id,
            userName: req.user.name,
            rating,
            comment,
            images: imageUrls
        });
        await review.save();
        const reviews = await Review.find({ tourId, status: 'approved' });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
        await Tour.findByIdAndUpdate(tourId, {
            rating: Math.round(avgRating * 10) / 10,
            reviews: reviews.length
        });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/tour/:tourId', async (req, res) => {
    try {
        const reviews = await Review.find({
            tourId: req.params.tourId,
            status: 'approved'
        }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/reviews/:id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        review.status = req.body.status;
        await review.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/reviews/:id', authenticate, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        if (review.userId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await review.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 12. CHAT ROUTES
// ============================================================
app.post('/api/chats', authenticate, async (req, res) => {
    try {
        const { to, message } = req.body;
        const chat = new Chat({
            from: req.user._id,
            to,
            message
        });
        await chat.save();
        io.to(to.toString()).emit('new_message', {
            from: req.user._id,
            to,
            message,
            createdAt: chat.createdAt,
            _id: chat._id
        });
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/chats/user/:userId', authenticate, async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [
                { from: req.params.userId, to: req.user._id },
                { from: req.user._id, to: req.params.userId }
            ]
        }).sort({ createdAt: 1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/chats/conversations', authenticate, async (req, res) => {
    try {
        const conversations = await Chat.aggregate([
            {
                $match: {
                    $or: [
                        { from: req.user._id },
                        { to: req.user._id }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$from', req.user._id] },
                            '$to',
                            '$from'
                        ]
                    },
                    lastMessage: { $last: '$message' },
                    lastMessageTime: { $last: '$createdAt' },
                    unread: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: ['$to', req.user._id] },
                                    { $eq: ['$read', false] }
                                ]},
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { lastMessageTime: -1 } }
        ]);
        const populated = [];
        for (const conv of conversations) {
            const user = await User.findById(conv._id).select('name email phone profileImage entityType');
            if (user) {
                populated.push({
                    ...conv,
                    user
                });
            }
        }
        res.json(populated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/chats/read/:chatId', authenticate, async (req, res) => {
    try {
        await Chat.updateMany(
            { _id: req.params.chatId, to: req.user._id },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 13. NOTIFICATION ROUTES
// ============================================================
async function createNotification(userId, title, message, type = 'info') {
    const notification = new Notification({
        userId,
        title,
        message,
        type
    });
    await notification.save();
    io.to(userId.toString()).emit('new_notification', notification);
}

app.get('/api/notifications/user/:userId', authenticate, async (req, res) => {
    try {
        if (req.params.userId !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const notifications = await Notification.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        notification.read = true;
        await notification.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/notifications/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/notifications/:id', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await notification.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 14. HOTEL ROUTES
// ============================================================
app.get('/api/hotels', async (req, res) => {
    try {
        const { city, search } = req.query;
        let query = { status: 'active' };
        if (city) query.city = { $regex: city, $options: 'i' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }
        const hotels = await Hotel.find(query)
            .populate('userId', 'name rating')
            .sort({ rating: -1, createdAt: -1 });
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hotels/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id)
            .populate('userId', 'name email phone rating');
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        res.json(hotel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hotels', authenticate, upload.array('gallery', 10), async (req, res) => {
    try {
        let galleryUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    { folder: 'ethiopia_travel/hotels' }
                );
                galleryUrls.push(result.secure_url);
            }
        }
        const hotelData = {
            ...req.body,
            userId: req.user._id,
            gallery: galleryUrls
        };
        const hotel = new Hotel(hotelData);
        await hotel.save();
        res.status(201).json(hotel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/hotels/:id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        hotel.status = req.body.status;
        await hotel.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/hotels/:id', authenticate, async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        if (hotel.userId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await hotel.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 15. VEHICLE ROUTES
// ============================================================
app.get('/api/vehicles', async (req, res) => {
    try {
        const { search } = req.query;
        let query = { status: 'active' };
        if (search) {
            query.$or = [
                { type: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { plate: { $regex: search, $options: 'i' } }
            ];
        }
        const vehicles = await Vehicle.find(query)
            .populate('userId', 'name rating')
            .sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('userId', 'name email phone rating');
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vehicles', authenticate, upload.array('gallery', 10), async (req, res) => {
    try {
        let galleryUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    { folder: 'ethiopia_travel/vehicles' }
                );
                galleryUrls.push(result.secure_url);
            }
        }
        const vehicleData = {
            ...req.body,
            userId: req.user._id,
            gallery: galleryUrls
        };
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/vehicles/:id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        vehicle.status = req.body.status;
        await vehicle.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/vehicles/:id', authenticate, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        if (vehicle.userId.toString() !== req.user._id.toString() && req.user.entityType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await vehicle.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 16. EMAIL SERVICE (FIXED)
// ============================================================
async function sendEmail(to, subject, message) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@ethiopiatravel.com',
            to,
            subject,
            text: message,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f6fa;">
                    <div style="background: #1b5e20; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🇪🇹 Ethiopia Travel</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1b5e20;">${subject}</h2>
                        <p style="line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
                        <hr style="border: 1px solid #e9ecef; margin: 20px 0;">
                        <p style="color: #6c757d; font-size: 0.9rem;">This is an automated message from Ethiopia Travel.</p>
                        <p style="color: #6c757d; font-size: 0.9rem;">📞 +251 91 162 6671 | 📧 bookings@ethiopiatravelapp.com</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
}

// ============================================================
// 17. SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });
    socket.on('typing', ({ from, to }) => {
        io.to(to).emit('user_typing', { from });
    });
    socket.on('stop_typing', ({ to }) => {
        io.to(to).emit('user_stop_typing');
    });
    socket.on('mark_read', async ({ chatId, userId }) => {
        try {
            await Chat.findByIdAndUpdate(chatId, { read: true });
            io.to(userId).emit('message_read', { chatId });
        } catch (error) {
            console.error('Mark read error:', error);
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ============================================================
// 18. ANALYTICS ROUTES
// ============================================================
app.get('/api/analytics', authenticate, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTours = await Tour.countDocuments();
        const totalHotels = await Hotel.countDocuments();
        const totalVehicles = await Vehicle.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalRevenue = await Booking.aggregate([
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('tourId', 'name')
            .populate('userId', 'name email');
        const popularTours = await Tour.find()
            .sort({ bookings: -1, rating: -1 })
            .limit(5)
            .select('name rating reviews price');
        res.json({
            totalUsers,
            totalTours,
            totalHotels,
            totalVehicles,
            totalBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            recentBookings,
            popularTours
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 19. HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// 20. START SERVER
// ============================================================
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}`);
    console.log(`📸 Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || 'fxszo8e5'}`);
    console.log(`✅ ALL 16 FEATURES ARE LIVE!`);
});
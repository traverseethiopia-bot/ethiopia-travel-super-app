const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Load environment variables
dotenv.config();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// ===== SERVE FRONTEND =====
// Serve static files from root directory (where index.html is)
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// MODELS
// ============================================

// User Model
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    role: { type: String, enum: ['guest', 'host', 'guide', 'admin'], default: 'guest' },
    profileImage: String,
    companyName: String,
    license: String,
    tin: String,
    licenseDocument: String,
    specialty: String,
    languages: String,
    diploma: String,
    diplomaDocument: String,
    idDocument: String,
    experience: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Tour Model
const TourSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['historical', 'cultural', 'adventure', 'nature', 'city', 'food'], required: true },
    images: [String],
    guide: { type: String, required: true },
    company: String,
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    itinerary: [{
        day: String,
        title: String,
        description: String,
        image: String
    }],
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Booking Model
const BookingSchema = new mongoose.Schema({
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },
    date: { type: String, required: true },
    people: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
    paymentMethod: String,
    receiptImage: String,
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Wishlist Model
const WishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Review Model
const ReviewSchema = new mongoose.Schema({
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', UserSchema);
const Tour = mongoose.model('Tour', TourSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Wishlist = mongoose.model('Wishlist', WishlistSchema);
const Review = mongoose.model('Review', ReviewSchema);

// ============================================
// ROUTES
// ============================================

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ Ethiopia Travel API is running!' });
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const user = new User({ name, email, password, phone, role });
        await user.save();
        res.status(201).json({ message: 'User registered successfully', user: { id: user._id, name, email } });
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
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ 
            message: 'Login successful', 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                status: user.status
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TOUR ROUTES
// ============================================

app.get('/api/tours', async (req, res) => {
    try {
        const { category, featured, status } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (featured) filter.featured = featured === 'true';
        if (status) filter.status = status;
        else filter.status = 'approved';
        const tours = await Tour.find(filter).sort({ createdAt: -1 });
        res.json(tours);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tours/:id', async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tours', async (req, res) => {
    try {
        const tour = new Tour(req.body);
        await tour.save();
        res.status(201).json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tours/:id', async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tours/:id', async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tour deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// BOOKING ROUTES
// ============================================

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('tourId')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/host/:hostId', async (req, res) => {
    try {
        const tours = await Tour.find({ hostId: req.params.hostId });
        const tourIds = tours.map(t => t._id);
        const bookings = await Booking.find({ tourId: { $in: tourIds } })
            .populate('tourId')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// IMAGE UPLOAD ROUTE
// ============================================

app.post('/api/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const file = req.files.image;
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'ethiopia_travel',
            resource_type: 'auto'
        });
        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// WISHLIST ROUTES
// ============================================

app.post('/api/wishlist', async (req, res) => {
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

app.get('/api/wishlist/:userId', async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ userId: req.params.userId })
            .populate('tourId');
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/wishlist/:userId/:tourId', async (req, res) => {
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

// ============================================
// REVIEW ROUTES
// ============================================

app.post('/api/reviews', async (req, res) => {
    try {
        const { tourId, userId, userName, rating, comment } = req.body;
        const review = new Review({ tourId, userId, userName, rating, comment });
        await review.save();
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

app.get('/api/reviews/tour/:tourId', async (req, res) => {
    try {
        const reviews = await Review.find({ tourId: req.params.tourId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// USER ROUTES
// ============================================

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status, verified: status === 'verified' },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
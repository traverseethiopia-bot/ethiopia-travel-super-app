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
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}));

// Serve Frontend
app.use(express.static(path.join(__dirname, '..')));
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
    profileImage: String,
    role: { type: String, enum: ['guest', 'host', 'guide', 'admin'], default: 'guest' },
    
    // Host specific
    companyName: String,
    license: String,
    tin: String,
    licenseDocument: String,
    
    // Guide specific
    specialty: String,
    languages: String,
    diploma: String,
    diplomaDocument: String,
    idDocument: String,
    faceImage: String,
    experience: String,
    pricePerHour: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    
    // Status
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Tour Model
const ItinerarySchema = new mongoose.Schema({
    day: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    imageUrl: { type: String, default: '' }
});

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
    itinerary: [ItinerarySchema],
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
    paymentMethod: { type: String, enum: ['telebirr', 'card', 'bank', 'cash'], default: 'telebirr' },
    receiptImage: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Hotel Model
const HotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    rating: { type: Number, default: 0 },
    price: { type: Number, required: true },
    amenities: String,
    images: [String],
    icon: { type: String, default: '🏨' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// Vehicle Model
const VehicleSchema = new mongoose.Schema({
    type: { type: String, required: true },
    plate: { type: String, required: true },
    capacity: { type: String, required: true },
    price: { type: Number, required: true },
    features: String,
    icon: { type: String, default: '🚙' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    company: String,
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
const Hotel = mongoose.model('Hotel', HotelSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const Wishlist = mongoose.model('Wishlist', WishlistSchema);
const Review = mongoose.model('Review', ReviewSchema);

// ============================================
// TEST ROUTE
// ============================================

app.get('/api/test', (req, res) => {
    res.json({ message: '✅ Ethiopia Travel API is running!' });
});

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, companyName, license, tin, specialty, languages, diploma, experience, pricePerHour } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const userData = { name, email, password, phone, role: role || 'guest' };
        
        if (role === 'host') {
            userData.companyName = companyName;
            userData.license = license;
            userData.tin = tin;
            userData.status = 'pending';
        }
        
        if (role === 'guide') {
            userData.specialty = specialty;
            userData.languages = languages;
            userData.diploma = diploma;
            userData.experience = experience;
            userData.pricePerHour = pricePerHour || 0;
            userData.status = 'pending';
        }

        const user = new User(userData);
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name, email, role: user.role, status: user.status }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
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
                status: user.status,
                companyName: user.companyName,
                specialty: user.specialty
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending users (admin)
app.get('/api/auth/pending', async (req, res) => {
    try {
        const users = await User.find({ status: 'pending' }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify user (admin)
app.put('/api/auth/verify/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status, verified: status === 'verified' },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users (admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by id
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TOUR ROUTES
// ============================================

// Get all tours
app.get('/api/tours', async (req, res) => {
    try {
        const { category, featured, status, hostId } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (featured) filter.featured = featured === 'true';
        if (status) filter.status = status;
        else filter.status = 'approved';
        if (hostId) filter.hostId = hostId;
        const tours = await Tour.find(filter).sort({ createdAt: -1 });
        res.json(tours);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single tour
app.get('/api/tours/:id', async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) return res.status(404).json({ error: 'Tour not found' });
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create tour
app.post('/api/tours', async (req, res) => {
    try {
        const tour = new Tour(req.body);
        await tour.save();
        res.status(201).json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update tour
app.put('/api/tours/:id', async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete tour
app.delete('/api/tours/:id', async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tour deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tours by host
app.get('/api/tours/host/:hostId', async (req, res) => {
    try {
        const tours = await Tour.find({ hostId: req.params.hostId });
        res.json(tours);
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

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('tourId')
            .populate('userId')
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

app.put('/api/bookings/:id/receipt', async (req, res) => {
    try {
        const { receiptImage } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { receiptImage, status: 'confirmed' },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HOTEL ROUTES
// ============================================

app.get('/api/hotels', async (req, res) => {
    try {
        const hotels = await Hotel.find({ status: 'active' });
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hotels', async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json(hotel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// VEHICLE ROUTES
// ============================================

app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'active' });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vehicles', async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (error) {
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
// IMAGE UPLOAD ROUTE
// ============================================

app.post('/api/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const file = req.files.image;
        const folder = req.body.folder || 'ethiopia_travel';

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: folder,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
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
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
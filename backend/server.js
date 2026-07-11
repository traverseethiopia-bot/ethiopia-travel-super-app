const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const path = require('path');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================
// MONGODB CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// ============================================
// MODELS
// ============================================
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    role: { type: String, enum: ['guest', 'host', 'guide', 'admin'], default: 'guest' },
    companyName: String,
    license: String,
    tin: String,
    licenseDocument: String,
    specialty: String,
    languages: String,
    diploma: String,
    diplomaDocument: String,
    idDocument: String,
    faceImage: String,
    experience: String,
    pricePerHour: Number,
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const ItinerarySchema = new mongoose.Schema({
    day: String,
    title: String,
    description: String,
    image: String,
    imageUrl: String
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

const BookingSchema = new mongoose.Schema({
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    userEmail: String,
    userPhone: String,
    date: String,
    people: Number,
    totalPrice: Number,
    paymentMethod: String,
    receiptImage: String,
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const HotelSchema = new mongoose.Schema({
    name: String,
    city: String,
    rating: Number,
    price: Number,
    amenities: String,
    icon: { type: String, default: '🏨' },
    status: { type: String, default: 'active' }
});

const VehicleSchema = new mongoose.Schema({
    type: String,
    plate: String,
    capacity: String,
    price: Number,
    features: String,
    icon: { type: String, default: '🚙' },
    company: String,
    status: { type: String, default: 'active' }
});

const User = mongoose.model('User', UserSchema);
const Tour = mongoose.model('Tour', TourSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Hotel = mongoose.model('Hotel', HotelSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);

// ============================================
// SEED DATA
// ============================================
async function seedData() {
    // Check if data exists
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('🌱 Seeding initial data...');

    // Create Admin
    const admin = new User({
        name: 'Administrator',
        email: 'admin@ethiopiatravel.com',
        password: '1111',
        role: 'admin',
        status: 'verified',
        verified: true
    });
    await admin.save();

    // Create Hosts
    const hosts = [
        { name: 'Traverse Ethiopia Tour', email: 'traverse@ethiopiatravel.com', password: 'traverse123', companyName: 'Traverse Ethiopia Tour', license: 'ET-TOUR-001', tin: '1234567890', status: 'verified', verified: true },
        { name: 'Kidicho Ethiopia Tour', email: 'kidicho@ethiopiatravel.com', password: 'kidicho123', companyName: 'Kidicho Ethiopia Tour', license: 'ET-TOUR-002', tin: '0987654321', status: 'verified', verified: true },
        { name: 'Ethio Travel & Tours', email: 'ethiotravel@ethiopiatravel.com', password: 'ethio123', companyName: 'Ethio Travel & Tours', license: 'ET-TOUR-003', tin: '1122334455', status: 'verified', verified: true }
    ];

    const hostUsers = [];
    for (const h of hosts) {
        const user = new User({ ...h, role: 'host' });
        await user.save();
        hostUsers.push(user);
    }

    // Create Guides
    const guides = [
        { name: 'Kurabachew Endeshaw', email: 'kurabachew@guides.com', password: 'guide123', specialty: 'Historical Sites, Northern Route', languages: 'English, Amharic, Oromo', diploma: 'BA in History', experience: '10 years', pricePerHour: 65, status: 'verified', verified: true },
        { name: 'Gelagil Milion', email: 'gelagil@guides.com', password: 'guide123', specialty: 'Omo Valley Tribes', languages: 'English, Amharic', diploma: 'BA in Anthropology', experience: '8 years', pricePerHour: 70, status: 'verified', verified: true },
        { name: 'Kidest', email: 'kidest@guides.com', password: 'guide123', specialty: 'City Tours, Shopping', languages: 'English, Amharic', diploma: 'BA in Tourism', experience: '6 years', pricePerHour: 55, status: 'verified', verified: true },
        { name: 'Tigist Worku', email: 'tigist@guides.com', password: 'guide123', specialty: 'Bird Watching, Nature', languages: 'English, Amharic, Oromo', diploma: 'BSc in Biology', experience: '7 years', pricePerHour: 60, status: 'verified', verified: true },
        { name: 'Dawit Solomon', email: 'dawit@guides.com', password: 'guide123', specialty: 'Adventure Tours, Trekking', languages: 'English, Amharic', diploma: 'BSc in Geography', experience: '5 years', pricePerHour: 75, status: 'verified', verified: true }
    ];

    for (const g of guides) {
        const user = new User({ ...g, role: 'guide' });
        await user.save();
    }

    // Create Hotels
    const hotels = [
        { name: 'Sheraton Addis', city: 'Addis Ababa', rating: 4.8, price: 250, amenities: 'Pool, Spa, 5 Restaurants, Gym' },
        { name: 'Kuriftu Resort', city: 'Bahir Dar', rating: 4.5, price: 180, amenities: 'Pool, Lake View, Spa' },
        { name: 'Haile Resort', city: 'Jimma', rating: 4.6, price: 120, amenities: 'Pool, Coffee Plantation Tour' },
        { name: 'Marriott Executive', city: 'Addis Ababa', rating: 4.7, price: 280, amenities: 'Full Kitchen, Gym, Business Center' },
        { name: 'Gondar Hills Resort', city: 'Gondar', rating: 4.4, price: 150, amenities: 'Mountain View, Pool' },
        { name: 'Axum Hotel', city: 'Axum', rating: 4.3, price: 100, amenities: 'Historical View, Restaurant' },
        { name: 'Lalibela Lodge', city: 'Lalibela', rating: 4.6, price: 160, amenities: 'Church View, Garden' },
        { name: 'Danakil Camp', city: 'Danakil', rating: 4.2, price: 90, amenities: 'Desert Experience' },
        { name: 'Jinka Resort', city: 'Jinka', rating: 4.4, price: 110, amenities: 'Cultural Tours, Pool' },
        { name: 'Bale Mountain Lodge', city: 'Bale', rating: 4.7, price: 140, amenities: 'Nature View, Hiking' }
    ];

    for (const h of hotels) {
        const hotel = new Hotel(h);
        await hotel.save();
    }

    // Create Vehicles
    const vehicles = [
        { type: 'Toyota Land Cruiser V8', plate: 'AA-12345', capacity: '7 passengers', price: 120, features: '4WD, AC, Roof Rack', company: 'Traverse Ethiopia Tour' },
        { type: 'Toyota Coaster Bus', plate: 'AA-11111', capacity: '25 passengers', price: 150, features: 'AC, TV, Reclining Seats', company: 'Traverse Ethiopia Tour' },
        { type: 'Safari Jeep', plate: 'AA-33333', capacity: '6 passengers', price: 140, features: '4WD, AC, Sunroof', company: 'Kidicho Ethiopia Tour' },
        { type: 'Toyota Hiace Van', plate: 'AA-44444', capacity: '14 passengers', price: 100, features: 'AC, Comfortable Seats', company: 'Ethio Travel & Tours' },
        { type: 'Mitsubishi Pajero', plate: 'AA-55555', capacity: '5 passengers', price: 110, features: '4WD, Off-road Ready', company: 'Traverse Ethiopia Tour' },
        { type: 'Mercedes Sprinter', plate: 'AA-66666', capacity: '20 passengers', price: 130, features: 'Luxury, AC, Entertainment', company: 'Kidicho Ethiopia Tour' }
    ];

    for (const v of vehicles) {
        const vehicle = new Vehicle(v);
        await vehicle.save();
    }

    // Create Tours with Itineraries
    const tourData = [
        {
            name: 'Northern Historic Route - 10 Days',
            description: 'Explore the ancient wonders of Ethiopia! Visit the rock-hewn churches of Lalibela, the castles of Gondar, the obelisks of Axum, and the monasteries of Lake Tana.',
            location: 'Lalibela, Gondar, Axum, Bahir Dar',
            duration: '10 Days',
            price: 1850,
            category: 'historical',
            guide: 'Kurabachew Endeshaw',
            company: 'Traverse Ethiopia Tour',
            hostId: hostUsers[0]._id,
            featured: true,
            status: 'approved',
            itinerary: [
                { day: 'Day 1', title: 'Arrival in Addis Ababa', description: 'Welcome to Ethiopia! City tour including National Museum, Merkato, and Entoto Mountain.', image: '🏙️' },
                { day: 'Day 2', title: 'Fly to Bahir Dar', description: 'Morning flight to Bahir Dar. Visit Lake Tana monasteries and the Blue Nile Falls.', image: '🏖️' },
                { day: 'Day 3', title: 'Drive to Gondar', description: 'Drive to Gondar. Visit the Royal Enclosure, Debre Berhan Selassie Church.', image: '🏰' },
                { day: 'Day 4', title: 'Gondar to Axum', description: 'Drive to Axum. Visit the Stelae Field, Church of Our Lady Mary of Zion.', image: '🗿' },
                { day: 'Day 5', title: 'Axum Exploration', description: 'Continue exploring Axum. Visit the Palace of the Queen of Sheba.', image: '🗿' },
                { day: 'Day 6', title: 'Axum to Lalibela', description: 'Fly to Lalibela. Afternoon visit to the famous rock-hewn churches.', image: '⛪' },
                { day: 'Day 7', title: 'Lalibela Churches', description: 'Full day exploring the 11 rock-hewn churches of Lalibela.', image: '⛪' },
                { day: 'Day 8', title: 'Lalibela Mountains', description: 'Hike to Asheton Maryam Monastery for panoramic views.', image: '🏔️' },
                { day: 'Day 9', title: 'Lalibela to Addis', description: 'Fly back to Addis Ababa. Afternoon shopping and coffee ceremony.', image: '☕' },
                { day: 'Day 10', title: 'Departure', description: 'Transfer to the airport for your departure flight.', image: '✈️' }
            ]
        },
        {
            name: 'Omo Valley Cultural Expedition - 10 Days',
            description: 'Experience the incredible cultural diversity of Ethiopia\'s Omo Valley. Visit 9 different indigenous tribes.',
            location: 'Jinka, Turmi, Key Afer, Omo River',
            duration: '10 Days',
            price: 2250,
            category: 'cultural',
            guide: 'Gelagil Milion',
            company: 'Traverse Ethiopia Tour',
            hostId: hostUsers[0]._id,
            featured: true,
            status: 'approved',
            itinerary: [
                { day: 'Day 1', title: 'Arrival Addis - Fly to Jinka', description: 'Morning flight to Jinka. Visit the Jinka Museum.', image: '🛖' },
                { day: 'Day 2', title: 'Jinka - Mago National Park', description: 'Visit Mago National Park. See the Mursi tribe.', image: '🛖' },
                { day: 'Day 3', title: 'Jinka to Turmi', description: 'Drive to Turmi. Visit the Hamer tribe.', image: '🏜️' },
                { day: 'Day 4', title: 'Turmi - Hamer Village', description: 'Full day with the Hamer tribe.', image: '🛖' },
                { day: 'Day 5', title: 'Turmi - Bull Jumping Ceremony', description: 'Attend a Bull Jumping ceremony. Visit the Karo tribe.', image: '🐂' },
                { day: 'Day 6', title: 'Turmi to Key Afer', description: 'Drive to Key Afer. Visit the Benna and Tsemay tribes.', image: '🏜️' },
                { day: 'Day 7', title: 'Key Afer - Omo River', description: 'Boat trip on the Omo River. Visit the Dassanech tribe.', image: '🌊' },
                { day: 'Day 8', title: 'Key Afer to Konso', description: 'Drive to Konso. Visit the UNESCO site of Konso Village.', image: '🏛️' },
                { day: 'Day 9', title: 'Konso to Jinka', description: 'Return to Jinka. Visit the Doge village.', image: '🏙️' },
                { day: 'Day 10', title: 'Fly Back to Addis', description: 'Morning flight back to Addis Ababa.', image: '✈️' }
            ]
        },
        {
            name: 'Danakil Depression Adventure - 5 Days',
            description: 'Journey to the hottest place on Earth! Visit Erta Ale volcano with its active lava lake.',
            location: 'Danakil Depression, Erta Ale, Dallol',
            duration: '5 Days',
            price: 850,
            category: 'adventure',
            guide: 'Dawit Solomon',
            company: 'Ethio Travel & Tours',
            hostId: hostUsers[2]._id,
            featured: false,
            status: 'approved',
            itinerary: [
                { day: 'Day 1', title: 'Addis to Semera', description: 'Drive to Semera. Visit the Awash River.', image: '🏜️' },
                { day: 'Day 2', title: 'Semera to Erta Ale', description: 'Drive to Erta Ale. Trek to the volcano for sunset and lava viewing.', image: '🌋' },
                { day: 'Day 3', title: 'Erta Ale to Dallol', description: 'Sunrise trek down. Drive to Dallol through the salt flats.', image: '🏜️' },
                { day: 'Day 4', title: 'Dallol Excursion', description: 'Visit the colorful sulfur springs, salt mines.', image: '🌈' },
                { day: 'Day 5', title: 'Return to Addis', description: 'Drive back to Addis Ababa.', image: '✈️' }
            ]
        }
    ];

    for (const t of tourData) {
        const tour = new Tour(t);
        await tour.save();
    }

    console.log('✅ Seed data complete!');
}

// ============================================
// API ROUTES
// ============================================

// Test Route
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
        
        const existing = await User.findOne({ email });
        if (existing) {
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

// ============================================
// USER ROUTES
// ============================================

// Get all users (admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
app.get('/api/users/me/:id', async (req, res) => {
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

// Create tour (host/guide)
app.post('/api/tours', async (req, res) => {
    try {
        const tour = new Tour(req.body);
        await tour.save();
        res.status(201).json(tour);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update tour status (admin)
app.put('/api/tours/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const tour = await Tour.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
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

// Create booking
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user bookings
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

// Get host bookings
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

// Get all bookings (admin)
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

// Update booking status
app.put('/api/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload receipt
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

// ============================================
// IMAGE UPLOAD
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
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await seedData();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server start error:', error);
    }
}

startServer();
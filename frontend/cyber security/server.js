// server.js - Main server file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Contact form specific rate limiting
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact form submissions per hour
    message: 'Too many contact form submissions, please try again later.'
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberguard', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Models
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    ipAddress: String,
    userAgent: String,
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['admin', 'analyst', 'client'],
        default: 'client'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const serviceRequestSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true,
        trim: true
    },
    clientEmail: {
        type: String,
        required: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['penetration-testing', 'vulnerability-assessment', 'security-audit', 'incident-response', 'security-training', 'threat-intelligence']
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    targetSystems: String,
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    budget: {
        type: String,
        enum: ['under-5k', '5k-15k', '15k-50k', '50k-plus', 'custom']
    },
    status: {
        type: String,
        enum: ['submitted', 'reviewing', 'approved', 'in-progress', 'completed', 'cancelled'],
        default: 'submitted'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Contact = mongoose.model('Contact', contactSchema);
const User = mongoose.model('User', userSchema);
const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

// Email configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'cyberguard-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware for admin authentication
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Contact form submission
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
        }

        // Create contact record
        const contact = new Contact({
            name,
            email,
            message,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await contact.save();

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || 'admin@cyberguard.com',
            subject: `New Contact Form Submission - ${name}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <p><strong>IP Address:</strong> ${req.ip}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Send confirmation email to client
        const confirmationMail = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'CyberGuard - Message Received',
            html: `
                <h2>Message Transmission Confirmed</h2>
                <p>Hello ${name},</p>
                <p>Your secure message has been received by our elite cybersecurity team.</p>
                <p>Our analysts will review your request and establish contact within 24 hours.</p>
                <p><strong>Reference ID:</strong> ${contact._id}</p>
                <br>
                <p>Best regards,<br>CyberGuard Security Operations</p>
            `
        };

        await transporter.sendMail(confirmationMail);

        res.status(201).json({
            success: true,
            message: 'MESSAGE TRANSMITTED SUCCESSFULLY',
            referenceId: contact._id
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Service request submission
app.post('/api/service-request', contactLimiter, async (req, res) => {
    try {
        const {
            clientName,
            clientEmail,
            serviceType,
            description,
            targetSystems,
            urgency,
            budget
        } = req.body;

        // Validation
        if (!clientName || !clientEmail || !serviceType || !description) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const serviceRequest = new ServiceRequest({
            clientName,
            clientEmail,
            serviceType,
            description,
            targetSystems,
            urgency,
            budget
        });

        await serviceRequest.save();

        // Send notification email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || 'admin@cyberguard.com',
            subject: `New Service Request - ${serviceType.toUpperCase()}`,
            html: `
                <h2>New Service Request</h2>
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Email:</strong> ${clientEmail}</p>
                <p><strong>Service:</strong> ${serviceType}</p>
                <p><strong>Urgency:</strong> ${urgency}</p>
                <p><strong>Budget:</strong> ${budget}</p>
                <p><strong>Description:</strong></p>
                <p>${description}</p>
                <p><strong>Target Systems:</strong> ${targetSystems || 'Not specified'}</p>
                <p><strong>Request ID:</strong> ${serviceRequest._id}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            success: true,
            message: 'Service request submitted successfully',
            requestId: serviceRequest._id
        });

    } catch (error) {
        console.error('Service request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: user._id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'cyberguard-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all contacts (admin only)
app.get('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contacts = await Contact.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Contact.countDocuments();

        res.json({
            contacts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all service requests (admin only)
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const requests = await ServiceRequest.find()
            .populate('assignedTo', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ServiceRequest.countDocuments();

        res.json({
            requests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get service requests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update service request status
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, assignedTo } = req.body;
        
        const request = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            { status, assignedTo },
            { new: true }
        ).populate('assignedTo', 'username email');

        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        res.json({
            success: true,
            message: 'Service request updated',
            request
        });

    } catch (error) {
        console.error('Update service request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalContacts = await Contact.countDocuments();
        const totalServiceRequests = await ServiceRequest.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        
        const recentContacts = await Contact.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const serviceRequestsByStatus = await ServiceRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const serviceRequestsByType = await ServiceRequest.aggregate([
            { $group: { _id: '$serviceType', count: { $sum: 1 } } }
        ]);

        res.json({
            overview: {
                totalContacts,
                totalServiceRequests,
                activeUsers,
                recentContacts
            },
            serviceRequestsByStatus,
            serviceRequestsByType
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔒 CyberGuard API server running on port ${PORT}`);
    console.log(`🛡️  Security protocols active`);
    console.log(`📡 Ready for secure communications`);
});

module.exports = app;
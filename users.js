const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Register user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department, year } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            role,
            department,
            year
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                year: user.year
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                year: user.year
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update allowed fields
        const allowedUpdates = ['name', 'department', 'year', 'notificationPreferences'];
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                user[update] = req.body[update];
            }
        });

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's registered events
router.get('/events', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'registeredEvents',
                populate: {
                    path: 'organizer',
                    select: 'name email'
                }
            });
        res.json(user.registeredEvents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
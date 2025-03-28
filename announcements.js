const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

// Get all announcements
router.get('/', async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single announcement
router.get('/:id', async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('author', 'name email');
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create announcement
router.post('/', auth, async (req, res) => {
    const announcement = new Announcement({
        ...req.body,
        author: req.user.id
    });

    try {
        const newAnnouncement = await announcement.save();
        res.status(201).json(newAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update announcement
router.put('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if user is the author or admin
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to update this announcement' });
        }

        Object.assign(announcement, req.body);
        const updatedAnnouncement = await announcement.save();
        res.json(updatedAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete announcement
router.delete('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if user is the author or admin
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }

        await announcement.remove();
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get announcements by priority
router.get('/priority/:level', async (req, res) => {
    try {
        const announcements = await Announcement.find({ priority: req.params.level })
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
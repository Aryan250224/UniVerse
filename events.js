const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('attendees', 'name email');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create event
router.post('/', auth, async (req, res) => {
    const event = new Event({
        ...req.body,
        organizer: req.user.id
    });

    try {
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update event
router.put('/:id', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        Object.assign(event, req.body);
        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await event.remove();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// RSVP to event
router.post('/:id/rsvp', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is already registered
        if (event.attendees.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Check if event is full
        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ message: 'Event is full' });
        }

        event.attendees.push(req.user.id);
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel RSVP
router.delete('/:id/rsvp', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        event.attendees = event.attendees.filter(
            attendee => attendee.toString() !== req.user.id
        );
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
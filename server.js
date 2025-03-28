const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI;
console.log('Attempting to connect to MongoDB...');
console.log('Connection string format:', uri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://[username]:[password]@'));

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

async function connectToMongoDB() {
    try {
        console.log('Initiating MongoDB connection...');
        await client.connect();
        console.log('Initial connection successful');
        
        // Test the connection by accessing the database
        const db = client.db('universe');
        console.log('Attempting to ping database...');
        await db.command({ ping: 1 });
        console.log('Database ping successful');
        
        // Try to create a test collection
        console.log('Attempting to create a test collection...');
        const testCollection = db.collection('test');
        await testCollection.insertOne({ test: true, timestamp: new Date() });
        console.log('Test document inserted successfully');
        
        // Clean up test document
        await testCollection.deleteOne({ test: true });
        console.log('Test document cleaned up');
        
        console.log('UniVerse: MongoDB Connected Successfully');
    } catch (err) {
        console.error('UniVerse: MongoDB Connection Error Details:');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        if (err.code) console.error('Error code:', err.code);
        if (err.codeName) console.error('Error codeName:', err.codeName);
        if (err.stack) console.error('Error stack:', err.stack);
        process.exit(1);
    }
}

// Connect to MongoDB
connectToMongoDB();

// Routes
app.use('/api/events', require('./routes/events'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`UniVerse Server running on port ${PORT}`);
}); 
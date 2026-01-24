const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CRITICAL: Middleware MUST come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Entry Schema
const entrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  type: { type: String, required: true, enum: ['income', 'expense'] },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Entry = mongoose.model('Entry', entrySchema);

// IMPORTANT: Root route - this fixes "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ 
    message: 'Income Expense Tracker API is running!',
    status: 'OK',
    endpoints: {
      getAllEntries: 'GET /api/entries',
      createEntry: 'POST /api/entries',
      deleteEntry: 'DELETE /api/entries/:id'
    }
  });
});

// Get all entries
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new entry
app.post('/api/entries', async (req, res) => {
  try {
    const entry = new Entry({
      date: req.body.date,
      type: req.body.type,
      category: req.body.category,
      amount: req.body.amount,
      description: req.body.description || ''
    });

    const newEntry = await entry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const result = await Entry.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ message: error.message });
  }
});

// CRITICAL: Export for Vercel
module.exports = app;
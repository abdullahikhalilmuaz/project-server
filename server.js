// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoute from './routes/authRoutes.js';
import projectTopicRoutes from './routes/projectTopicRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js'; // Changed from 'router'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ROUTES
app.use('/api/auth', userRoute);
app.use('/api/topics', projectTopicRoutes);
app.use('/api/proposals', proposalRoutes); // Use default import

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
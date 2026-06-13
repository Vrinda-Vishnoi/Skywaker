import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import mongoose from 'mongoose';
import satelliteRoutes from './routes/satellites';
import passesRoutes from './routes/passes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

connectDB();

app.use('/api/satellites', satelliteRoutes);
app.use('/api/passes', passesRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Skyward API running on port ${PORT}`);
});

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import questionnaireRoutes from './routes/questionnaireRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: NODE_ENV === 'production',
  crossOriginOpenerPolicy: NODE_ENV === 'production',
  crossOriginResourcePolicy: NODE_ENV === 'production'
}));

// Logging middleware - more detailed in development
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questionnaire', questionnaireRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TalkWell AI API' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    stack: NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running in ${NODE_ENV} mode on port ${PORT}`);
}); 
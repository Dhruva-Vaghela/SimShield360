import { connect, connection, Connection, Mongoose } from 'mongoose';
import logger from '../utils/logger.util';

// MongoDB connection state
let mongooseInstance: Mongoose | null = null;

// Database configuration interface
export interface DatabaseConfig {
  uri: string;
  dbName: string;
  poolSize?: number;
  poolMax?: number;
  retryWrites?: boolean;
  w?: string;
  tls?: boolean;
}

// Load configuration from environment
const config: DatabaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/simshield',
  dbName: process.env.MONGODB_DB_NAME || 'simshield',
  poolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
  poolMax: parseInt(process.env.MONGODB_POOL_MAX || '20', 10),
  retryWrites: true,
  w: 'majority',
  tls: process.env.NODE_ENV === 'production',
};

// Log configuration (without sensitive data)
logger.info('Database configuration loaded', {
  uriMasked: config.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
  dbName: config.dbName,
  poolSize: config.poolSize,
});

/**
 * Establish MongoDB connection with retry logic
 */
export const connectDatabase = async (): Promise<Mongoose> => {
  try {
    if (mongooseInstance) {
      logger.info('MongoDB connection already established');
      return mongooseInstance;
    }

    const mongooseOptions = {
      maxPoolSize: config.poolSize || 10,
      minPoolSize: Math.floor((config.poolSize || 10) / 2),
      maxConnecting: config.poolMax || 20,
      retryWrites: config.retryWrites,
      w: config.w as any,
      tls: config.tls,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    logger.info('Connecting to MongoDB...', {
      uri: config.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
      dbName: config.dbName,
    });

    mongooseInstance = await connect(config.uri, mongooseOptions);

    logger.info('MongoDB connection established successfully');

    // Connection events
    connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, closing MongoDB connection');
      await disconnectDatabase();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing MongoDB connection');
      await disconnectDatabase();
      process.exit(0);
    });

    return mongooseInstance;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error as Error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongooseInstance) {
    try {
      await mongooseInstance.disconnect();
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error as Error);
      throw error;
    }
  }
};

/**
 * Get current MongoDB connection
 */
export const getDatabaseConnection = (): Connection => {
  if (!mongooseInstance) {
    throw new Error('MongoDB not connected. Call connectDatabase first.');
  }
  return connection;
};

/**
 * Get current MongoDB instance
 */
export const getMongooseInstance = (): Mongoose => {
  if (!mongooseInstance) {
    throw new Error('MongoDB not connected. Call connectDatabase first.');
  }
  return mongooseInstance;
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
  return mongooseInstance?.connection.readyState === 1;
};

// Export configuration
export default config;

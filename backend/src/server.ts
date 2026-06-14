import app from './app';
import logger from './utils/logger.util';
import { logConfig } from './config/environment.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';

// Import environment configuration
import environment from './config/environment.config';

// Start server
const startServer = async () => {
  try {
    // Log configuration
    logConfig();

    // Connect to database (allow dev server to start without MongoDB)
    try {
      await connectDatabase();
    } catch (dbError) {
      if (environment.NODE_ENV === 'development') {
        logger.warn(
          'MongoDB connection failed — starting API in degraded mode. Database-backed routes will not work until MongoDB is available.',
          dbError as Error,
        );
      } else {
        throw dbError;
      }
    }

    // Start HTTP server
    const port = parseInt(environment.PORT, 10);
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`, {
        port,
        env: environment.NODE_ENV,
        apiPrefix: environment.API_PREFIX,
      });
    });

    // Handle server errors
    server.on('error', (error: Error & { code: string }) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await shutdown(server);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await shutdown(server);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error as Error);
    process.exit(1);
  }
};

// Graceful shutdown function
const shutdown = async (server: any) => {
  try {
    // Stop accepting new requests
    server.close(async () => {
      logger.info('HTTP server closed');

      // Disconnect from database
      await disconnectDatabase();
      logger.info('Database disconnected');

      // Exit process
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('Error during shutdown:', error as Error);
    process.exit(1);
  }
};

// Start server
startServer();

// Export for testing
export { startServer, shutdown };

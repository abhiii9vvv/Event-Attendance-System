/**
 * Centralized Error Handling Middleware
 * Catches and formats all errors consistently
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message } = err;

  const errorResponse = {
    success: false,
    error: {
      message: message || 'Internal Server Error',
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  console.error(`[${new Date().toISOString()}] Error:`, {
    message,
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json(errorResponse);
};

module.exports = { AppError, errorHandler };

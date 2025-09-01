import mongoose from 'mongoose';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle different types of errors
const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

const sendErrorDev = (error, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      success: false,
      error: error,
      message: error.message,
      stack: error.stack
    });
  }
  
  // Rendered website error
  console.error('ERROR 💥', error);
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: error.message
  });
};

const sendErrorProd = (error, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
  
  // Rendered website error
  if (error.isOperational) {
    return res.status(error.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: error.message
    });
  }
  
  console.error('ERROR 💥', error);
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// Global error handling middleware
export const errorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    let err = { ...error };
    err.message = error.message;

    // MongoDB casting error
    if (error.name === 'CastError') {
      err = handleCastErrorDB(err);
    }
    
    // MongoDB duplicate field error
    if (error.code === 11000) {
      err = handleDuplicateFieldsDB(err);
    }
    
    // MongoDB validation error
    if (error.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      err = handleJWTError();
    }
    
    if (error.name === 'TokenExpiredError') {
      err = handleJWTExpiredError();
    }

    sendErrorProd(err, req, res);
  }
};

// Async error wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};

// Validation error handler for express-validator
export const handleValidationErrors = async (req, res, next) => {
  const { validationResult } = await import('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};
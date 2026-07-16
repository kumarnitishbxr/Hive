import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/responseHandler';

/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the error has a status code resolved from AppError
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || undefined;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.keys(err.errors).reduce((acc: any, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // Handle Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid field: ${err.path}`;
  }

  // Handle Mongo Duplicate Key Error (e.g. Duplicate email)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicatedField = Object.keys(err.keyValue)[0];
    message = `Duplicate field value: ${duplicatedField}. Please use another value.`;
  }

  // Log unexpected errors (500) for debugging
  if (statusCode === 500) {
    console.error('Unhandled System Error:', err);
  }

  return sendError(res, message, statusCode, details);
};

export default errorHandler;

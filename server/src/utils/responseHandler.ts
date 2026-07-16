import { Response } from 'express';

/**
 * Send standardized success response
 */
export const sendSuccess = (res: Response, data: any, statusCode: number = 200, message?: string) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send standardized error response
 */
export const sendError = (res: Response, message: string, statusCode: number = 500, details?: any) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details
  });
};

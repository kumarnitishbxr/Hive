import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express Async Controller Wrapper to avoid try/catch boilerplate blocks
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default asyncHandler;

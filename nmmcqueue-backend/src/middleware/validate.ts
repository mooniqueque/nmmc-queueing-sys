import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError } from './error-handler.js';

/**
 * Middleware to validate request data using a Zod schema.
 * It checks req.body, req.query, and req.params.
 */
export const validate = (schema: ZodTypeAny) => 
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body: Request['body']; query: Request['query']; params: Request['params'] };

      // Replace with validated data to ensure only defined fields are used
      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(new AppError(message, 400));
      }
      next(error);
    }
  };

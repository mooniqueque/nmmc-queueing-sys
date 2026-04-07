import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { monitorRestLimiter, monitorStreamLimiter } from '../../middleware/rate-limit.js';
import { monitorController, videoUploadController, upload } from './controller.js';
import { setupSSEConnection } from '../../lib/sse.js';

export const monitorRouter = Router();

// Public routes
monitorRouter.get('/departments-videos', monitorRestLimiter, videoUploadController.getDepartmentsVideos);
monitorRouter.get('/windows', monitorRestLimiter, videoUploadController.getWindowStatus);
monitorRouter.get('/department/:slug', monitorRestLimiter, monitorController.getDepartmentStatus);
monitorRouter.get('/stream', monitorStreamLimiter, setupSSEConnection);

// Protected Admin routes for video management
monitorRouter.post(
    '/upload-video', 
    requireRole(['ADMIN']), 
    upload.single('video'), 
    videoUploadController.uploadVideo
);

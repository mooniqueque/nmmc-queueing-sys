import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { monitorController, videoUploadController, upload } from './controller.js';
import { setupSSEConnection } from '../../lib/sse.js';

export const monitorRouter = Router();

// Public routes
monitorRouter.get('/departments-videos', videoUploadController.getDepartmentsVideos);
monitorRouter.get('/windows', videoUploadController.getWindowStatus);
monitorRouter.get('/department/:slug', monitorController.getDepartmentStatus);
monitorRouter.get('/stream', setupSSEConnection);

// Protected Admin routes for video management
monitorRouter.post(
    '/upload-video', 
    requireRole(['ADMIN']), 
    upload.single('video'), 
    videoUploadController.uploadVideo
);

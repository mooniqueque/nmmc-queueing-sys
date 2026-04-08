import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { sanitizeMonitorSnapshot } from '../../lib/monitor-sanitizer.js';
import { monitorService } from './service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/videos';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'video/mp4') {
            cb(null, true);
        } else {
            cb(new Error('Only MP4 videos are allowed'));
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

class MonitorController {
    getWindowStatus = asyncHandler(async (req: Request, res: Response) => {
        const status = await monitorService.getWindowStatus();
        res.status(200).json({ success: true, data: sanitizeMonitorSnapshot(status) });
    });

    getDepartmentStatus = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const status = await monitorService.getDepartmentStatus(slug);
        res.status(200).json({
            success: true,
            data: Array.isArray(status) ? sanitizeMonitorSnapshot() : sanitizeMonitorSnapshot(status),
        });
    });

    getDepartmentsVideos = asyncHandler(async (req: Request, res: Response) => {
        const departments = await monitorService.getDepartmentsVideos();
        res.status(200).json({ success: true, data: departments });
    });

    uploadVideo = asyncHandler(async (req: Request, res: Response) => {
        const { departmentId } = req.body;
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No video file provided' });
            return;
        }

        const videoUrl = `/uploads/videos/${req.file.filename}`;
        await monitorService.updateDepartmentVideo(departmentId, videoUrl);

        res.status(200).json({ success: true, data: { videoUrl } });
    });
}

export const monitorController = new MonitorController();
// Export as both names for compatibility with routes.ts
export const videoUploadController = monitorController;

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { workstationService } from './service.js';

const WORKSTATION_TYPES = new Set(['WINDOW', 'TRIAGE', 'CALLER', 'KIOSK']);

function parseBoolean(value: unknown): boolean | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    return undefined;
}

class WorkstationController {
    getAll = asyncHandler(async (req: Request, res: Response) => {
        const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
        const type = typeof req.query.type === 'string' ? req.query.type.trim().toUpperCase() : undefined;
        const includeLegacyCallerParents = parseBoolean(req.query.includeLegacyCallerParents);

        if (type && !WORKSTATION_TYPES.has(type)) {
            res.status(400).json({ success: false, error: 'Invalid workstation type filter.' });
            return;
        }

        const stations = await workstationService.getAll({
            departmentId,
            type: type as any,
            includeLegacyCallerParents,
        });
        res.status(200).json({ success: true, data: stations });
    });

    create = asyncHandler(async (req: Request, res: Response) => {
        const { type, queueMode, customName, departmentId, count } = req.body;
        
        if (!type) {
            res.status(400).json({ success: false, error: 'Type is required' });
            return;
        }

        const stations = await workstationService.createWithAutoIncrement({
            type,
            queueMode,
            customName,
            departmentId,
            count: count ? Number(count) : 1
        });
        res.status(201).json({ success: true, data: stations.length === 1 ? stations[0] : stations });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const station = await workstationService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: station });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const result = await workstationService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    });
}

export const workstationController = new WorkstationController();

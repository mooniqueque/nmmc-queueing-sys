import { AppError } from '../middleware/error-handler.js';

type DepartmentQueueStatus = 'OPEN' | 'CLOSED' | 'FULL';

export type DepartmentAssignmentTarget = {
    id: string;
    name: string;
    status: DepartmentQueueStatus;
};

export function assertDepartmentAcceptsAssignments(department: DepartmentAssignmentTarget | null | undefined) {
    if (!department) {
        throw new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');
    }

    if (department.status === 'OPEN') {
        return department;
    }

    if (department.status === 'FULL') {
        throw new AppError(
            `Department ${department.name} is currently full and cannot accept new ticket assignments.`,
            409,
            'DEPARTMENT_ASSIGNMENT_BLOCKED'
        );
    }

    throw new AppError(
        `Department ${department.name} is currently closed and cannot accept new ticket assignments.`,
        409,
        'DEPARTMENT_ASSIGNMENT_BLOCKED'
    );
}
import { z } from 'zod';

export const assignTicketSchema = z.object({
    departmentId: z.string(),
    priorityClass: z.string()
});

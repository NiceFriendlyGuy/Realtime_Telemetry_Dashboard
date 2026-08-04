import { z } from 'zod';

export const ReadingSchema = z.object({
    nodeId: z.string(),
    metric: z.string(),
    unit: z.string(),
    value: z.number(),
    timestamp: z.string(),
    anomaly: z.boolean(),
});
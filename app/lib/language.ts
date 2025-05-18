import { z } from 'zod';

export const LangSchema = z.enum(['fr', 'en']);
export type Lang = z.infer<typeof LangSchema>;

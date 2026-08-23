import { z } from "zod";
import { MODES } from "@lamp/shared";

export const createJobSchema = z
  .object({
    mode: z.enum(MODES),
    prompt: z.string().optional(),
    style_tags: z.string().optional(),
    lyrics: z.string().optional(),
    duration_sec: z.number().int().optional(),
    model_variant: z.string().optional(),
  })
  .strict();

export type CreateJobInput = z.infer<typeof createJobSchema>;

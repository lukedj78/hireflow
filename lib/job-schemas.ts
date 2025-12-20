import { z } from "zod";

export const JobDraftSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["remote", "onsite", "hybrid"]).optional(),
  salaryRange: z.string().optional(),
});

export type JobDraft = z.infer<typeof JobDraftSchema>;

export const FinalJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  type: z.enum(["remote", "onsite", "hybrid"]),
  salaryRange: z.string().optional(),
});

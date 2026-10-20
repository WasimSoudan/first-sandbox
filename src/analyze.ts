import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { z } from 'zod';
 
export const findingSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['security', 'quality', 'performance', 'reliability']),
  file: z.string(),
  summary: z.string(),
  recommendation: z.string()
});
 
export const reviewSchema = z.object({
  overallRisk: z.enum(['low', 'medium', 'high']),
  findings: z.array(findingSchema)
});
 
export type Finding = z.infer<typeof findingSchema>;
export type Review = z.infer<typeof reviewSchema>;

export async function analyzeWithPromptV1(source: string): Promise<string> {
  const result = await generateText({
    model: google("gemini-3.8-flash"),
    prompt: `Review this code and tell me what is wrong:\n\n${source}`,
  });

  return result.text;
}
async function main() {
  const source = `
      export function login(user: string, password: string) {
        if (password === 'admin') return true;
        return false;
      }
    `;

  const review = await analyzeWithPromptV1(source);
  console.log(review);
}

main();

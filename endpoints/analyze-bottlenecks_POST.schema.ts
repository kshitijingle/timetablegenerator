import { z } from "zod";
import { Bottleneck } from "../helpers/bottleneckAnalyzer";

export const schema = z.object({
  timetableId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Bottleneck[];

export const postAnalyzeBottlenecks = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/analyze-bottlenecks`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = await result.json();
    throw new Error(errorObject.error || "Failed to analyze bottlenecks");
  }
  return result.json();
};
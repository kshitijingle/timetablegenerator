import { z } from "zod";
import { setupFormSchema } from "../helpers/setupFormSchema";

export const schema = z.object({}); // No input schema for GET

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  schoolConfigId: number;
  schoolConfig: z.infer<typeof setupFormSchema>;
} | null;

export const getSchoolConfig = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/school-config`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    // Return null if not found, so the frontend can use default values
    if (result.status === 404) {
      return null;
    }
    const errorObject = await result.json();
    throw new Error(errorObject.error);
  }
  return result.json();
};
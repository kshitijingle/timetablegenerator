import { z } from "zod";
import { setupFormSchema } from "../helpers/setupFormSchema";

// The input schema is the same as the setup form schema.
export const schema = setupFormSchema;

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  schoolConfigId: number;
};

export const postSchoolConfig = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/school-config`, {
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
    throw new Error(errorObject.error);
  }
  return result.json();
};
import { z } from "zod";
import { Selectable } from "kysely";
import { Timetables } from "../helpers/schema";

export const schema = z.object({
  schoolConfigId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Timetables>[];

export const getTimetables = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    schoolConfigId: validatedParams.schoolConfigId.toString(),
  });

  const result = await fetch(`/_api/timetables?${searchParams.toString()}`, {
    method: "GET",
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
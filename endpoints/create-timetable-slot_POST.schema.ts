import { z } from "zod";
import { DayOfWeekArrayValues } from "../helpers/schema";
import { TimetableSlotWithDetails } from "./timetable_GET.schema";

export const schema = z.object({
  timetableId: z.number().int().positive(),
  dayOfWeek: z.enum(DayOfWeekArrayValues),
  periodNumber: z.number().int().positive(),
  subject: z.string().min(1),
  teacherId: z.number().int().positive(),
  classId: z.number().int().positive(),
  classroom: z.string().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = TimetableSlotWithDetails;

export const postCreateTimetableSlot = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/create-timetable-slot`, {
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
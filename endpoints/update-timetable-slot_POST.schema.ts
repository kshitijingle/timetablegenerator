import { z } from "zod";
import { TimetableSlotWithDetails } from "./timetable_GET.schema";

export const schema = z.object({
  slotId: z.number().int().positive(),
  teacherId: z.number().int().positive().optional(),
  classId: z.number().int().positive().optional(),
  subject: z.string().min(1).optional(),
  classroom: z.string().nullable().optional(),
}).refine(
  (data) =>
    data.teacherId !== undefined ||
    data.classId !== undefined ||
    data.subject !== undefined ||
    data.classroom !== undefined,
  {
    message: "At least one field to update must be provided.",
  }
);

export type InputType = z.infer<typeof schema>;

export type OutputType = TimetableSlotWithDetails;

export const postUpdateTimetableSlot = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/update-timetable-slot`, {
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
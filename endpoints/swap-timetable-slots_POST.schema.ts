import { z } from "zod";
import { TimetableSlotWithDetails } from "./timetable_GET.schema";

export const schema = z.object({
  slotId1: z.number().int().positive(),
  slotId2: z.number().int().positive(),
}).refine((data) => data.slotId1 !== data.slotId2, {
  message: "Cannot swap a slot with itself.",
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  updatedSlot1: TimetableSlotWithDetails;
  updatedSlot2: TimetableSlotWithDetails;
};

export const postSwapTimetableSlots = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/swap-timetable-slots`, {
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
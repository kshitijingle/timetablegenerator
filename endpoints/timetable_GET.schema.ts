import { z } from "zod";
import { Selectable } from "kysely";
import { Timetables, TimetableSlots } from "../helpers/schema";

export const schema = z.object({
  timetableId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type TimetableSlotWithDetails = Pick<
  Selectable<TimetableSlots>,
  | "id"
  | "dayOfWeek"
  | "periodNumber"
  | "subject"
  | "classroom"
  | "isManualOverride"
  | "teacherId"
  | "classId"
> & {
  teacherName: string | null;
  className: string | null;
};

export type OutputType = Selectable<Timetables> & {
  slots: TimetableSlotWithDetails[];
};

export const getTimetable = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    timetableId: validatedParams.timetableId.toString(),
  });

  const result = await fetch(`/_api/timetable?${searchParams.toString()}`, {
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
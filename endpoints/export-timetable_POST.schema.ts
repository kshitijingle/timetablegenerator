import { z } from "zod";
import { DayOfWeekArrayValues } from "../helpers/schema";

const ExportViewSchema = z.union([
  z.literal("class-view"),
  z.literal("teacher-view"),
  z.literal("full-view"),
]);

export const schema = z.object({
  timetableId: z.number().int().positive(),
  view: ExportViewSchema,
  dayOfWeek: z.enum(DayOfWeekArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;
export type ExportView = z.infer<typeof ExportViewSchema>;

type SlotInfo = {
  periodNumber: number;
  subject: string;
};

type ClassScheduleSlot = SlotInfo & { teacherName: string };
type TeacherScheduleSlot = SlotInfo & { className: string };

type FullViewSlot = {
  dayOfWeek: (typeof DayOfWeekArrayValues)[number];
  periodNumber: number;
  subject: string;
  classroom: string | null;
  teacherName: string;
  className: string;
};

export type OutputType =
  | {
      classes: {
        className: string;
        totalHours: number;
        schedule: ClassScheduleSlot[];
      }[];
    }
  | {
      teachers: {
        teacherName: string;
        totalHours: number;
        schedule: TeacherScheduleSlot[];
      }[];
    }
  | {
      slots: FullViewSlot[];
    };

export const postExportTimetable = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/export-timetable`, {
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
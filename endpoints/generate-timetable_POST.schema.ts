import { z } from "zod";

export const schema = z.object({
  schoolConfigId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  timetableId: number;
  workloadStats: {
    averageHoursPerTeacher: number;
    workloadVariance: number;
    workloadStdDev: number;
    teacherWorkloads: Array<{
      teacherId: number;
      totalHours: number;
      backToBackCount: number;
      hoursPerDay: Record<string, number>;
      subjectsTaught: Record<string, number>;
      freePeriodsPerDay: Record<string, number>;
    }>;
  };
  placementStats: {
    totalSlotsPlaced: number;
    unplacedLessonsCount: number;
    conflictsResolved: number;
    unplacedLessons: Array<{
      classId: number;
      subject: string;
      requiresSpecificRoom: boolean;
    }>;
  };
};

export const postGenerateTimetable = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/generate-timetable`, {
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
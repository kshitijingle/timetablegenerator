import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postGenerateTimetable,
  InputType as GenerateTimetableInput,
  OutputType as GenerateTimetableOutput,
} from "../endpoints/generate-timetable_POST.schema";
import { timetablesQueryKey } from "./useTimetables";

// TypeScript types for workload statistics
export type TeacherWorkload = {
  teacherId: number;
  totalHours: number;
  backToBackCount: number;
  hoursPerDay: Record<string, number>;
  subjectsTaught: Record<string, number>;
  freePeriodsPerDay: Record<string, number>;
};

export type WorkloadStats = {
  averageHoursPerTeacher: number;
  workloadVariance: number;
  workloadStdDev: number;
  teacherWorkloads: TeacherWorkload[];
};

export type UnplacedLesson = {
  classId: number;
  subject: string;
  requiresSpecificRoom: boolean;
};

export type PlacementStats = {
  totalSlotsPlaced: number;
  unplacedLessonsCount: number;
  conflictsResolved: number;
  unplacedLessons: UnplacedLesson[];
};

export type TimetableGenerationResult = {
  timetableId: number;
  workloadStats: WorkloadStats;
  placementStats: PlacementStats;
};

/**
 * A React Query mutation hook to trigger the timetable generation process.
 * On success, it invalidates the list of timetables for the given school configuration,
 * which will cause the UI to refetch and display the new timetable in its "generating" state.
 * The mutation now returns comprehensive workload balancing information and placement statistics.
 */
export const useGenerateTimetable = () => {
  const queryClient = useQueryClient();

  return useMutation<TimetableGenerationResult, Error, GenerateTimetableInput>({
    mutationFn: (data: GenerateTimetableInput) => postGenerateTimetable(data),
    onSuccess: (data, variables) => {
      // Log workload balancing information
      console.log("Timetable generation completed with workload stats:", {
        averageHours: data.workloadStats.averageHoursPerTeacher,
        workloadVariance: data.workloadStats.workloadVariance,
        totalTeachers: data.workloadStats.teacherWorkloads.length,
        unplacedLessons: data.placementStats.unplacedLessonsCount,
      });

      // After triggering generation, invalidate the list of timetables
      // to show the new one with a "generating" status.
      queryClient.invalidateQueries({
        queryKey: [...timetablesQueryKey, variables.schoolConfigId],
      });
    },
    onError: (error) => {
      console.error("Failed to generate timetable:", error);
    },
  });
};
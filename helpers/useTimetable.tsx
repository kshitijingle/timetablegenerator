import { useQuery } from "@tanstack/react-query";
import { getTimetable, OutputType as TimetableDetailsType } from "../endpoints/timetable_GET.schema";

export const timetableQueryKey = ["timetable"];

/**
 * A React Query hook to fetch the detailed data for a single timetable, including all its slots.
 * The response includes comprehensive timetable information that can be used to analyze workload
 * distribution and display detailed scheduling information.
 * @param timetableId The ID of the timetable to fetch. The query is disabled if this is not provided.
 */
export const useTimetable = (timetableId: number | undefined) => {
  return useQuery<TimetableDetailsType, Error>({
    queryKey: [...timetableQueryKey, timetableId],
    queryFn: () => getTimetable({ timetableId: timetableId! }),
    enabled: !!timetableId, // Only run the query if timetableId is a valid number
    placeholderData: (previousData) => previousData,
  });
};
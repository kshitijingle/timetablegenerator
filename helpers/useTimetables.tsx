import { useQuery } from "@tanstack/react-query";
import { getTimetables, OutputType as TimetablesListType } from "../endpoints/timetables_GET.schema";

export const timetablesQueryKey = ["timetables"];

/**
 * A React Query hook to fetch a list of all generated timetables for a specific school configuration.
 * The timetables include generation status and metadata that can be used to display workload balancing
 * information in the UI.
 * @param schoolConfigId The ID of the school configuration. The query is disabled if this is not provided.
 */
export const useTimetables = (schoolConfigId: number | undefined) => {
  return useQuery<TimetablesListType, Error>({
    queryKey: [...timetablesQueryKey, schoolConfigId],
    queryFn: () => getTimetables({ schoolConfigId: schoolConfigId! }),
    enabled: !!schoolConfigId, // Only run the query if schoolConfigId is a valid number
    placeholderData: (previousData) => previousData,
  });
};
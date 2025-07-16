import { useQuery } from "@tanstack/react-query";
import { getSchoolConfig } from "../endpoints/school-config_GET.schema";

export const schoolConfigQueryKey = ["schoolConfig"];

/**
 * A React Query hook to fetch the latest school configuration.
 * It handles fetching, caching, and background refetching of the school config data.
 */
export const useSchoolConfig = () => {
  return useQuery({
    queryKey: schoolConfigQueryKey,
    queryFn: () => getSchoolConfig(),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
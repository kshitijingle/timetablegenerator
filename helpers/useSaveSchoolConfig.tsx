import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postSchoolConfig,
  InputType as SchoolConfigInput,
} from "../endpoints/school-config_POST.schema";
import { schoolConfigQueryKey } from "./useSchoolConfig";
import { timetablesQueryKey } from "./useTimetables";

/**
 * A React Query mutation hook for saving a new school configuration.
 * On successful creation, it invalidates the `schoolConfig` query to refetch the latest
 * configuration and also invalidates any existing timetables lists, as they would be
 * based on an old configuration.
 */
export const useSaveSchoolConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SchoolConfigInput) => postSchoolConfig(data),
    onSuccess: () => {
      // After a new config is saved, the old one is no longer the "latest".
      // Invalidate to refetch the new latest config.
      queryClient.invalidateQueries({ queryKey: schoolConfigQueryKey });
      // Also invalidate timetables as they are tied to a schoolConfigId which might now be outdated.
      queryClient.invalidateQueries({ queryKey: timetablesQueryKey });
    },
    onError: (error) => {
      console.error("Failed to save school configuration:", error);
    },
  });
};
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  postAnalyzeBottlenecks,
  InputType,
  OutputType,
} from "../endpoints/analyze-bottlenecks_POST.schema";

export const useAnalyzeBottlenecks = (
  options?: Omit<
    UseMutationOptions<OutputType, Error, InputType>,
    "mutationFn"
  >
) => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postAnalyzeBottlenecks(variables),
    ...options,
  });
};
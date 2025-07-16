import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postCreateTimetableSlot,
  InputType as CreateInput,
  OutputType as CreateOutput,
} from "../endpoints/create-timetable-slot_POST.schema";
import {
  postUpdateTimetableSlot,
  InputType as UpdateInput,
  OutputType as UpdateOutput,
} from "../endpoints/update-timetable-slot_POST.schema";
import {
  postSwapTimetableSlots,
  InputType as SwapInput,
  OutputType as SwapOutput,
} from "../endpoints/swap-timetable-slots_POST.schema";
import {
  postDeleteTimetableSlot,
  InputType as DeleteInput,
  OutputType as DeleteOutput,
} from "../endpoints/delete-timetable-slot_POST.schema";

const useCommonMutationOptions = (timetableId: number) => {
  const queryClient = useQueryClient();
  const timetableQueryKey = ["timetable", timetableId];

  const onSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: timetableQueryKey });
  };

  const onError = (error: Error, defaultMessage: string) => {
    console.error(error);
    toast.error(error.message || defaultMessage);
  };

  return { onSuccess, onError };
};

export const useUpdateTimetableSlot = (timetableId: number) => {
  const { onSuccess, onError } = useCommonMutationOptions(timetableId);

  const mutation = useMutation<UpdateOutput, Error, UpdateInput>({
    mutationFn: postUpdateTimetableSlot,
    onSuccess: () => onSuccess("Timetable slot updated successfully."),
    onError: (error) => onError(error, "Failed to update timetable slot."),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export const useSwapTimetableSlots = (timetableId: number) => {
  const { onSuccess, onError } = useCommonMutationOptions(timetableId);

  const mutation = useMutation<SwapOutput, Error, SwapInput>({
    mutationFn: postSwapTimetableSlots,
    onSuccess: () => onSuccess("Timetable slots swapped successfully."),
    onError: (error) => onError(error, "Failed to swap timetable slots."),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export const useDeleteTimetableSlot = (timetableId: number) => {
  const { onSuccess, onError } = useCommonMutationOptions(timetableId);

  const mutation = useMutation<DeleteOutput, Error, DeleteInput>({
    mutationFn: postDeleteTimetableSlot,
    onSuccess: () => onSuccess("Timetable slot deleted successfully."),
    onError: (error) => onError(error, "Failed to delete timetable slot."),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export const useCreateTimetableSlot = (timetableId: number) => {
  const { onSuccess, onError } = useCommonMutationOptions(timetableId);

  const mutation = useMutation<CreateOutput, Error, CreateInput>({
    mutationFn: postCreateTimetableSlot,
    onSuccess: () => onSuccess("Timetable slot created successfully."),
    onError: (error) => onError(error, "Failed to create timetable slot."),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

// Legacy hook for backward compatibility
export const useTimetableMutation = (timetableId: number) => {
  const createSlot = useCreateTimetableSlot(timetableId);
  const updateSlot = useUpdateTimetableSlot(timetableId);
  const swapSlots = useSwapTimetableSlots(timetableId);
  const deleteSlot = useDeleteTimetableSlot(timetableId);

  return {
    createSlot: createSlot.mutate,
    isCreatingSlot: createSlot.isLoading,
    updateSlot: updateSlot.mutate,
    isUpdatingSlot: updateSlot.isLoading,
    swapSlots: swapSlots.mutate,
    isSwappingSlots: swapSlots.isLoading,
    deleteSlot: deleteSlot.mutate,
    isDeletingSlot: deleteSlot.isLoading,
  };
};
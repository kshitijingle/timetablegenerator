import React, { useEffect } from "react";
import { z } from "zod";
import { Selectable } from "kysely";
import { Teachers, StudentClasses } from "../helpers/schema";
import { TimetableSlotWithDetails } from "../endpoints/timetable_GET.schema";
import { useUpdateTimetableSlot } from "../helpers/useTimetableMutation";
import { useSchoolConfig } from "../helpers/useSchoolConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useForm,
} from "./Form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Input } from "./Input";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import styles from "./TimetableSlotEditor.module.css";

const editorSchema = z.object({
  subject: z.string().min(1, "Subject is required."),
  teacherId: z.string().min(1, "Teacher is required."),
  classId: z.string().min(1, "Class is required."),
  classroom: z.string().optional(),
});

type EditorFormValues = z.infer<typeof editorSchema>;

interface TimetableSlotEditorProps {
  slot: TimetableSlotWithDetails | null;
  timetableId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allTeachers: Selectable<Teachers>[];
  allClasses: Selectable<StudentClasses>[];
}

export const TimetableSlotEditor = ({
  slot,
  timetableId,
  isOpen,
  onOpenChange,
  allTeachers,
  allClasses,
}: TimetableSlotEditorProps) => {
  const { mutate: updateSlot, isLoading: isUpdating } =
    useUpdateTimetableSlot(timetableId);

  const form = useForm({
    schema: editorSchema,
    defaultValues: {
      subject: "",
      teacherId: "",
      classId: "",
      classroom: "",
    },
  });

  useEffect(() => {
    if (slot) {
      form.setValues({
        subject: slot.subject,
        teacherId: String(slot.teacherId),
        classId: String(slot.classId),
        classroom: slot.classroom ?? "",
      });
    } else {
      form.setValues({
        subject: "",
        teacherId: "",
        classId: "",
        classroom: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  const handleSubmit = (values: EditorFormValues) => {
    if (!slot) return;

    updateSlot(
      {
        slotId: slot.id,
        subject: values.subject,
        teacherId: parseInt(values.teacherId, 10),
        classId: parseInt(values.classId, 10),
        classroom: values.classroom || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = () => {
    if (!isUpdating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Edit Timetable Slot</DialogTitle>
          <DialogDescription>
            Manually override the details for this class period.
          </DialogDescription>
        </DialogHeader>
        {slot ? (
          <Form {...form}>
            <form
              id="edit-slot-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className={styles.form}
            >
              <FormItem name="subject">
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input
                    value={form.values.subject}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="e.g. Mathematics"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="teacherId">
                <FormLabel>Teacher</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.teacherId}
                    onValueChange={(value) =>
                      form.setValues((prev) => ({ ...prev, teacherId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="classId">
                <FormLabel>Class</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.classId}
                    onValueChange={(value) =>
                      form.setValues((prev) => ({ ...prev, classId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {allClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="classroom">
                <FormLabel>Classroom (Optional)</FormLabel>
                <FormControl>
                  <Input
                    value={form.values.classroom ?? ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        classroom: e.target.value,
                      }))
                    }
                    placeholder="e.g. Room 101"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </form>
          </Form>
        ) : (
          <div className={styles.skeletonContainer}>
            <Skeleton className={styles.skeleton} />
            <Skeleton className={styles.skeleton} />
            <Skeleton className={styles.skeleton} />
            <Skeleton className={styles.skeleton} />
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-slot-form"
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
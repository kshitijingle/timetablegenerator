import { Selectable } from "kysely";
import {
  SchoolConfig,
  Teachers,
  StudentClasses,
  TeacherAvailability,
  DayOfWeek,
} from "./schema";

type Lesson = {
  classId: number;
  subject: string;
};

export type Slot = {
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  subject: string;
  teacherId: number;
  classId: number;
  classroom: string | null;
};

type ConflictResolverInput = {
  lesson: Lesson;
  teacher: Selectable<Teachers>;
  day: DayOfWeek;
  period: number;
  config: Selectable<SchoolConfig>;
  assignedSlots: Map<string, Slot>;
  availability: Selectable<TeacherAvailability>[];
  teachers: Selectable<Teachers>[];
  classes: Selectable<StudentClasses>[];
};

type ConflictResolverOutput = {
  isConflict: boolean;
  reason?: string;
  resolvedSlot?: Slot;
};

export function resolveConflicts(
  input: ConflictResolverInput
): ConflictResolverOutput {
  const { lesson, teacher, day, period, config, assignedSlots, availability } = input;

  // 1. Check if teacher is double-booked
  const teacherSlotKey = `${day}-${period}-${teacher.id}`;
  if (assignedSlots.has(teacherSlotKey)) {
    return { isConflict: true, reason: "Teacher double-booked" };
  }

  // 2. Check if class is double-booked
  const classSlotKey = `${day}-${period}-${lesson.classId}`;
  if (assignedSlots.has(classSlotKey)) {
    return { isConflict: true, reason: "Class double-booked" };
  }

  // 3. Check teacher availability constraints
  const isUnavailable = availability.some(
    (avail) =>
      avail.teacherId === teacher.id &&
      avail.dayOfWeek === day &&
      avail.periodNumber === period &&
      avail.isAvailable === false
  );
  if (isUnavailable) {
    return { isConflict: true, reason: "Teacher unavailable" };
  }

  // 4. Check teacher preferred days (soft constraint, for now we just check)
  if (teacher.preferredDays && !teacher.preferredDays.includes(day)) {
    // This could be a weighted penalty in a more advanced system.
    // For now, we don't treat it as a hard conflict.
  }

  // 5. Check for subject repetition for the same class in one day
  // This constraint is not fully implemented here, but would look like this:
  for (let p = 1; p <= config.totalPeriods; p++) {
    const existingSlot = assignedSlots.get(`${day}-${p}-${lesson.classId}`);
    if (existingSlot && existingSlot.subject === lesson.subject) {
      return { isConflict: true, reason: "Subject repeated for class on the same day" };
    }
  }

  // 6. Check max teaching hours per day for the teacher
  let hoursToday = 0;
  for (let p = 1; p <= config.totalPeriods; p++) {
    if (assignedSlots.has(`${day}-${p}-${teacher.id}`)) {
      hoursToday++;
    }
  }
  if (hoursToday >= teacher.maxHoursPerDay) {
    return { isConflict: true, reason: "Teacher exceeds max hours for the day" };
  }

  // If no conflicts, this slot is valid
  return {
    isConflict: false,
    resolvedSlot: {
      dayOfWeek: day,
      periodNumber: period,
      subject: lesson.subject,
      teacherId: teacher.id,
      classId: lesson.classId,
      classroom: null, // Classroom is assigned by the generator
    },
  };
}
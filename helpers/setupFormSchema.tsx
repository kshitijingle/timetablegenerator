import { z } from 'zod';

const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const schoolParametersSchema = z.object({
  workingDays: z.array(z.enum(workingDays)).min(1, "At least one working day is required."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  periodDuration: z.number().int().positive("Duration must be a positive number."),
  periodsPerDay: z.number().int().positive("Periods must be a positive number."),
  classrooms: z.number().int().positive("Number of classrooms must be a positive number."),
});

export const teacherAvailabilitySchema = z.object({
  day: z.enum(workingDays),
  unavailablePeriods: z.array(z.number().int().positive()),
});

export const teacherProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Teacher name is required."),
  subjects: z.array(z.string().min(1)).min(1, "At least one subject is required."),
  maxHoursPerDay: z.number().int().positive("Max hours must be a positive number."),
  preferredDays: z.array(z.enum(workingDays)).optional(),
  availability: z.array(teacherAvailabilitySchema).optional(),
});

export const classSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required."),
  frequency: z.number().int().positive("Frequency must be a positive number."),
  requiresSpecificRoom: z.boolean().default(false),
});

export const classDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Class name is required."),
  subjects: z.array(classSubjectSchema).min(1, "At least one subject is required."),
});

export const constraintsSchema = z.object({
  maxConsecutiveClasses: z.number().int().min(1, "Must be at least 1.").max(10, "Must be 10 or less."),
  minFreePeriodsPerDay: z.number().int().min(0, "Cannot be negative.").max(5, "Must be 5 or less."),
  allowSubjectRepetition: z.boolean().default(false),
  allowCoTeaching: z.boolean().default(false),
});

export const setupFormSchema = z.object({
  schoolParameters: schoolParametersSchema,
  teachers: z.array(teacherProfileSchema).min(1, "At least one teacher is required."),
  classes: z.array(classDataSchema).min(1, "At least one class is required."),
  constraints: constraintsSchema,
});

export const defaultSetupValues: z.infer<typeof setupFormSchema> = {
  schoolParameters: {
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    startTime: "08:00",
    endTime: "15:00",
    periodDuration: 45,
    periodsPerDay: 8,
    classrooms: 10,
  },
  teachers: [
    {
      id: crypto.randomUUID(),
      name: 'John Doe',
      subjects: ['Math', 'Science'],
      maxHoursPerDay: 6,
      preferredDays: ['Monday', 'Wednesday', 'Friday'],
      availability: [],
    },
  ],
  classes: [
    {
      id: crypto.randomUUID(),
      name: 'Grade 6A',
      subjects: [
        { name: 'Math', frequency: 5, requiresSpecificRoom: false },
        { name: 'Science', frequency: 4, requiresSpecificRoom: true },
        { name: 'English', frequency: 5, requiresSpecificRoom: false },
      ],
    },
  ],
  constraints: {
    maxConsecutiveClasses: 3,
    minFreePeriodsPerDay: 1,
    allowSubjectRepetition: false,
    allowCoTeaching: false,
  },
};
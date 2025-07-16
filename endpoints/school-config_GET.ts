import { db } from "../helpers/db";
import { OutputType } from "./school-config_GET.schema";
import { Selectable } from "kysely";
import {
  SchoolConfig,
  Teachers,
  StudentClasses,
  ClassSubjects,
  SchedulingConstraints,
  TeacherAvailability,
  DayOfWeek,
} from "../helpers/schema";
import {
  schoolParametersSchema,
  teacherProfileSchema,
  classDataSchema,
  constraintsSchema,
  setupFormSchema,
  teacherAvailabilitySchema,
  classSubjectSchema,
} from "../helpers/setupFormSchema";
import { z } from "zod";

type DbTeacher = Selectable<Teachers> & {
  availability: Pick<Selectable<TeacherAvailability>, "dayOfWeek" | "periodNumber">[];
};

type DbClass = Selectable<StudentClasses> & {
  subjects: Selectable<ClassSubjects>[];
};

function formatDataForOutput(
  config: Selectable<SchoolConfig>,
  teachers: DbTeacher[],
  classes: DbClass[],
  constraints: Selectable<SchedulingConstraints>[]
): OutputType {
  const schoolParameters: z.infer<typeof schoolParametersSchema> = {
    workingDays: config.workingDays as z.infer<typeof schoolParametersSchema>['workingDays'],
    startTime: config.startTime,
    endTime: config.endTime,
    periodDuration: config.periodDuration,
    periodsPerDay: config.totalPeriods,
    classrooms: config.totalClassrooms,
  };

  const formattedTeachers: z.infer<typeof teacherProfileSchema>[] = teachers.map(
    (t) => {
      const availabilityMap = new Map<DayOfWeek, number[]>();
      t.availability.forEach(avail => {
        if (!availabilityMap.has(avail.dayOfWeek)) {
            availabilityMap.set(avail.dayOfWeek, []);
        }
        availabilityMap.get(avail.dayOfWeek)!.push(avail.periodNumber);
      });

      const availability: z.infer<typeof teacherAvailabilitySchema>[] = [];
      availabilityMap.forEach((periods, day) => {
        availability.push({ day, unavailablePeriods: periods.sort((a, b) => a - b) });
      });

      return {
        id: t.id.toString(), // The form uses string UUIDs, but DB uses number IDs. We'll convert for consistency.
        name: t.name,
        subjects: t.subjects,
        maxHoursPerDay: t.maxHoursPerDay,
        preferredDays: (t.preferredDays as DayOfWeek[] | null) ?? undefined,
        availability: availability,
      };
    }
  );

  const formattedClasses: z.infer<typeof classDataSchema>[] = classes.map(
    (c) => ({
      id: c.id.toString(),
      name: c.name,
      subjects: c.subjects.map(
        (s) => ({
          name: s.subject,
          frequency: s.weeklyFrequency,
          requiresSpecificRoom: s.requiresSpecificRoom ?? false,
        })
      ),
    })
  );

  const maxConsecutive = constraints.find(c => c.constraintType === 'no_back_to_back')?.constraintValue ?? 3;
  const minFree = constraints.find(c => c.constraintType === 'min_free_periods')?.constraintValue ?? 1;
  const noRepeat = constraints.some(c => c.constraintType === 'no_repeat_subject');

  const formattedConstraints: z.infer<typeof constraintsSchema> = {
    maxConsecutiveClasses: maxConsecutive,
    minFreePeriodsPerDay: minFree,
    allowSubjectRepetition: !noRepeat,
    allowCoTeaching: false, // Not stored in DB
  };

  const output: z.infer<typeof setupFormSchema> = {
    schoolParameters: schoolParameters,
    teachers: formattedTeachers,
    classes: formattedClasses,
    constraints: formattedConstraints,
  };

  return { schoolConfig: output, schoolConfigId: config.id };
}

export async function handle(request: Request) {
  try {
    // Fetch the latest school configuration
    const latestConfig = await db
      .selectFrom("schoolConfig")
      .selectAll()
      .orderBy("createdAt", "desc")
      .limit(1)
      .executeTakeFirst();

    if (!latestConfig) {
      return Response.json({ error: "No school configuration found." }, { status: 404 });
    }

    const schoolConfigId = latestConfig.id;

    const teachers = await db
      .selectFrom("teachers")
      .where("schoolConfigId", "=", schoolConfigId)
      .selectAll()
      .execute();

    const teacherIds = teachers.map(t => t.id);
    const availability = teacherIds.length > 0 ? await db
      .selectFrom("teacherAvailability")
      .where("teacherId", "in", teacherIds)
      .where("isAvailable", "=", false)
      .select(["teacherId", "dayOfWeek", "periodNumber"])
      .execute() : [];

    const teachersWithAvail: DbTeacher[] = teachers.map(t => ({
        ...t,
        availability: availability.filter(a => a.teacherId === t.id)
    }));

    const classes = await db
      .selectFrom("studentClasses")
      .where("schoolConfigId", "=", schoolConfigId)
      .selectAll()
      .execute();

    const classIds = classes.map((c) => c.id);
    const subjects = classIds.length > 0 ? await db
      .selectFrom("classSubjects")
      .where("classId", "in", classIds)
      .selectAll()
      .execute() : [];

    const classesWithSubjects: DbClass[] = classes.map((c) => ({
      ...c,
      subjects: subjects.filter((s) => s.classId === c.id),
    }));

    const constraints = await db
      .selectFrom("schedulingConstraints")
      .where("schoolConfigId", "=", schoolConfigId)
      .selectAll()
      .execute();

    const responseData = formatDataForOutput(
      latestConfig,
      teachersWithAvail,
      classesWithSubjects,
      constraints
    );

    return Response.json(responseData satisfies OutputType);
  } catch (error) {
    console.error("Error fetching school configuration:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
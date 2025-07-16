import { z } from "zod";
import { db } from "../helpers/db";
import { schema, InputType, OutputType } from "./school-config_POST.schema";
import { Transaction } from "kysely";
import { DB } from "../helpers/schema";

async function createSchoolConfig(
  input: InputType,
  trx: Transaction<DB>
): Promise<number> {
  const { schoolParameters } = input;
  const [schoolConfig] = await trx
    .insertInto("schoolConfig")
    .values({
      name: "Default School Name", // Assuming a default name for now
      workingDays: schoolParameters.workingDays,
      startTime: schoolParameters.startTime,
      endTime: schoolParameters.endTime,
      periodDuration: schoolParameters.periodDuration,
      totalPeriods: schoolParameters.periodsPerDay,
      totalClassrooms: schoolParameters.classrooms,
    })
    .returning("id")
    .execute();

  if (!schoolConfig) {
    throw new Error("Failed to create school configuration.");
  }
  return schoolConfig.id;
}

async function createTeachers(
  input: InputType,
  schoolConfigId: number,
  trx: Transaction<DB>
) {
  const { teachers } = input;
  if (teachers.length === 0) return;

  const teacherInserts = teachers.map((teacher) => ({
    schoolConfigId,
    name: teacher.name,
    subjects: teacher.subjects,
    maxHoursPerDay: teacher.maxHoursPerDay,
    preferredDays: teacher.preferredDays,
  }));

  const insertedTeachers = await trx
    .insertInto("teachers")
    .values(teacherInserts)
    .returning(["id", "name"])
    .execute();

  const availabilityInserts = [];
  for (const teacher of teachers) {
    if (teacher.availability && teacher.availability.length > 0) {
      const dbTeacher = insertedTeachers.find((t) => t.name === teacher.name);
      if (dbTeacher) {
        for (const avail of teacher.availability) {
          for (const period of avail.unavailablePeriods) {
            availabilityInserts.push({
              teacherId: dbTeacher.id,
              dayOfWeek: avail.day,
              periodNumber: period,
              isAvailable: false,
            });
          }
        }
      }
    }
  }

  if (availabilityInserts.length > 0) {
    await trx
      .insertInto("teacherAvailability")
      .values(availabilityInserts)
      .execute();
  }
}

async function createClassesAndSubjects(
  input: InputType,
  schoolConfigId: number,
  trx: Transaction<DB>
) {
  const { classes } = input;
  if (classes.length === 0) return;

  for (const classData of classes) {
    const [studentClass] = await trx
      .insertInto("studentClasses")
      .values({
        schoolConfigId,
        name: classData.name,
      })
      .returning("id")
      .execute();

    if (!studentClass) {
      throw new Error(`Failed to create class: ${classData.name}`);
    }

    const subjectInserts = classData.subjects.map((subject) => ({
      classId: studentClass.id,
      subject: subject.name,
      weeklyFrequency: subject.frequency,
      requiresSpecificRoom: subject.requiresSpecificRoom,
      // specificRoom is not in the input schema, so we leave it null
    }));

    if (subjectInserts.length > 0) {
      await trx.insertInto("classSubjects").values(subjectInserts).execute();
    }
  }
}

async function createConstraints(
  input: InputType,
  schoolConfigId: number,
  trx: Transaction<DB>
) {
  const { constraints } = input;
  const constraintInserts = [];

  constraintInserts.push({
    schoolConfigId,
    constraintType: "no_back_to_back" as const,
    constraintValue: constraints.maxConsecutiveClasses,
    constraintDescription: `No more than ${constraints.maxConsecutiveClasses} back-to-back classes.`,
  });

  constraintInserts.push({
    schoolConfigId,
    constraintType: "min_free_periods" as const,
    constraintValue: constraints.minFreePeriodsPerDay,
    constraintDescription: `At least ${constraints.minFreePeriodsPerDay} free periods per day.`,
  });

  if (!constraints.allowSubjectRepetition) {
    constraintInserts.push({
      schoolConfigId,
      constraintType: "no_repeat_subject" as const,
      constraintValue: 1, // 1 means max 1 per day
      constraintDescription: "Subjects should not repeat for the same class in a day.",
    });
  }
  
  // Note: specific_room and no_double_booking are handled by the generator logic, not a simple value.
  // Co-teaching is not a constraint in the DB schema.

  if (constraintInserts.length > 0) {
    await trx
      .insertInto("schedulingConstraints")
      .values(constraintInserts)
      .execute();
  }
}

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const input = schema.parse(json);

    const schoolConfigId = await db.transaction().execute(async (trx) => {
      // For simplicity, we assume this is a new setup and don't handle updates.
      // A real-world app might version configs or update existing ones.
      
      const newSchoolConfigId = await createSchoolConfig(input, trx);
      await createTeachers(input, newSchoolConfigId, trx);
      await createClassesAndSubjects(input, newSchoolConfigId, trx);
      await createConstraints(input, newSchoolConfigId, trx);

      return newSchoolConfigId;
    });

    return Response.json({ schoolConfigId } satisfies OutputType);
  } catch (error) {
    console.error("Error saving school configuration:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
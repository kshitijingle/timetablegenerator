import { db } from "../helpers/db";
import { schema, OutputType } from "./analyze-bottlenecks_POST.schema";
import { analyzeBottlenecks } from "../helpers/bottleneckAnalyzer";
import { z } from "zod";
import { Selectable } from "kysely";
import { SchoolConfig, Teachers, StudentClasses, ClassSubjects } from "../helpers/schema";
import { TimetableSlotWithDetails } from "./timetable_GET.schema";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { timetableId } = schema.parse(json);

    // 1. Fetch timetable to get schoolConfigId
    const timetable = await db
      .selectFrom("timetables")
      .select("schoolConfigId")
      .where("id", "=", timetableId)
      .executeTakeFirst();

    if (!timetable || !timetable.schoolConfigId) {
      return Response.json({ error: "Timetable not found or not linked to a school configuration." }, { status: 404 });
    }

    const { schoolConfigId } = timetable;

    // 2. Fetch all necessary data in parallel
    const [schoolConfig, teachers, studentClasses, allClassSubjects, slots] = await Promise.all([
      db.selectFrom("schoolConfig").where("id", "=", schoolConfigId).selectAll().executeTakeFirst(),
      db.selectFrom("teachers").where("schoolConfigId", "=", schoolConfigId).selectAll().execute(),
      db.selectFrom("studentClasses").where("schoolConfigId", "=", schoolConfigId).selectAll().execute(),
      db.selectFrom("classSubjects")
        .innerJoin("studentClasses", "studentClasses.id", "classSubjects.classId")
        .where("studentClasses.schoolConfigId", "=", schoolConfigId)
        .select(["classSubjects.id", "classSubjects.classId", "classSubjects.subject", "classSubjects.weeklyFrequency", "classSubjects.requiresSpecificRoom", "classSubjects.specificRoom", "classSubjects.createdAt", "classSubjects.updatedAt"])
        .execute(),
      db.selectFrom("timetableSlots")
        .leftJoin("teachers", "teachers.id", "timetableSlots.teacherId")
        .leftJoin("studentClasses", "studentClasses.id", "timetableSlots.classId")
        .where("timetableId", "=", timetableId)
        .select([
          "timetableSlots.id",
          "timetableSlots.dayOfWeek",
          "timetableSlots.periodNumber",
          "timetableSlots.subject",
          "timetableSlots.classroom",
          "timetableSlots.isManualOverride",
          "teachers.name as teacherName",
          "studentClasses.name as className",
          "timetableSlots.teacherId",
          "timetableSlots.classId",
        ])
        .orderBy("dayOfWeek")
        .orderBy("periodNumber")
        .execute()
    ]);

    if (!schoolConfig) {
      return Response.json({ error: "School configuration not found." }, { status: 404 });
    }

    // 3. Assemble the data structure for the analyzer
    const classSubjectsByClassId = new Map<number, Selectable<ClassSubjects>[]>();
    allClassSubjects.forEach(subject => {
      if (subject.classId) {
        if (!classSubjectsByClassId.has(subject.classId)) {
          classSubjectsByClassId.set(subject.classId, []);
        }
        classSubjectsByClassId.get(subject.classId)!.push(subject);
      }
    });

    const studentClassesWithSubjects = studentClasses.map(sc => ({
      ...sc,
      subjects: classSubjectsByClassId.get(sc.id) || [],
    }));

    const analysisInputs = {
      schoolConfig: {
        ...schoolConfig,
        teachers,
        studentClasses: studentClassesWithSubjects,
      },
      timetableSlots: slots as TimetableSlotWithDetails[],
    };

    // 4. Run the analysis
    const bottlenecks = analyzeBottlenecks(analysisInputs);

    return Response.json(bottlenecks satisfies OutputType);

  } catch (error) {
    console.error("Error analyzing bottlenecks:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred during bottleneck analysis.";
    return Response.json({ error: message }, { status: 500 });
  }
}
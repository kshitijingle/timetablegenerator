import { db } from "../helpers/db";
import { schema, OutputType, InputType } from "./export-timetable_POST.schema";

export async function handle(request: Request) {
  try {
    const input: InputType = await request.json();
    const { timetableId, view, dayOfWeek } = schema.parse(input);

    const baseQuery = db
      .selectFrom("timetableSlots")
      .where("timetableId", "=", timetableId)
      .innerJoin("teachers", "teachers.id", "timetableSlots.teacherId")
      .innerJoin(
        "studentClasses",
        "studentClasses.id",
        "timetableSlots.classId"
      )
      .select([
        "timetableSlots.dayOfWeek",
        "timetableSlots.periodNumber",
        "timetableSlots.subject",
        "timetableSlots.classroom",
        "teachers.id as teacherId",
        "teachers.name as teacherName",
        "studentClasses.id as classId",
        "studentClasses.name as className",
      ]);

    let finalQuery = baseQuery;
    if (view !== "full-view" && dayOfWeek) {
      finalQuery = baseQuery.where("dayOfWeek", "=", dayOfWeek);
    }

    const slots = await finalQuery.execute();

    let responseData: OutputType;

    if (view === "class-view") {
      const classesMap = new Map<number, { className: string; schedule: any[] }>();
      slots.forEach((slot) => {
        if (!classesMap.has(slot.classId)) {
          classesMap.set(slot.classId, {
            className: slot.className,
            schedule: [],
          });
        }
        classesMap.get(slot.classId)!.schedule.push({
          periodNumber: slot.periodNumber,
          subject: slot.subject,
          teacherName: slot.teacherName,
        });
      });
      responseData = {
        classes: Array.from(classesMap.values()).map(c => ({
            ...c,
            totalHours: c.schedule.length,
        })),
      };
    } else if (view === "teacher-view") {
      const teachersMap = new Map<number, { teacherName: string; schedule: any[] }>();
      slots.forEach((slot) => {
        if (!teachersMap.has(slot.teacherId)) {
          teachersMap.set(slot.teacherId, {
            teacherName: slot.teacherName,
            schedule: [],
          });
        }
        teachersMap.get(slot.teacherId)!.schedule.push({
          periodNumber: slot.periodNumber,
          subject: slot.subject,
          className: slot.className,
        });
      });
      responseData = {
        teachers: Array.from(teachersMap.values()).map(t => ({
            ...t,
            totalHours: t.schedule.length,
        })),
      };
    } else {
      // full-view
      responseData = { slots };
    }

    return Response.json(responseData satisfies OutputType);
  } catch (error) {
    console.error("Error exporting timetable:", error);
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
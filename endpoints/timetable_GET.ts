import { db } from "../helpers/db";
import { schema, OutputType } from "./timetable_GET.schema";
import { z } from "zod";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const timetableId = url.searchParams.get("timetableId");

    const input = schema.parse({
      timetableId: timetableId ? Number(timetableId) : undefined,
    });

    const timetable = await db
      .selectFrom("timetables")
      .where("id", "=", input.timetableId)
      .selectAll()
      .executeTakeFirst();

    if (!timetable) {
      return Response.json({ error: "Timetable not found." }, { status: 404 });
    }

    const slots = await db
      .selectFrom("timetableSlots")
      .leftJoin("teachers", "teachers.id", "timetableSlots.teacherId")
      .leftJoin("studentClasses", "studentClasses.id", "timetableSlots.classId")
      .where("timetableId", "=", input.timetableId)
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
      .execute();

    const response: OutputType = {
      ...timetable,
      slots,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error fetching timetable details:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
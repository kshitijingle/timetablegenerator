import { db } from "../helpers/db";
import { schema, OutputType } from "./create-timetable-slot_POST.schema";
import { z } from "zod";
import { checkConflictsForCreate } from "../helpers/timetableConflictChecker";

export async function handle(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const input = schema.parse(body);

    const newSlot = await db.transaction().execute(async (trx) => {
      const conflict = await checkConflictsForCreate(trx, input);

      if (conflict) {
        throw new Error(`Conflict detected: ${conflict.reason}`);
      }

      const result = await trx
        .insertInto("timetableSlots")
        .values({
          ...input,
          isManualOverride: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      
      return result;
    });

    // Fetch names for the response
    const teacher = newSlot.teacherId ? await db.selectFrom('teachers').where('id', '=', newSlot.teacherId).select('name').executeTakeFirst() : null;
    const studentClass = newSlot.classId ? await db.selectFrom('studentClasses').where('id', '=', newSlot.classId).select('name').executeTakeFirst() : null;

    const response: OutputType = {
      ...newSlot,
      teacherName: teacher?.name ?? null,
      className: studentClass?.name ?? null,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating timetable slot:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 400 });
  }
}
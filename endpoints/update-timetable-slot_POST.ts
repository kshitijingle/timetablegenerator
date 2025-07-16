import { db } from "../helpers/db";
import { schema, OutputType } from "./update-timetable-slot_POST.schema";
import { z } from "zod";
import { checkConflictsForUpdate } from "../helpers/timetableConflictChecker";

export async function handle(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const input = schema.parse(body);

    const updatedSlot = await db.transaction().execute(async (trx) => {
      const existingSlot = await trx
        .selectFrom("timetableSlots")
        .where("id", "=", input.slotId)
        .selectAll()
        .executeTakeFirst();

      if (!existingSlot) {
        throw new Error("Slot not found.");
      }
      if (!existingSlot.timetableId) {
        throw new Error("Slot is not associated with a timetable.");
      }

      const conflict = await checkConflictsForUpdate(trx, {
        slotId: input.slotId,
        timetableId: existingSlot.timetableId,
        dayOfWeek: existingSlot.dayOfWeek,
        periodNumber: existingSlot.periodNumber,
        newClassId: input.classId,
        newTeacherId: input.teacherId,
        newSubject: input.subject,
      });

      if (conflict) {
        throw new Error(`Conflict detected: ${conflict.reason}`);
      }

      const result = await trx
        .updateTable("timetableSlots")
        .set({
          teacherId: input.teacherId,
          classId: input.classId,
          subject: input.subject,
          classroom: input.classroom,
          isManualOverride: true,
          updatedAt: new Date(),
        })
        .where("id", "=", input.slotId)
        .returningAll()
        .executeTakeFirstOrThrow();
      
      return result;
    });

    // Fetch names for the response
    const teacher = updatedSlot.teacherId ? await db.selectFrom('teachers').where('id', '=', updatedSlot.teacherId).select('name').executeTakeFirst() : null;
    const studentClass = updatedSlot.classId ? await db.selectFrom('studentClasses').where('id', '=', updatedSlot.classId).select('name').executeTakeFirst() : null;

    const response: OutputType = {
      ...updatedSlot,
      teacherName: teacher?.name ?? null,
      className: studentClass?.name ?? null,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error updating timetable slot:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 400 }); // 400 for validation/conflict errors
  }
}
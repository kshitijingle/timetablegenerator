import { db } from "../helpers/db";
import { schema, OutputType } from "./swap-timetable-slots_POST.schema";
import { z } from "zod";
import { checkConflictsForSwap } from "../helpers/timetableConflictChecker";

export async function handle(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { slotId1, slotId2 } = schema.parse(body);

    const [updatedSlot1, updatedSlot2] = await db.transaction().execute(async (trx) => {
      const slot1 = await trx
        .selectFrom("timetableSlots")
        .where("id", "=", slotId1)
        .selectAll()
        .executeTakeFirst();

      const slot2 = await trx
        .selectFrom("timetableSlots")
        .where("id", "=", slotId2)
        .selectAll()
        .executeTakeFirst();

      if (!slot1 || !slot2) {
        throw new Error("One or both slots not found.");
      }
      if (slot1.timetableId !== slot2.timetableId) {
        throw new Error("Slots must belong to the same timetable.");
      }
      if (!slot1.timetableId) {
        throw new Error("Slots are not associated with a timetable.");
      }

      const conflict = await checkConflictsForSwap(trx, {
        timetableId: slot1.timetableId,
        slot1,
        slot2,
      });

      if (conflict) {
        throw new Error(`Conflict detected: ${conflict.reason}`);
      }

      // Perform the swap
      const [res1] = await trx
        .updateTable("timetableSlots")
        .set({
          teacherId: slot2.teacherId,
          classId: slot2.classId,
          subject: slot2.subject,
          classroom: slot2.classroom,
          isManualOverride: true,
          updatedAt: new Date(),
        })
        .where("id", "=", slot1.id)
        .returningAll()
        .execute();

      const [res2] = await trx
        .updateTable("timetableSlots")
        .set({
          teacherId: slot1.teacherId,
          classId: slot1.classId,
          subject: slot1.subject,
          classroom: slot1.classroom,
          isManualOverride: true,
          updatedAt: new Date(),
        })
        .where("id", "=", slot2.id)
        .returningAll()
        .execute();
      
      return [res1, res2];
    });

    // Fetch names for the response
    const [teacher1, class1, teacher2, class2] = await Promise.all([
        updatedSlot1.teacherId ? db.selectFrom('teachers').where('id', '=', updatedSlot1.teacherId).select('name').executeTakeFirst() : null,
        updatedSlot1.classId ? db.selectFrom('studentClasses').where('id', '=', updatedSlot1.classId).select('name').executeTakeFirst() : null,
        updatedSlot2.teacherId ? db.selectFrom('teachers').where('id', '=', updatedSlot2.teacherId).select('name').executeTakeFirst() : null,
        updatedSlot2.classId ? db.selectFrom('studentClasses').where('id', '=', updatedSlot2.classId).select('name').executeTakeFirst() : null,
    ]);

    const response: OutputType = {
      updatedSlot1: { ...updatedSlot1, teacherName: teacher1?.name ?? null, className: class1?.name ?? null },
      updatedSlot2: { ...updatedSlot2, teacherName: teacher2?.name ?? null, className: class2?.name ?? null },
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error swapping timetable slots:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 400 });
  }
}
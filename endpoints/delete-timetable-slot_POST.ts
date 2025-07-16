import { db } from "../helpers/db";
import { schema, OutputType } from "./delete-timetable-slot_POST.schema";
import { z } from "zod";

export async function handle(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { slotId } = schema.parse(body);

    const result = await db
      .deleteFrom("timetableSlots")
      .where("id", "=", slotId)
      .executeTakeFirst();

    if (result.numDeletedRows === 0n) {
      return Response.json({ error: "Slot not found." }, { status: 404 });
    }

    return Response.json({ success: true, deletedSlotId: slotId });
  } catch (error) {
    console.error("Error deleting timetable slot:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
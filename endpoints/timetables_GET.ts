import { db } from "../helpers/db";
import { schema, OutputType } from "./timetables_GET.schema";
import { z } from "zod";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const schoolConfigId = url.searchParams.get("schoolConfigId");

    const input = schema.parse({
      schoolConfigId: schoolConfigId ? Number(schoolConfigId) : undefined,
    });

    const timetables = await db
      .selectFrom("timetables")
      .where("schoolConfigId", "=", input.schoolConfigId)
      .selectAll()
      .orderBy("generationTimestamp", "desc")
      .execute();

    return Response.json(timetables satisfies OutputType);
  } catch (error) {
    console.error("Error fetching timetables:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
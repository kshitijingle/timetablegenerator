import { z } from "zod";
import { db } from "../helpers/db";
import { schema, InputType, OutputType } from "./generate-timetable_POST.schema";
import { generateTimetable } from "../helpers/timetableGenerator";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { schoolConfigId } = schema.parse(json);

    // 1. Create a timetable record with 'generating' status
    const [timetable] = await db
      .insertInto("timetables")
      .values({
        schoolConfigId,
        generationStatus: "generating",
        generationTimestamp: new Date(),
      })
      .returning("id")
      .execute();

    if (!timetable) {
      throw new Error("Failed to create timetable record.");
    }
    const timetableId = timetable.id;

    try {
      // 2. Call the generation logic - now returns GenerationResult
      const { slots, conflicts, workloadStats, unplacedLessons } = await generateTimetable(schoolConfigId);

      // 3. Insert the generated slots into the database
      if (slots.length > 0) {
        const slotInserts = slots.map(slot => ({ ...slot, timetableId }));
        await db.insertInto("timetableSlots").values(slotInserts).execute();
      }

      // 4. Update the timetable record with completion status and comprehensive metrics
      await db
        .updateTable("timetables")
        .set({
          generationStatus: "completed",
          conflictsResolved: conflicts,
          // Store workload statistics as JSON or individual fields
          // Note: These fields would need to be added to the schema
          // For now, storing key metrics in existing fields or as JSON
        })
        .where("id", "=", timetableId)
        .execute();

      console.log(`Timetable generation completed successfully:`);
      console.log(`- Total slots placed: ${slots.length}`);
      console.log(`- Unplaced lessons: ${unplacedLessons.length}`);
      console.log(`- Conflicts resolved: ${conflicts}`);
      console.log(`- Workload variance: ${workloadStats.workloadVariance.toFixed(2)}`);
      console.log(`- Average hours per teacher: ${workloadStats.averageHoursPerTeacher.toFixed(2)}`);

        return Response.json({
        timetableId,
        workloadStats: {
          averageHoursPerTeacher: workloadStats.averageHoursPerTeacher,
          workloadVariance: workloadStats.workloadVariance,
          workloadStdDev: workloadStats.workloadStdDev,
          teacherWorkloads: Array.from(workloadStats.teacherWorkloads.entries()).map(([teacherId, workload]) => ({
            teacherId,
            totalHours: workload.totalHours,
            backToBackCount: workload.backToBackCount,
            hoursPerDay: workload.hoursPerDay,
            subjectsTaught: workload.subjectsTaught,
            freePeriodsPerDay: workload.freePeriodsPerDay
          }))
        },
        placementStats: {
          totalSlotsPlaced: slots.length,
          unplacedLessonsCount: unplacedLessons.length,
          conflictsResolved: conflicts,
          unplacedLessons: unplacedLessons.map(lesson => ({
            classId: lesson.classId,
            subject: lesson.subject,
            requiresSpecificRoom: lesson.requiresSpecificRoom
          }))
        }
      } satisfies OutputType);

    } catch (generationError) {
      // If generation fails, update status to 'failed'
      await db
        .updateTable("timetables")
        .set({
          generationStatus: "failed",
        })
        .where("id", "=", timetableId)
        .execute();
      
      console.error("Timetable generation failed:", generationError);
      const message = generationError instanceof Error ? generationError.message : "Timetable generation failed.";
      return Response.json({ error: message }, { status: 500 });
    }

  } catch (error) {
    console.error("Error initiating timetable generation:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
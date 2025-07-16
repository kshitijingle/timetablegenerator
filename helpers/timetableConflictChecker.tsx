import { Transaction, Selectable } from "kysely";
import { db } from "./db";
import { DB, DayOfWeek, TimetableSlots } from "./schema";

type Conflict = {
  reason: string;
};

type BaseCheckInput = {
  timetableId: number;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  classId?: number | null;
  teacherId?: number | null;
  subject?: string | null;
  // The slot ID to exclude from checks (used in update/swap)
  excludeSlotId?: number;
};

async function getSchoolConfig(trx: Transaction<DB>, timetableId: number) {
    const timetable = await trx.selectFrom("timetables").where("id", "=", timetableId).select("schoolConfigId").executeTakeFirst();
    if (!timetable || !timetable.schoolConfigId) throw new Error("Timetable or school config not found.");
    
    const config = await trx.selectFrom("schoolConfig").where("id", "=", timetable.schoolConfigId).selectAll().executeTakeFirst();
    if (!config) throw new Error("School config not found.");
    
    return config;
}

async function checkBaseConflicts(trx: Transaction<DB>, input: BaseCheckInput): Promise<Conflict | null> {
  const { timetableId, dayOfWeek, periodNumber, classId, teacherId, subject, excludeSlotId } = input;

  if (!classId || !teacherId || !subject) {
    return null; // Cannot check conflicts if essential info is missing (e.g., deleting a slot)
  }

  // 1. Check for teacher/class double booking at the exact same time
  let doubleBookingQuery = trx
    .selectFrom("timetableSlots")
    .where("timetableId", "=", timetableId)
    .where("dayOfWeek", "=", dayOfWeek)
    .where("periodNumber", "=", periodNumber)
    .where((eb) => eb.or([
        eb("teacherId", "=", teacherId),
        eb("classId", "=", classId)
    ]));
  
  if (excludeSlotId) {
    doubleBookingQuery = doubleBookingQuery.where("id", "!=", excludeSlotId);
  }

  const doubleBookedSlot = await doubleBookingQuery.select("id").executeTakeFirst();

  if (doubleBookedSlot) {
    return { reason: "Teacher or Class is already booked for this period." };
  }

  // 2. Check teacher availability
  const availability = await trx
    .selectFrom("teacherAvailability")
    .where("teacherId", "=", teacherId)
    .where("dayOfWeek", "=", dayOfWeek)
    .where("periodNumber", "=", periodNumber)
    .select("isAvailable")
    .executeTakeFirst();

  if (availability && availability.isAvailable === false) {
    return { reason: "Teacher is marked as unavailable for this period." };
  }

  // 3. Check for subject repetition for the same class on the same day
  let subjectRepetitionQuery = trx
    .selectFrom("timetableSlots")
    .where("timetableId", "=", timetableId)
    .where("dayOfWeek", "=", dayOfWeek)
    .where("classId", "=", classId)
    .where("subject", "=", subject);

  if (excludeSlotId) {
    subjectRepetitionQuery = subjectRepetitionQuery.where("id", "!=", excludeSlotId);
  }

  const repeatedSubjectSlot = await subjectRepetitionQuery.select("id").executeTakeFirst();

  if (repeatedSubjectSlot) {
    return { reason: "Subject is already scheduled for this class on this day." };
  }

  // 4. Check teacher max hours per day
  const teacherDetails = await trx.selectFrom("teachers").where("id", "=", teacherId).select("maxHoursPerDay").executeTakeFirst();
  if (teacherDetails) {
    let dailySlotsQuery = trx
        .selectFrom("timetableSlots")
        .where("timetableId", "=", timetableId)
        .where("dayOfWeek", "=", dayOfWeek)
        .where("teacherId", "=", teacherId)
        .select(db.fn.count("id").as("count"));
    
    if (excludeSlotId) {
        dailySlotsQuery = dailySlotsQuery.where("id", "!=", excludeSlotId);
    }
    
    const { count } = await dailySlotsQuery.executeTakeFirstOrThrow();

    if (Number(count) >= teacherDetails.maxHoursPerDay) {
        return { reason: `Teacher would exceed maximum daily hours (${teacherDetails.maxHoursPerDay}).` };
    }
  }

  return null;
}

// For creating a new slot
export async function checkConflictsForCreate(trx: Transaction<DB>, input: Omit<BaseCheckInput, 'excludeSlotId'>): Promise<Conflict | null> {
    return checkBaseConflicts(trx, input);
}

// For updating an existing slot
type UpdateCheckInput = {
    slotId: number;
    timetableId: number;
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    newClassId?: number;
    newTeacherId?: number;
    newSubject?: string;
}
export async function checkConflictsForUpdate(trx: Transaction<DB>, input: UpdateCheckInput): Promise<Conflict | null> {
    const originalSlot = await trx.selectFrom("timetableSlots").where("id", "=", input.slotId).selectAll().executeTakeFirstOrThrow();
    
    return checkBaseConflicts(trx, {
        timetableId: input.timetableId,
        dayOfWeek: input.dayOfWeek,
        periodNumber: input.periodNumber,
        classId: input.newClassId ?? originalSlot.classId,
        teacherId: input.newTeacherId ?? originalSlot.teacherId,
        subject: input.newSubject ?? originalSlot.subject,
        excludeSlotId: input.slotId,
    });
}

// For swapping two slots
type SwapCheckInput = {
    timetableId: number;
    slot1: Selectable<TimetableSlots>;
    slot2: Selectable<TimetableSlots>;
}
export async function checkConflictsForSwap(trx: Transaction<DB>, input: SwapCheckInput): Promise<Conflict | null> {
    const { timetableId, slot1, slot2 } = input;

    // Check slot 1's content in slot 2's time
    const conflict1 = await checkBaseConflicts(trx, {
        timetableId,
        dayOfWeek: slot2.dayOfWeek,
        periodNumber: slot2.periodNumber,
        classId: slot1.classId,
        teacherId: slot1.teacherId,
        subject: slot1.subject,
        excludeSlotId: slot1.id, // Exclude original positions from checks
    });
    if (conflict1) return { reason: `Swapping causes conflict for '${slot1.subject}': ${conflict1.reason}` };

    // Check slot 2's content in slot 1's time
    const conflict2 = await checkBaseConflicts(trx, {
        timetableId,
        dayOfWeek: slot1.dayOfWeek,
        periodNumber: slot1.periodNumber,
        classId: slot2.classId,
        teacherId: slot2.teacherId,
        subject: slot2.subject,
        excludeSlotId: slot2.id,
    });
    if (conflict2) return { reason: `Swapping causes conflict for '${slot2.subject}': ${conflict2.reason}` };

    return null;
}
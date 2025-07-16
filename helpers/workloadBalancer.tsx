import { Selectable } from "kysely";
import { Teachers, SchoolConfig, DayOfWeek } from "./schema";
import { Slot } from "./conflictResolver";

/**
 * Represents the workload metrics for a single teacher.
 */
export type TeacherWorkload = {
  teacherId: number;
  totalHours: number;
  hoursPerDay: Record<DayOfWeek, number>;
  subjectsTaught: Record<string, number>;
  backToBackCount: number;
  freePeriodsPerDay: Record<DayOfWeek, number>;
};

/**
 * Represents the overall workload statistics for all teachers.
 */
export type WorkloadStats = {
  teacherWorkloads: Map<number, TeacherWorkload>;
  totalScheduledHours: number;
  averageHoursPerTeacher: number;
  workloadVariance: number; // Variance of totalHours across teachers
  workloadStdDev: number; // Standard deviation of totalHours
};

/**
 * Analyzes the current state of the schedule and calculates detailed workload statistics.
 * @param teachers - Array of all teacher objects.
 * @param assignedSlots - A map representing the current schedule.
 * @param config - The school configuration.
 * @returns An object containing detailed workload statistics.
 */
export function calculateWorkloadStats(
  teachers: Selectable<Teachers>[],
  assignedSlots: Map<string, Slot>,
  config: Selectable<SchoolConfig>
): WorkloadStats {
  const teacherWorkloads = new Map<number, TeacherWorkload>();
  const workingDays = config.workingDays as DayOfWeek[];

  // Initialize workload for all teachers
  for (const teacher of teachers) {
    const initialHoursPerDay = {} as Record<DayOfWeek, number>;
    const initialFreePeriods = {} as Record<DayOfWeek, number>;
    workingDays.forEach(day => {
        initialHoursPerDay[day] = 0;
        initialFreePeriods[day] = config.totalPeriods;
    });

    teacherWorkloads.set(teacher.id, {
      teacherId: teacher.id,
      totalHours: 0,
      hoursPerDay: initialHoursPerDay,
      subjectsTaught: {},
      backToBackCount: 0,
      freePeriodsPerDay: initialFreePeriods,
    });
  }

  // Populate workloads from assigned slots
  const slotsByTeacher = new Map<number, Slot[]>();
  assignedSlots.forEach(slot => {
    if (!slotsByTeacher.has(slot.teacherId)) {
        slotsByTeacher.set(slot.teacherId, []);
    }
    slotsByTeacher.get(slot.teacherId)!.push(slot);
  });

  slotsByTeacher.forEach((teacherSlots, teacherId) => {
    const workload = teacherWorkloads.get(teacherId);
    if (!workload) return;

    teacherSlots.sort((a, b) => a.periodNumber - b.periodNumber);

    workload.totalHours = teacherSlots.length;
    
    teacherSlots.forEach((slot, index) => {
        // Hours per day and free periods
        workload.hoursPerDay[slot.dayOfWeek]++;
        workload.freePeriodsPerDay[slot.dayOfWeek]--;

        // Subjects taught
        workload.subjectsTaught[slot.subject] = (workload.subjectsTaught[slot.subject] || 0) + 1;

        // Back-to-back
        if (index > 0) {
            const prevSlot = teacherSlots[index - 1];
            if (slot.dayOfWeek === prevSlot.dayOfWeek && slot.periodNumber === prevSlot.periodNumber + 1) {
                workload.backToBackCount++;
            }
        }
    });
  });

  // Calculate overall stats
  const totalHoursArray = Array.from(teacherWorkloads.values()).map(w => w.totalHours);
  const totalScheduledHours = totalHoursArray.reduce((sum, hours) => sum + hours, 0);
  const averageHoursPerTeacher = teachers.length > 0 ? totalScheduledHours / teachers.length : 0;
  
  const variance = teachers.length > 0 
    ? totalHoursArray.reduce((sum, hours) => sum + Math.pow(hours - averageHoursPerTeacher, 2), 0) / teachers.length
    : 0;
  
  const stdDev = Math.sqrt(variance);

  return {
    teacherWorkloads,
    totalScheduledHours,
    averageHoursPerTeacher,
    workloadVariance: variance,
    workloadStdDev: stdDev,
  };
}

type TeacherScore = {
  teacher: Selectable<Teachers>;
  score: number;
  reasons: string[];
};

/**
 * Selects the most suitable teacher for a given lesson from a list of potential teachers,
 * based on workload balancing principles.
 *
 * @param potentialTeachers - Teachers who can teach the lesson's subject.
 * @param day - The day the lesson is being scheduled for.
 * @param workloadStats - The current workload statistics.
 * @returns The optimal teacher or null if no suitable teacher is found.
 */
export function selectOptimalTeacher(
  potentialTeachers: Selectable<Teachers>[],
  day: DayOfWeek,
  workloadStats: WorkloadStats
): Selectable<Teachers> | null {
  if (potentialTeachers.length === 0) {
    return null;
  }
  if (potentialTeachers.length === 1) {
    return potentialTeachers[0];
  }

  const { averageHoursPerTeacher } = workloadStats;
  const scoredTeachers: TeacherScore[] = [];

  for (const teacher of potentialTeachers) {
    const workload = workloadStats.teacherWorkloads.get(teacher.id);
    if (!workload) continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. Penalize teachers already over the average workload
    const workloadDelta = workload.totalHours - averageHoursPerTeacher;
    if (workloadDelta > 0) {
      score += workloadDelta * 2; // Heavy penalty for being overworked
      reasons.push(`High total workload (${workload.totalHours}h)`);
    }

    // 2. Penalize teachers with many hours on the target day to encourage daily balance
    const dailyHours = workload.hoursPerDay[day] || 0;
    score += dailyHours * 1.5;
    if (dailyHours > 0) {
        reasons.push(`Has ${dailyHours}h on ${day}`);
    }

    // 3. Reward teachers who have this day as a preferred day
    if (teacher.preferredDays?.includes(day)) {
      score -= 2; // Bonus
      reasons.push(`Prefers ${day}`);
    }

    // 4. Small penalty for back-to-back classes to spread them out
    score += workload.backToBackCount * 0.5;
    if (workload.backToBackCount > 0) {
        reasons.push(`${workload.backToBackCount} back-to-back sessions`);
    }

    scoredTeachers.push({ teacher, score, reasons });
  }

  if (scoredTeachers.length === 0) {
    return potentialTeachers[0] || null; // Fallback
  }

  // Sort by score, lowest is best
  scoredTeachers.sort((a, b) => a.score - b.score);

  // console.log('Optimal Teacher Selection:', scoredTeachers.map(s => ({name: s.teacher.name, score: s.score, reasons: s.reasons})));

  return scoredTeachers[0].teacher;
}
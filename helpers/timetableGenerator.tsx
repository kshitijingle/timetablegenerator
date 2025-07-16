import { db } from "./db";
import { resolveConflicts, Slot } from "./conflictResolver";
import { calculateWorkloadStats, selectOptimalTeacher, WorkloadStats } from "./workloadBalancer";
import { Selectable } from "kysely";
import {
  SchoolConfig,
  Teachers,
  StudentClasses,
  ClassSubjects,
  TeacherAvailability,
  DayOfWeek,
  TimetableSlots,
} from "./schema";

type Lesson = {
  classId: number;
  subject: string;
  requiresSpecificRoom: boolean;
};

type GenerationResult = {
  slots: Slot[];
  conflicts: number;
  workloadStats: WorkloadStats;
  unplacedLessons: Lesson[];
};

// Helper function to calculate lesson placement difficulty
function calculateLessonDifficulty(
  lesson: Lesson,
  teachers: Selectable<Teachers>[],
  subjects: Selectable<ClassSubjects>[]
): number {
  let difficulty = 0;
  
  // Factor 1: Number of qualified teachers (fewer = harder)
  const qualifiedTeachers = teachers.filter(t => t.subjects.includes(lesson.subject));
  difficulty += (1 / Math.max(qualifiedTeachers.length, 1)) * 10;
  
  // Factor 2: Specific room requirement (harder to place)
  if (lesson.requiresSpecificRoom) {
    difficulty += 5;
  }
  
  // Factor 3: Subject frequency (more frequent = harder to distribute)
  const subjectFrequency = subjects.find(s => s.classId === lesson.classId && s.subject === lesson.subject)?.weeklyFrequency || 1;
  difficulty += subjectFrequency * 2;
  
  return difficulty;
}

export async function generateTimetable(schoolConfigId: number): Promise<GenerationResult> {
  console.log(`Starting timetable generation for school config ${schoolConfigId}`);
  
  // 1. Fetch all necessary data from the database
  const config = await db
    .selectFrom("schoolConfig")
    .where("id", "=", schoolConfigId)
    .selectAll()
    .executeTakeFirstOrThrow();

  const teachers = await db
    .selectFrom("teachers")
    .where("schoolConfigId", "=", schoolConfigId)
    .selectAll()
    .execute();

  const classes = await db
    .selectFrom("studentClasses")
    .where("schoolConfigId", "=", schoolConfigId)
    .selectAll()
    .execute();

  const subjects = await db
    .selectFrom("classSubjects")
    .where("classId", "in", classes.map(c => c.id))
    .selectAll()
    .execute();

  const availability = await db
    .selectFrom("teacherAvailability")
    .where("teacherId", "in", teachers.map(t => t.id))
    .selectAll()
    .execute();

  // 2. Create a list of all lessons to be scheduled
  const lessonsToSchedule: Lesson[] = [];
  subjects.forEach(subject => {
    for (let i = 0; i < subject.weeklyFrequency; i++) {
      lessonsToSchedule.push({
        classId: subject.classId!,
        subject: subject.subject,
        requiresSpecificRoom: subject.requiresSpecificRoom ?? false,
      });
    }
  });

  // 3. Prioritize lessons by difficulty (harder to place lessons first)
  const prioritizedLessons = lessonsToSchedule
    .map(lesson => ({
      lesson,
      difficulty: calculateLessonDifficulty(lesson, teachers, subjects)
    }))
    .sort((a, b) => b.difficulty - a.difficulty)
    .map(item => item.lesson);

  console.log(`Total lessons to schedule: ${prioritizedLessons.length}`);

  // 4. Initialize data structures for the generator
  const slots: Slot[] = [];
  const assignedSlots: Map<string, Slot> = new Map(); // Key: "day-period-classId" or "day-period-teacherId"
  const unplacedLessons: Lesson[] = [];
  let conflictsResolved = 0;

  // 5. Track workload statistics throughout generation
  let currentWorkloadStats = calculateWorkloadStats(teachers, assignedSlots, config);
  let initialVariance = currentWorkloadStats.workloadVariance;

  // 6. Iterate through lessons and try to place them with workload balancing
  for (const [index, lesson] of prioritizedLessons.entries()) {
    let placed = false;
    
    // Find teachers who can teach this subject
    const potentialTeachers = teachers.filter(t => t.subjects.includes(lesson.subject));
    
    if (potentialTeachers.length === 0) {
      console.warn(`No qualified teachers found for subject: ${lesson.subject}`);
      unplacedLessons.push(lesson);
      continue;
    }

    // Iterate through days and periods to find a slot
    for (const day of config.workingDays as DayOfWeek[]) {
      if (placed) break;
      for (let period = 1; period <= config.totalPeriods; period++) {
        if (placed) break;

        // Update workload stats for optimal teacher selection
        currentWorkloadStats = calculateWorkloadStats(teachers, assignedSlots, config);
        
        // Use workload balancer to select optimal teacher
        const optimalTeacher = selectOptimalTeacher(potentialTeachers, day, currentWorkloadStats);
        
        if (!optimalTeacher) {
          continue;
        }

        const { isConflict, resolvedSlot } = resolveConflicts({
          lesson,
          teacher: optimalTeacher,
          day,
          period,
          config,
          assignedSlots,
          availability,
          teachers,
          classes,
        });

        if (!isConflict) {
          const newSlot = resolvedSlot!;
          
          // Assign classroom
          const usedClassrooms = new Set<string>();
          assignedSlots.forEach((slot, key) => {
            if (key.startsWith(`${day}-${period}-`) && slot.classroom) {
              usedClassrooms.add(slot.classroom);
            }
          });
          
          let classroomNumber = 1;
          while(usedClassrooms.has(`CR${classroomNumber}`)) {
            classroomNumber++;
          }

          if (classroomNumber > config.totalClassrooms) {
            // No classroom available, skip this slot
            continue;
          }

          newSlot.classroom = `CR${classroomNumber}`;

          // Mark slot as assigned for teacher, class, and classroom
          assignedSlots.set(`${day}-${period}-${newSlot.classId}`, newSlot);
          assignedSlots.set(`${day}-${period}-${newSlot.teacherId}`, newSlot);
          
          slots.push(newSlot);
          placed = true;
          
          // Log workload improvement every 10 lessons
          if ((index + 1) % 10 === 0) {
            const newStats = calculateWorkloadStats(teachers, assignedSlots, config);
            const varianceImprovement = initialVariance - newStats.workloadVariance;
            console.log(`Progress: ${index + 1}/${prioritizedLessons.length} lessons placed. Workload variance: ${newStats.workloadVariance.toFixed(2)} (${varianceImprovement >= 0 ? '+' : ''}${varianceImprovement.toFixed(2)})`);
          }
          
          break; // Move to next lesson
        } else if (resolvedSlot) {
          // A conflict was found, but an alternative was provided
          conflictsResolved++;
        }
      }
    }

    if (!placed) {
      console.warn(`Could not place lesson: Subject ${lesson.subject} for Class ID ${lesson.classId}`);
      unplacedLessons.push(lesson);
    }
  }

  // 7. Calculate final workload statistics
  const finalWorkloadStats = calculateWorkloadStats(teachers, assignedSlots, config);
  const totalVarianceImprovement = initialVariance - finalWorkloadStats.workloadVariance;
  
  console.log(`Timetable generation completed:`);
  console.log(`- Total slots placed: ${slots.length}`);
  console.log(`- Unplaced lessons: ${unplacedLessons.length}`);
  console.log(`- Conflicts resolved: ${conflictsResolved}`);
  console.log(`- Final workload variance: ${finalWorkloadStats.workloadVariance.toFixed(2)}`);
  console.log(`- Workload variance improvement: ${totalVarianceImprovement >= 0 ? '+' : ''}${totalVarianceImprovement.toFixed(2)}`);
  console.log(`- Average hours per teacher: ${finalWorkloadStats.averageHoursPerTeacher.toFixed(2)}`);
  console.log(`- Workload standard deviation: ${finalWorkloadStats.workloadStdDev.toFixed(2)}`);
  
  // Log individual teacher workloads
  console.log(`Teacher workload distribution:`);
  finalWorkloadStats.teacherWorkloads.forEach((workload, teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      console.log(`- ${teacher.name}: ${workload.totalHours}h total, ${workload.backToBackCount} back-to-back sessions`);
    }
  });
  
  return { 
    slots, 
    conflicts: conflictsResolved, 
    workloadStats: finalWorkloadStats,
    unplacedLessons
  };
}
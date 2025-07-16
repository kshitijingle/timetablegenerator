import { Selectable } from 'kysely';
import { SchoolConfig, Teachers, StudentClasses, ClassSubjects, DayOfWeek } from './schema';
import { TimetableSlotWithDetails } from '../endpoints/timetable_GET.schema';
import { calculateWorkloadStats, TeacherWorkload } from './workloadBalancer';

export type BottleneckSeverity = 'critical' | 'warning' | 'info';

export type Bottleneck = {
  id: string;
  type: string;
  severity: BottleneckSeverity;
  title: string;
  description: string;
  suggestion: string;
  related?: {
    teacherIds?: number[];
    classIds?: number[];
    subjects?: string[];
  };
};

type AnalysisInputs = {
  schoolConfig: Selectable<SchoolConfig> & {
    teachers: Selectable<Teachers>[];
    studentClasses: (Selectable<StudentClasses> & {
      subjects: Selectable<ClassSubjects>[];
    })[];
  };
  timetableSlots: TimetableSlotWithDetails[];
};

/**
 * Analyzes the school configuration and timetable data to detect scheduling bottlenecks.
 * @param inputs - The necessary configuration and timetable data.
 * @returns An array of detected bottlenecks.
 */
export function analyzeBottlenecks(inputs: AnalysisInputs | null): Bottleneck[] {
  if (!inputs) {
    return [];
  }

  const { schoolConfig, timetableSlots } = inputs;
  const { totalClassrooms, workingDays, totalPeriods } = schoolConfig;
  const teachers = schoolConfig.teachers ?? [];
  const studentClasses = schoolConfig.studentClasses ?? [];

  const bottlenecks: Bottleneck[] = [];

  // 1. Teacher Shortage Detection
  const subjectDemand: Record<string, number> = {};
  studentClasses.forEach(c => {
    const subjects = c.subjects ?? [];
    subjects.forEach(s => {
      subjectDemand[s.subject] = (subjectDemand[s.subject] || 0) + s.weeklyFrequency;
    });
  });

  const subjectSupply: Record<string, number[]> = {};
  teachers.forEach(t => {
    t.subjects.forEach(s => {
      if (!subjectSupply[s]) subjectSupply[s] = [];
      subjectSupply[s].push(t.id);
    });
  });

  Object.keys(subjectDemand).forEach(subject => {
    if (!subjectSupply[subject] || subjectSupply[subject].length === 0) {
      bottlenecks.push({
        id: `teacher-shortage-${subject}`,
        type: 'Teacher Shortage',
        severity: 'critical',
        title: `No teachers for ${subject}`,
        description: `The subject "${subject}" is required by one or more classes but no teachers are qualified to teach it.`,
        suggestion: 'Assign the subject to at least one teacher or remove it from class requirements.',
        related: { subjects: [subject] },
      });
    }
  });

  // 2. Classroom Shortage
  const periodsInWeek = workingDays.length * totalPeriods;
  const totalRequiredSlots = Object.values(subjectDemand).reduce((sum, freq) => sum + freq, 0);
  if (totalRequiredSlots > periodsInWeek * totalClassrooms) {
    bottlenecks.push({
      id: 'classroom-shortage-overall',
      type: 'Classroom Shortage',
      severity: 'critical',
      title: 'Insufficient Classrooms for Required Lessons',
      description: `The total number of required lessons (${totalRequiredSlots}) exceeds the total available classroom slots (${periodsInWeek * totalClassrooms}) for the week.`,
      suggestion: 'Increase the number of classrooms, reduce subject frequencies, or extend school hours/days.',
    });
  }

  // 3. Overloaded Teachers & Workload Imbalance (using workloadBalancer)
  const assignedSlotsMap = new Map<string, TimetableSlotWithDetails>();
  timetableSlots.forEach(slot => assignedSlotsMap.set(`${slot.dayOfWeek}-${slot.periodNumber}-${slot.classId}`, slot));
  
  const workloadStats = calculateWorkloadStats(teachers, assignedSlotsMap as any, schoolConfig);
  
  workloadStats.teacherWorkloads.forEach((workload, teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    // Overloaded per day
    (Object.keys(workload.hoursPerDay) as DayOfWeek[]).forEach(day => {
      if (workload.hoursPerDay[day] > teacher.maxHoursPerDay) {
        bottlenecks.push({
          id: `overload-day-${teacherId}-${day}`,
          type: 'Overloaded Teacher',
          severity: 'warning',
          title: `${teacher.name} is overloaded on ${day}`,
          description: `${teacher.name} is scheduled for ${workload.hoursPerDay[day]} hours on ${day}, but their maximum is ${teacher.maxHoursPerDay}.`,
          suggestion: `Reassign some of ${teacher.name}'s classes on ${day} to other qualified teachers.`,
          related: { teacherIds: [teacherId] },
        });
      }
    });

    // Workload Imbalance
    const deviation = Math.abs(workload.totalHours - workloadStats.averageHoursPerTeacher);
    if (workloadStats.averageHoursPerTeacher > 0 && deviation > workloadStats.workloadStdDev * 1.5) {
        const isOverworked = workload.totalHours > workloadStats.averageHoursPerTeacher;
        bottlenecks.push({
            id: `imbalance-${teacherId}`,
            type: 'Workload Imbalance',
            severity: 'info',
            title: `${isOverworked ? 'High' : 'Low'} workload for ${teacher.name}`,
            description: `${teacher.name} has a total workload of ${workload.totalHours} hours, which significantly deviates from the average of ${workloadStats.averageHoursPerTeacher.toFixed(1)} hours.`,
            suggestion: `Consider rebalancing the schedule to distribute classes more evenly among teachers.`,
            related: { teacherIds: [teacherId] },
        });
    }
  });

  // 4. Subject Frequency Mismatch
  studentClasses.forEach(c => {
    const subjects = c.subjects ?? [];
    subjects.forEach(s => {
      const scheduledCount = timetableSlots.filter(
        slot => slot.classId === c.id && slot.subject === s.subject
      ).length;
      if (scheduledCount < s.weeklyFrequency) {
        bottlenecks.push({
          id: `freq-mismatch-${c.id}-${s.subject}`,
          type: 'Subject Frequency Mismatch',
          severity: 'warning',
          title: `"${s.subject}" is underscheduled for ${c.name}`,
          description: `${c.name} requires ${s.weeklyFrequency} lessons of ${s.subject} per week, but only ${scheduledCount} are scheduled.`,
          suggestion: `Schedule ${s.weeklyFrequency - scheduledCount} more lesson(s) for this subject and class.`,
          related: { classIds: [c.id], subjects: [s.subject] },
        });
      }
    });
  });

  return bottlenecks;
}
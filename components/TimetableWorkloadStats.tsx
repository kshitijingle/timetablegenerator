import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from './Badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from './Chart';
import { TimetableSlotWithDetails } from '../endpoints/timetable_GET.schema';
import { DayOfWeek } from '../helpers/schema';
import styles from './TimetableWorkloadStats.module.css';

interface TimetableWorkloadStatsProps {
  slots: TimetableSlotWithDetails[];
  workingDays: DayOfWeek[];
  totalPeriods: number;
}

type WorkloadStats = {
  teacherWorkload: {
    name: string;
    totalHours: number;
    dailyHours: { [day: string]: number };
    subjects: Set<string>;
  }[];
  avgHours: number;
  standardDeviation: number;
  placedSlots: number;
  unplacedSlots: number;
  placementRate: number;
  balanceQuality: { label: string; variant: 'success' | 'default' | 'warning' | 'destructive' };
};

const calculateWorkloadStats = (
  slots: TimetableSlotWithDetails[],
  workingDays: DayOfWeek[],
  totalPeriods: number,
): WorkloadStats | null => {
  if (!slots || !slots.length) return null;

  const teacherWorkload: {
    [teacherId: string]: {
      name: string;
      totalHours: number;
      dailyHours: { [day: string]: number };
      subjects: Set<string>;
    };
  } = {};

  slots.forEach(slot => {
    if (slot.teacherId && slot.teacherName) {
      const teacherKey = slot.teacherId.toString();
      if (!teacherWorkload[teacherKey]) {
        teacherWorkload[teacherKey] = {
          name: slot.teacherName,
          totalHours: 0,
          dailyHours: {},
          subjects: new Set(),
        };
        workingDays.forEach(day => {
          teacherWorkload[teacherKey].dailyHours[day] = 0;
        });
      }
      teacherWorkload[teacherKey].totalHours += 1;
      teacherWorkload[teacherKey].dailyHours[slot.dayOfWeek] += 1;
      teacherWorkload[teacherKey].subjects.add(slot.subject);
    }
  });

  const teacherHours = Object.values(teacherWorkload).map(t => t.totalHours);
  if (teacherHours.length === 0) return null;

  const avgHours = teacherHours.reduce((sum, hours) => sum + hours, 0) / teacherHours.length;
  const variance = teacherHours.reduce((sum, hours) => sum + Math.pow(hours - avgHours, 2), 0) / teacherHours.length;
  const standardDeviation = Math.sqrt(variance);

  const totalPossibleSlots = workingDays.length * totalPeriods;
  const placedSlots = slots.length;
  const placementRate = totalPossibleSlots > 0 ? (placedSlots / totalPossibleSlots) * 100 : 0;

  const getBalanceQuality = (stdDev: number) => {
    if (stdDev <= 1) return { label: 'Excellent', variant: 'success' as const };
    if (stdDev <= 2) return { label: 'Good', variant: 'default' as const };
    if (stdDev <= 3) return { label: 'Fair', variant: 'warning' as const };
    return { label: 'Poor', variant: 'destructive' as const };
  };

  return {
    teacherWorkload: Object.values(teacherWorkload).sort((a, b) => b.totalHours - a.totalHours),
    avgHours: Math.round(avgHours * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    placedSlots,
    unplacedSlots: totalPossibleSlots - placedSlots,
    placementRate: Math.round(placementRate * 10) / 10,
    balanceQuality: getBalanceQuality(standardDeviation),
  };
};

export const TimetableWorkloadStats = ({ slots, workingDays, totalPeriods }: TimetableWorkloadStatsProps) => {
  const workloadStats = useMemo(
    () => calculateWorkloadStats(slots, workingDays, totalPeriods),
    [slots, workingDays, totalPeriods],
  );

  if (!workloadStats) {
    return null;
  }

  const chartData = workloadStats.teacherWorkload.map(teacher => ({
    name: teacher.name.split(' ')[0],
    hours: teacher.totalHours,
  }));

  const chartConfig: ChartConfig = {
    hours: {
      label: 'Hours',
      color: 'var(--primary)',
    },
  };

  return (
    <>
      <div className={styles.workloadOverview}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={20} />
          Workload Balance Overview
        </h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><Users size={24} /></div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{workloadStats.avgHours}</div>
              <div className={styles.metricLabel}>Avg Hours/Teacher</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><CheckCircle size={24} /></div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{workloadStats.placementRate}%</div>
              <div className={styles.metricLabel}>Placement Success</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><AlertTriangle size={24} /></div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{workloadStats.unplacedSlots}</div>
              <div className={styles.metricLabel}>Unplaced Lessons</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><TrendingUp size={24} /></div>
            <div className={styles.metricContent}>
              <Badge variant={workloadStats.balanceQuality.variant}>{workloadStats.balanceQuality.label}</Badge>
              <div className={styles.metricLabel}>Balance Quality</div>
              <div className={styles.metricSubtext}>σ = {workloadStats.standardDeviation}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.workloadSection}>
        <div className={styles.workloadCharts}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Teacher Workload Distribution</h3>
            <div className={styles.chartContainer}>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className={styles.teacherBreakdown}>
            <h3 className={styles.chartTitle}>Per-Teacher Breakdown</h3>
            <div className={styles.teacherList}>
              {workloadStats.teacherWorkload.map((teacher, index) => (
                <div key={index} className={styles.teacherCard}>
                  <div className={styles.teacherHeader}>
                    <span className={styles.teacherName}>{teacher.name}</span>
                    <Badge variant="outline">{teacher.totalHours} hours</Badge>
                  </div>
                  <div className={styles.teacherDetails}>
                    <div className={styles.teacherSubjects}>
                      <span className={styles.detailLabel}>Subjects:</span>
                      <div className={styles.subjectTags}>
                        {Array.from(teacher.subjects).map(subject => (
                          <Badge key={subject} variant="secondary" className={styles.subjectTag}>
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className={styles.dailyHours}>
                      <span className={styles.detailLabel}>Daily Distribution:</span>
                      <div className={styles.dailyGrid}>
                        {workingDays.map(day => (
                          <div key={day} className={styles.dayHours}>
                            <span className={styles.dayLabel}>{day.slice(0, 3)}</span>
                            <span className={styles.hoursValue}>{teacher.dailyHours[day]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
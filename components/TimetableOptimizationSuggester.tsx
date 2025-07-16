import React, { useMemo, useState } from 'react';
import { useSchoolConfig } from '../helpers/useSchoolConfig';
import { useTimetable } from '../helpers/useTimetable';
import { analyzeBottlenecks, Bottleneck, BottleneckSeverity } from '../helpers/bottleneckAnalyzer';
import { AlertTriangle, CheckCircle, Info, Lightbulb, BarChart2, Users, BookOpen, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import styles from './TimetableOptimizationSuggester.module.css';

interface TimetableOptimizationSuggesterProps {
  timetableId: number;
  className?: string;
}

const severityMap: Record<BottleneckSeverity, { icon: React.ElementType; color: 'destructive' | 'warning' | 'default'; label: string }> = {
  critical: { icon: AlertTriangle, color: 'destructive', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'warning', label: 'Warning' },
  info: { icon: Info, color: 'default', label: 'Info' },
};

const typeIconMap: Record<string, React.ElementType> = {
  'Teacher Shortage': Users,
  'Classroom Shortage': BookOpen,
  'Overloaded Teacher': Users,
  'Workload Imbalance': BarChart2,
  'Subject Frequency Mismatch': BookOpen,
  'Default': SlidersHorizontal,
};

const SuggestionCard: React.FC<{ bottleneck: Bottleneck }> = ({ bottleneck }) => {
  const severityInfo = severityMap[bottleneck.severity];
  const Icon = severityInfo.icon;
  const TypeIcon = typeIconMap[bottleneck.type] || typeIconMap['Default'];

  return (
    <div className={styles.suggestionCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleContainer}>
          <TypeIcon className={styles.typeIcon} />
          <h3 className={styles.cardTitle}>{bottleneck.title}</h3>
        </div>
        <Badge variant={severityInfo.color}>{severityInfo.label}</Badge>
      </div>
      <p className={styles.cardDescription}>{bottleneck.description}</p>
      <div className={styles.suggestionBox}>
        <Lightbulb className={styles.suggestionIcon} />
        <div>
          <h4 className={styles.suggestionTitle}>Suggested Action</h4>
          <p className={styles.suggestionText}>{bottleneck.suggestion}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <Skeleton style={{ width: '250px', height: '2rem' }} />
      <Skeleton style={{ width: '300px', height: '1.25rem' }} />
    </div>
    <div className={styles.tabsSkeleton}>
      <Skeleton style={{ width: '100px', height: '2.5rem', borderRadius: 0 }} />
      <Skeleton style={{ width: '100px', height: '2.5rem', borderRadius: 0 }} />
      <Skeleton style={{ width: '100px', height: '2.5rem', borderRadius: 0 }} />
    </div>
    <div className={styles.content}>
      <div className={styles.suggestionCard}>
        <div className={styles.cardHeader}>
          <Skeleton style={{ width: '200px', height: '1.5rem' }} />
          <Skeleton style={{ width: '80px', height: '1.5rem', borderRadius: 'var(--radius-full)' }} />
        </div>
        <Skeleton style={{ width: '90%', height: '1rem', marginTop: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '80%', height: '1rem', marginTop: 'var(--spacing-1)' }} />
        <div className={styles.suggestionBox} style={{ marginTop: 'var(--spacing-4)' }}>
          <Skeleton style={{ width: '24px', height: '24px', flexShrink: 0 }} />
          <div style={{ width: '100%' }}>
            <Skeleton style={{ width: '150px', height: '1.25rem' }} />
            <Skeleton style={{ width: '70%', height: '1rem', marginTop: 'var(--spacing-1)' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const TimetableOptimizationSuggester: React.FC<TimetableOptimizationSuggesterProps> = ({ timetableId, className }) => {
  const { data: schoolConfigData, isFetching: isFetchingConfig, error: configError } = useSchoolConfig();
  const { data: timetableData, isFetching: isFetchingTimetable, error: timetableError } = useTimetable(timetableId);

  const analysisInputs = useMemo(() => {
    if (!schoolConfigData || !timetableData) return null;
    return {
      schoolConfig: {
        ...schoolConfigData.schoolConfig,
        id: schoolConfigData.schoolConfigId,
        teachers: schoolConfigData.schoolConfig.teachers,
        studentClasses: schoolConfigData.schoolConfig.studentClasses,
      },
      timetableSlots: timetableData.slots,
    };
  }, [schoolConfigData, timetableData]);

  const bottlenecks = useMemo(() => {
    if (!analysisInputs) return [];
    const allBottlenecks = analyzeBottlenecks(analysisInputs);
    // Sort by severity: critical > warning > info
    return allBottlenecks.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [analysisInputs]);

  const isFetching = isFetchingConfig || isFetchingTimetable;
  const error = configError || timetableError;

  const filteredBottlenecks = (severities: BottleneckSeverity[]) =>
    bottlenecks.filter(b => severities.includes(b.severity));

  const criticalIssues = filteredBottlenecks(['critical']);
  const warnings = filteredBottlenecks(['warning']);
  const optimizations = filteredBottlenecks(['info']);

  if (isFetching) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.errorState} ${className || ''}`}>
        <AlertTriangle className={styles.errorIcon} />
        <h3>Error Loading Suggestions</h3>
        <p>Could not fetch data to analyze the timetable. Please try again later.</p>
        <pre className={styles.errorMessage}>{error instanceof Error ? error.message : 'An unknown error occurred'}</pre>
      </div>
    );
  }

  if (bottlenecks.length === 0) {
    return (
      <div className={`${styles.container} ${styles.emptyState} ${className || ''}`}>
        <CheckCircle className={styles.successIcon} />
        <h3>Timetable is Well-Optimized!</h3>
        <p>Our analysis found no significant bottlenecks or issues. Great job!</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>Optimization Suggestions</h2>
        <p className={styles.subtitle}>
          Based on the current timetable, here are some suggestions to improve balance and efficiency.
        </p>
      </header>

      <Tabs defaultValue="critical" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="critical" disabled={criticalIssues.length === 0}>
            Critical Issues <Badge variant="destructive">{criticalIssues.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="warnings" disabled={warnings.length === 0}>
            Warnings <Badge variant="warning">{warnings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="optimizations" disabled={optimizations.length === 0}>
            Optimizations <Badge variant="default">{optimizations.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="critical" className={styles.content}>
          {criticalIssues.map(b => <SuggestionCard key={b.id} bottleneck={b} />)}
        </TabsContent>
        <TabsContent value="warnings" className={styles.content}>
          {warnings.map(b => <SuggestionCard key={b.id} bottleneck={b} />)}
        </TabsContent>
        <TabsContent value="optimizations" className={styles.content}>
          {optimizations.map(b => <SuggestionCard key={b.id} bottleneck={b} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
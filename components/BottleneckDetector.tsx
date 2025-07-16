import React from 'react';
import { useSchoolConfig } from '../helpers/useSchoolConfig';
import { useTimetable } from '../helpers/useTimetable';
import { analyzeBottlenecks, Bottleneck } from '../helpers/bottleneckAnalyzer';
import { Skeleton } from './Skeleton';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { Badge } from './Badge';
import styles from './BottleneckDetector.module.css';

interface BottleneckDetectorProps {
  timetableId: number | undefined;
  className?: string;
}

const severityIcons: Record<Bottleneck['severity'], React.ReactNode> = {
  critical: <ShieldAlert className={`${styles.icon} ${styles.criticalIcon}`} />,
  warning: <AlertTriangle className={`${styles.icon} ${styles.warningIcon}`} />,
  info: <Info className={`${styles.icon} ${styles.infoIcon}`} />,
};

const severityBadgeVariant: Record<Bottleneck['severity'], React.ComponentProps<typeof Badge>['variant']> = {
    critical: 'destructive',
    warning: 'warning',
    info: 'default',
};

export const BottleneckDetector: React.FC<BottleneckDetectorProps> = ({ timetableId, className }) => {
  const { data: schoolConfig, isFetching: isFetchingConfig } = useSchoolConfig();
  const { data: timetable, isFetching: isFetchingTimetable } = useTimetable(timetableId);

  const isFetching = isFetchingConfig || isFetchingTimetable;

  const bottlenecks = React.useMemo(() => {
    if (!schoolConfig || !timetable) return [];
    return analyzeBottlenecks({
      schoolConfig: schoolConfig.schoolConfig as any, // Cast needed due to complex nested type
      timetableSlots: timetable.slots,
    });
  }, [schoolConfig, timetable]);

  if (isFetching) {
    return <BottleneckDetectorSkeleton className={className} />;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h2 className={styles.header}>Bottleneck Analysis</h2>
      {bottlenecks.length === 0 ? (
        <div className={styles.noBottlenecks}>
          <CheckCircle className={styles.successIcon} />
          <p className={styles.noBottlenecksTitle}>No Bottlenecks Detected</p>
          <p className={styles.noBottlenecksDescription}>The current configuration and schedule appear to be well-balanced.</p>
        </div>
      ) : (
        <ul className={styles.bottleneckList}>
          {bottlenecks.map((bottleneck) => (
            <li key={bottleneck.id} className={styles.bottleneckItem}>
              <div className={styles.itemHeader}>
                {severityIcons[bottleneck.severity]}
                <h3 className={styles.itemTitle}>{bottleneck.title}</h3>
                <Badge variant={severityBadgeVariant[bottleneck.severity]} className={styles.itemBadge}>
                  {bottleneck.severity}
                </Badge>
              </div>
              <p className={styles.itemDescription}>{bottleneck.description}</p>
              <p className={styles.itemSuggestion}>
                <strong>Suggestion:</strong> {bottleneck.suggestion}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BottleneckDetectorSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles.container} ${className || ''}`}>
    <h2 className={styles.header}>Bottleneck Analysis</h2>
    <div className={styles.bottleneckList}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonHeader}>
            <Skeleton style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-full)' }} />
            <Skeleton style={{ height: '20px', width: '60%' }} />
          </div>
          <Skeleton style={{ height: '16px', width: '90%', marginTop: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '16px', width: '80%', marginTop: 'var(--spacing-1)' }} />
        </div>
      ))}
    </div>
  </div>
);
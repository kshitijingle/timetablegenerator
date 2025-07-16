import React from 'react';
import { Bottleneck } from '../helpers/bottleneckAnalyzer';
import styles from './BottleneckHighlight.module.css';

interface BottleneckHighlightProps {
  bottlenecks: Bottleneck[];
  teacherId?: number;
  classId?: number;
  subject?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A wrapper component that visually highlights its children if they are related to a detected bottleneck.
 */
export const BottleneckHighlight: React.FC<BottleneckHighlightProps> = ({
  bottlenecks,
  teacherId,
  classId,
  subject,
  className,
  children,
}) => {
  const relevantBottleneck = React.useMemo(() => {
    return bottlenecks.find(b => {
      const related = b.related;
      if (!related) return false;
      const teacherMatch = teacherId !== undefined && related.teacherIds?.includes(teacherId);
      const classMatch = classId !== undefined && related.classIds?.includes(classId);
      const subjectMatch = subject !== undefined && related.subjects?.includes(subject);
      return teacherMatch || classMatch || subjectMatch;
    });
  }, [bottlenecks, teacherId, classId, subject]);

  if (!relevantBottleneck) {
    return <>{children}</>;
  }

  const highlightClass = styles[relevantBottleneck.severity];

  return (
    <div
      className={`${styles.highlightWrapper} ${highlightClass} ${className || ''}`}
      title={`Bottleneck: ${relevantBottleneck.title}`}
    >
      {children}
      <div className={styles.indicator} />
    </div>
  );
};
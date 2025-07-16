import React from 'react';
import { Badge } from './Badge';
import { TimetableSlotWithDetails } from '../endpoints/timetable_GET.schema';
import styles from './TimetableSlot.module.css';

interface TimetableSlotProps {
  slot: TimetableSlotWithDetails;
  editMode: boolean;
  onClick: (slot: TimetableSlotWithDetails) => void;
  onDragStart: (e: React.DragEvent, slot: TimetableSlotWithDetails) => void;
  className?: string;
}

const getSubjectColor = (subject: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' => {
  const colors: { [key: string]: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' } = {
    Math: 'default',
    Science: 'success',
    English: 'warning',
    History: 'destructive',
    Art: 'secondary',
    'P.E.': 'default',
    Lab: 'default',
  };
  return colors[subject] || 'default';
};

export const TimetableSlot = ({ slot, editMode, onClick, onDragStart, className }: TimetableSlotProps) => {
  return (
    <div
      className={`${styles.slotContent} ${editMode ? styles.editableSlot : ''} ${slot.isManualOverride ? styles.manualOverrideSlot : ''} ${className || ''}`}
      onClick={() => onClick(slot)}
      draggable={editMode}
      onDragStart={editMode ? e => onDragStart(e, slot) : undefined}
    >
      <Badge variant={getSubjectColor(slot.subject)} className={styles.subjectBadge}>
        {slot.subject}
      </Badge>
      {slot.teacherName && <div className={styles.teacherName}>{slot.teacherName}</div>}
      {slot.className && <div className={styles.className}>{slot.className}</div>}
      {slot.classroom && <div className={styles.roomName}>{slot.classroom}</div>}
      {slot.isManualOverride && (
        <Badge variant="warning" className={styles.overrideBadge}>
          Manual
        </Badge>
      )}
    </div>
  );
};
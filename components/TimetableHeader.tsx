import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { Badge } from './Badge';
import { Spinner } from './Spinner';
import { Edit } from 'lucide-react';
import { Selectable } from 'kysely';
import { Timetables } from '../helpers/schema';
import styles from './TimetableHeader.module.css';

interface TimetableHeaderProps {
  isLoadingTimetables: boolean;
  timetables: Selectable<Timetables>[] | undefined;
  selectedTimetableId: number | undefined;
  onTimetableChange: (value: string) => void;
  editMode: boolean;
  onEditModeToggle: () => void;
  isTimetableSelected: boolean;
  selectedTimetable: (Selectable<Timetables> & { slots: any[] }) | undefined;
}

const getStatusBadgeVariant = (status: string | null | undefined) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'generating':
      return 'warning';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const TimetableHeader = ({
  isLoadingTimetables,
  timetables,
  selectedTimetableId,
  onTimetableChange,
  editMode,
  onEditModeToggle,
  isTimetableSelected,
  selectedTimetable,
}: TimetableHeaderProps) => {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Weekly Timetable</h1>
        <div className={styles.controls}>
          <Button
            variant={editMode ? 'primary' : 'outline'}
            onClick={onEditModeToggle}
            disabled={!isTimetableSelected}
          >
            <Edit size={16} />
            {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </Button>
          <label htmlFor="timetable-select" className={styles.selectLabel}>
            Select Timetable:
          </label>
          {isLoadingTimetables ? (
            <Skeleton style={{ width: '250px', height: '2.5rem' }} />
          ) : (
            <Select value={selectedTimetableId?.toString() || ''} onValueChange={onTimetableChange}>
              <SelectTrigger id="timetable-select" className={styles.selectTrigger}>
                <SelectValue placeholder="Select a timetable" />
              </SelectTrigger>
              <SelectContent>
                {timetables?.map(timetable => (
                  <SelectItem key={timetable.id} value={timetable.id.toString()}>
                    <div className={styles.selectItem}>
                      <span>Timetable #{timetable.id}</span>
                      <Badge variant={getStatusBadgeVariant(timetable.generationStatus)}>
                        {timetable.generationStatus || 'Unknown'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      {selectedTimetable && (
        <div className={styles.statusInfo}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Status:</span>
            <Badge variant={getStatusBadgeVariant(selectedTimetable.generationStatus)}>
              {selectedTimetable.generationStatus === 'generating' && <Spinner size="sm" />}
              {selectedTimetable.generationStatus || 'Unknown'}
            </Badge>
          </div>
          {selectedTimetable.conflictsResolved !== null && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Conflicts Resolved:</span>
              <Badge variant="secondary">{selectedTimetable.conflictsResolved}</Badge>
            </div>
          )}
          {selectedTimetable.generationTimestamp && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Generated:</span>
              <span className={styles.statusValue}>
                {new Date(selectedTimetable.generationTimestamp).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
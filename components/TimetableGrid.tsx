import React from 'react';
import { DayOfWeek } from '../helpers/schema';
import { TimetableSlotWithDetails } from '../endpoints/timetable_GET.schema';
import { TimetableSlotContextMenu } from './TimetableSlotContextMenu';
import { TimetableSlot } from './TimetableSlot';
import { Button } from './Button';
import { Plus } from 'lucide-react';
import styles from './TimetableGrid.module.css';

interface Period {
  name: string;
  time: string;
}

interface TimetableGridProps {
  workingDays: DayOfWeek[];
  periods: Period[];
  slots: TimetableSlotWithDetails[];
  timetableId: number;
  editMode: boolean;
  swapState: {
    isActive: boolean;
    firstSlotId: number | null;
  };
  onSlotClick: (slot: TimetableSlotWithDetails) => void;
  onAddNewSlot: (day: DayOfWeek, period: number) => void;
  onSlotEdit: (slot: TimetableSlotWithDetails) => void;
  onSlotSwap: (slot: TimetableSlotWithDetails) => void;
  onDragStart: (e: React.DragEvent, slot: TimetableSlotWithDetails) => void;
  onDrop: (e: React.DragEvent, dayIndex: number, period: number) => void;
  onDragOver: (e: React.DragEvent) => void;
}

export const TimetableGrid = ({
  workingDays,
  periods,
  slots,
  timetableId,
  editMode,
  swapState,
  onSlotClick,
  onAddNewSlot,
  onSlotEdit,
  onSlotSwap,
  onDragStart,
  onDrop,
  onDragOver,
}: TimetableGridProps) => {
  const createTimetableGrid = (
    slots: TimetableSlotWithDetails[],
    workingDays: DayOfWeek[],
    totalPeriods: number,
  ) => {
    const grid: (TimetableSlotWithDetails | null)[][] = Array.from({ length: workingDays.length }, () =>
      Array(totalPeriods).fill(null),
    );

    slots.forEach(slot => {
      const dayIndex = workingDays.indexOf(slot.dayOfWeek);
      const periodIndex = slot.periodNumber - 1;
      if (dayIndex !== -1 && periodIndex >= 0 && periodIndex < totalPeriods) {
        grid[dayIndex][periodIndex] = slot;
      }
    });
    return grid;
  };

  const grid = createTimetableGrid(slots, workingDays, periods.length);

  return (
    <div className={styles.timetableGrid} style={{ gridTemplateColumns: `120px repeat(${workingDays.length}, 1fr)` }}>
      <div className={`${styles.gridCell} ${styles.headerCell}`}>Period</div>
      {workingDays.map(day => (
        <div key={day} className={`${styles.gridCell} ${styles.headerCell}`}>
          {day}
        </div>
      ))}

      {periods.map((period, periodIndex) => (
        <React.Fragment key={period.name}>
          <div className={`${styles.gridCell} ${styles.periodCell}`}>
            <div className={styles.periodName}>{period.name}</div>
            <div className={styles.periodTime}>{period.time}</div>
          </div>
          {workingDays.map((day, dayIndex) => {
            const slot = grid[dayIndex]?.[periodIndex];
            const isSelectedForSwap = swapState.isActive && swapState.firstSlotId === slot?.id;

            return (
              <div
                key={`${day}-${period.name}`}
                className={`${styles.gridCell} ${editMode ? styles.editableCell : ''} ${isSelectedForSwap ? styles.swapSelectedCell : ''}`}
                onDragOver={editMode ? onDragOver : undefined}
                onDrop={editMode ? e => onDrop(e, dayIndex, periodIndex + 1) : undefined}
              >
                {slot ? (
                  <TimetableSlotContextMenu
                    slot={slot}
                    timetableId={timetableId}
                    onEdit={onSlotEdit}
                    onStartSwap={onSlotSwap}
                    className={styles.slotContextMenu}
                  >
                    <TimetableSlot
                      slot={slot}
                      editMode={editMode}
                      onClick={() => onSlotClick(slot)}
                      onDragStart={e => onDragStart(e, slot)}
                    />
                  </TimetableSlotContextMenu>
                ) : (
                  <div className={styles.freeSlot}>
                    {editMode ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddNewSlot(day, periodIndex + 1)}
                        className={styles.addSlotButton}
                      >
                        <Plus size={16} />
                        Add
                      </Button>
                    ) : (
                      '-'
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
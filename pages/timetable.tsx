import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Skeleton } from '../components/Skeleton';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TimetableHeader } from '../components/TimetableHeader';
import { TimetableWorkloadStats } from '../components/TimetableWorkloadStats';
import { TimetableGrid } from '../components/TimetableGrid';
import { TimetableSlotEditor } from '../components/TimetableSlotEditor';
import { TimetableManualControls } from '../components/TimetableManualControls';
import { Spinner } from '../components/Spinner';
import { BottleneckDetector } from '../components/BottleneckDetector';
import { BottleneckHighlight } from '../components/BottleneckHighlight';
import { useSchoolConfig } from '../helpers/useSchoolConfig';
import { useTimetables } from '../helpers/useTimetables';
import { useTimetable } from '../helpers/useTimetable';
import { useCreateTimetableSlot, useSwapTimetableSlots } from '../helpers/useTimetableMutation';
import { useAnalyzeBottlenecks } from '../helpers/useAnalyzeBottlenecks';
import { TimetableSlotWithDetails } from '../endpoints/timetable_GET.schema';
import { DayOfWeek } from '../helpers/schema';
import { Selectable } from "kysely";
import { Teachers, StudentClasses } from "../helpers/schema";
import { toast } from 'sonner';
import styles from './timetable.module.css';
import { Bottleneck } from '../helpers/bottleneckAnalyzer';

interface HistoryEntry {
  type: 'create' | 'update' | 'delete' | 'swap';
  data: any;
  timestamp: number;
}

const TimetablePage = () => {
  const [selectedTimetableId, setSelectedTimetableId] = useState<number | undefined>();
  const [editMode, setEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlotWithDetails | null>(null);
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState(false);
  const [swapMode, setSwapMode] = useState<{
    isActive: boolean;
    firstSlot: TimetableSlotWithDetails | null;
  }>({ isActive: false, firstSlot: null });
  const [draggedSlot, setDraggedSlot] = useState<TimetableSlotWithDetails | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);

  const { data: schoolConfig, isFetching: isLoadingConfig } = useSchoolConfig();
  const { data: timetables, isFetching: isLoadingTimetables } = useTimetables(schoolConfig?.schoolConfigId);
  const { data: selectedTimetable, isFetching: isLoadingTimetable } = useTimetable(selectedTimetableId);
  const { mutate: createSlot, isLoading: isCreatingSlot } = useCreateTimetableSlot(selectedTimetableId || 0);
  const { mutate: swapSlots, isLoading: isSwappingSlots } = useSwapTimetableSlots(selectedTimetableId || 0);
  const { mutate: analyzeBottlenecks, isPending: isAnalyzingBottlenecks } = useAnalyzeBottlenecks({
    onSuccess: (data) => {
      setBottlenecks(data);
    },
    onError: (error) => {
      console.error('Failed to analyze bottlenecks:', error);
      setBottlenecks([]);
    },
  });

  // Mock data for teachers and classes - in a real app, these would come from API
  const allTeachers: Selectable<Teachers>[] = selectedTimetable?.slots.reduce((acc, slot) => {
    if (slot.teacherId && slot.teacherName && !acc.find(t => t.id === slot.teacherId)) {
      acc.push({
        id: slot.teacherId,
        name: slot.teacherName,
        subjects: [slot.subject],
        maxHoursPerDay: 8,
        schoolConfigId: schoolConfig?.schoolConfigId || null,
        preferredDays: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return acc;
  }, [] as Selectable<Teachers>[]) || [];

  const allClasses: Selectable<StudentClasses>[] = selectedTimetable?.slots.reduce((acc, slot) => {
    if (slot.classId && slot.className && !acc.find(c => c.id === slot.classId)) {
      acc.push({
        id: slot.classId,
        name: slot.className,
        schoolConfigId: schoolConfig?.schoolConfigId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return acc;
  }, [] as Selectable<StudentClasses>[]) || [];

  // Construct schoolConfig with proper shape for TimetableWorkloadStats
  const enrichedSchoolConfig = React.useMemo(() => {
    if (!schoolConfig?.schoolConfig) return undefined;
    
    const baseConfig = {
      id: schoolConfig.schoolConfigId,
      name: 'School Timetable',
      startTime: schoolConfig.schoolConfig.schoolParameters.startTime,
      endTime: schoolConfig.schoolConfig.schoolParameters.endTime,
      periodDuration: schoolConfig.schoolConfig.schoolParameters.periodDuration,
      totalPeriods: schoolConfig.schoolConfig.schoolParameters.periodsPerDay,
      totalClassrooms: schoolConfig.schoolConfig.schoolParameters.classrooms,
      workingDays: schoolConfig.schoolConfig.schoolParameters.workingDays,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return {
      ...baseConfig,
      teachers: allTeachers,
      studentClasses: allClasses.map(cls => ({
        ...cls,
        subjects: [], // Would need to be populated from actual data
      })),
    };
  }, [schoolConfig, allTeachers, allClasses]);

  // Set the first available timetable as default
  React.useEffect(() => {
    if (timetables && timetables.length > 0 && !selectedTimetableId) {
      setSelectedTimetableId(timetables[0].id);
    }
  }, [timetables, selectedTimetableId]);

  // Analyze bottlenecks when timetable changes
  React.useEffect(() => {
    if (selectedTimetableId && selectedTimetable) {
      analyzeBottlenecks({ timetableId: selectedTimetableId });
    }
  }, [selectedTimetableId, selectedTimetable, analyzeBottlenecks]);

  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex >= 0) {
      setHistoryIndex(prev => prev - 1);
      toast.info('Action undone');
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      toast.info('Action redone');
    }
  }, [historyIndex, history.length]);

  const handleSlotEdit = useCallback((slot: TimetableSlotWithDetails) => {
    setSelectedSlot(slot);
    setIsSlotEditorOpen(true);
  }, []);

  const handleSlotSwap = useCallback((slot: TimetableSlotWithDetails) => {
    if (swapMode.isActive && swapMode.firstSlot) {
      if (swapMode.firstSlot.id === slot.id) {
        // Cancel swap if clicking the same slot
        setSwapMode({ isActive: false, firstSlot: null });
        toast.info('Swap cancelled');
        return;
      }

      // Check for conflicts before swapping
      const hasConflict = validateSlotSwap(swapMode.firstSlot, slot);
      if (hasConflict) {
        toast.error('Cannot swap: This would create a scheduling conflict');
        return;
      }

      swapSlots(
        { slotId1: swapMode.firstSlot.id, slotId2: slot.id },
        {
          onSuccess: () => {
            addToHistory({
              type: 'swap',
              data: { slot1: swapMode.firstSlot, slot2: slot },
              timestamp: Date.now(),
            });
            setSwapMode({ isActive: false, firstSlot: null });
            toast.success('Slots swapped successfully');
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to swap slots');
          },
        }
      );
    } else {
      setSwapMode({ isActive: true, firstSlot: slot });
      toast.info('Select another slot to swap with');
    }
  }, [swapMode, swapSlots, addToHistory]);

  const handleAddNewSlot = useCallback((day?: DayOfWeek, period?: number) => {
    if (!selectedTimetableId) return;
    
    const workingDays = schoolConfig?.schoolConfig.schoolParameters.workingDays || [];
    const totalPeriods = schoolConfig?.schoolConfig.schoolParameters.periodsPerDay || 0;
    
    // Use provided day/period or find the first available slot
    let targetDay = day;
    let targetPeriod = period;
    
    if (!targetDay || !targetPeriod) {
      for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex++) {
        for (let periodNum = 1; periodNum <= totalPeriods; periodNum++) {
          const existingSlot = selectedTimetable?.slots.find(
            slot => slot.dayOfWeek === workingDays[dayIndex] && slot.periodNumber === periodNum
          );
          
          if (!existingSlot) {
            targetDay = workingDays[dayIndex];
            targetPeriod = periodNum;
            break;
          }
        }
        if (targetDay && targetPeriod) break;
      }
    }
    
    if (!targetDay || !targetPeriod) {
      toast.warning('No available slots found');
      return;
    }
    
    const newSlot = {
      timetableId: selectedTimetableId,
      dayOfWeek: targetDay,
      periodNumber: targetPeriod,
      subject: 'New Subject',
      teacherId: allTeachers[0]?.id || 1,
      classId: allClasses[0]?.id || 1,
      classroom: null,
    };
    
    createSlot(newSlot, {
      onSuccess: (createdSlot) => {
        addToHistory({
          type: 'create',
          data: createdSlot,
          timestamp: Date.now(),
        });
        setSelectedSlot(createdSlot);
        setIsSlotEditorOpen(true);
        toast.success('New slot created');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create slot');
      },
    });
  }, [selectedTimetableId, schoolConfig, selectedTimetable, allTeachers, allClasses, createSlot, addToHistory]);

  const validateSlotSwap = (slot1: TimetableSlotWithDetails, slot2: TimetableSlotWithDetails): boolean => {
    // Check for teacher conflicts
    const otherSlot1 = selectedTimetable?.slots.find(
      s => s.dayOfWeek === slot2.dayOfWeek && 
           s.periodNumber === slot2.periodNumber && 
           s.teacherId === slot1.teacherId &&
           s.id !== slot2.id
    );
    
    const otherSlot2 = selectedTimetable?.slots.find(
      s => s.dayOfWeek === slot1.dayOfWeek && 
           s.periodNumber === slot1.periodNumber && 
           s.teacherId === slot2.teacherId &&
           s.id !== slot1.id
    );
    
    return !!(otherSlot1 || otherSlot2);
  };

  const handleSlotClick = useCallback((slot: TimetableSlotWithDetails) => {
    if (!editMode) return;
    
    if (swapMode.isActive) {
      handleSlotSwap(slot);
    } else {
      handleSlotEdit(slot);
    }
  }, [editMode, swapMode.isActive, handleSlotSwap, handleSlotEdit]);

  const handleDragStart = useCallback((e: React.DragEvent, slot: TimetableSlotWithDetails) => {
    if (!editMode) return;
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
  }, [editMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDayIndex: number, targetPeriod: number) => {
    e.preventDefault();
    
    if (!draggedSlot || !editMode) return;
    
    const workingDays = schoolConfig?.schoolConfig.schoolParameters.workingDays || [];
    const targetDay = workingDays[targetDayIndex];
    
    if (!targetDay) return;
    
    // Check if target position is occupied
    const targetSlot = selectedTimetable?.slots.find(
      s => s.dayOfWeek === targetDay && s.periodNumber === targetPeriod
    );
    
    if (targetSlot && targetSlot.id !== draggedSlot.id) {
      // Swap with existing slot
      handleSlotSwap(targetSlot);
    } else if (!targetSlot) {
      // Move to empty slot - this would require an update endpoint
      toast.info('Moving to empty slots is not implemented yet');
    }
    
    setDraggedSlot(null);
  }, [draggedSlot, editMode, schoolConfig, selectedTimetable, handleSlotSwap]);

  const handleTimetableChange = useCallback((value: string) => {
    setSelectedTimetableId(Number(value));
  }, []);

  const handleEditModeToggle = useCallback(() => {
    setEditMode(!editMode);
    if (swapMode.isActive) {
      setSwapMode({ isActive: false, firstSlot: null });
    }
  }, [editMode, swapMode.isActive]);

  // Generate period labels
  const generatePeriods = (totalPeriods: number, startTime: string, periodDuration: number) => {
    const periods = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    for (let i = 0; i < totalPeriods; i++) {
      const periodStart = new Date();
      periodStart.setHours(startHour, startMinute + (i * periodDuration), 0, 0);
      
      const periodEnd = new Date();
      periodEnd.setHours(startHour, startMinute + ((i + 1) * periodDuration), 0, 0);
      
      periods.push({
        name: `Period ${i + 1}`,
        time: `${periodStart.toTimeString().slice(0, 5)} - ${periodEnd.toTimeString().slice(0, 5)}`
      });
    }
    
    return periods;
  };

  if (isLoadingConfig) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton style={{ width: '200px', height: '2rem' }} />
          <Skeleton style={{ width: '150px', height: '2.5rem' }} />
        </div>
        <div className={styles.timetableWrapper}>
          <Skeleton style={{ width: '100%', height: '400px' }} />
        </div>
      </div>
    );
  }

  if (!schoolConfig) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>No Configuration Found</h1>
        </header>
        <p>Please set up your school configuration first.</p>
      </div>
    );
  }

  const workingDays = schoolConfig.schoolConfig.schoolParameters.workingDays;
  const totalPeriods = schoolConfig.schoolConfig.schoolParameters.periodsPerDay;
  const periods = generatePeriods(
    totalPeriods,
    schoolConfig.schoolConfig.schoolParameters.startTime,
    schoolConfig.schoolConfig.schoolParameters.periodDuration
  );

  return (
    <>
      <Helmet>
        <title>Weekly Timetable - Smart Timetable Generator</title>
        <meta name="description" content="View and edit the generated weekly timetable for different classes." />
      </Helmet>
      <div className={styles.container}>
        <TimetableHeader
          isLoadingTimetables={isLoadingTimetables}
          timetables={timetables}
          selectedTimetableId={selectedTimetableId}
          onTimetableChange={handleTimetableChange}
          editMode={editMode}
          onEditModeToggle={handleEditModeToggle}
          isTimetableSelected={!!selectedTimetable}
          selectedTimetable={selectedTimetable}
        />

        {editMode && selectedTimetableId && (
          <div className={styles.manualControlsWrapper}>
            <TimetableManualControls
              onAddNewSlot={() => handleAddNewSlot()}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex >= 0}
              canRedo={historyIndex < history.length - 1}
            />
            {swapMode.isActive && (
              <div className={styles.swapModeIndicator}>
                <Badge variant="warning">
                  Swap Mode: Select another slot to swap with "{swapMode.firstSlot?.subject}"
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSwapMode({ isActive: false, firstSlot: null })}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {selectedTimetable && (
          <TimetableWorkloadStats
            slots={selectedTimetable.slots}
            workingDays={workingDays}
            totalPeriods={totalPeriods}
            schoolConfig={enrichedSchoolConfig}
          />
        )}

        {selectedTimetableId && (
          <BottleneckDetector
            timetableId={selectedTimetableId}
            className={styles.bottleneckSection}
          />
        )}

        <div className={styles.timetableWrapper}>
          {isLoadingTimetable ? (
            <div className={styles.loadingState}>
              <Spinner size="lg" />
              <p>Loading timetable...</p>
            </div>
          ) : selectedTimetable ? (
            <TimetableGrid
              workingDays={workingDays}
              periods={periods}
              slots={selectedTimetable.slots}
              timetableId={selectedTimetableId!}
              editMode={editMode}
              swapState={{
                isActive: swapMode.isActive,
                firstSlotId: swapMode.firstSlot?.id || null,
              }}
              onSlotClick={handleSlotClick}
              onAddNewSlot={handleAddNewSlot}
              onSlotEdit={handleSlotEdit}
              onSlotSwap={handleSlotSwap}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              bottlenecks={bottlenecks}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>No timetables available. Please generate a timetable first.</p>
            </div>
          )}
        </div>

        {/* Slot Editor Dialog */}
        {selectedTimetableId && (
          <TimetableSlotEditor
            slot={selectedSlot}
            timetableId={selectedTimetableId}
            isOpen={isSlotEditorOpen}
            onOpenChange={setIsSlotEditorOpen}
            allTeachers={allTeachers}
            allClasses={allClasses}
          />
        )}
      </div>
    </>
  );
};

export default TimetablePage;
import React from "react";
import { Button } from "./Button";
import { Undo, Redo, PlusCircle } from "lucide-react";
import styles from "./TimetableManualControls.module.css";

interface TimetableManualControlsProps {
  onAddNewSlot: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
}

export const TimetableManualControls = ({
  onAddNewSlot,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  className,
}: TimetableManualControlsProps) => {
  return (
    <div className={`${styles.controlsContainer} ${className || ""}`}>
      <Button variant="outline" onClick={onAddNewSlot}>
        <PlusCircle size={16} />
        Add New Slot
      </Button>
      <div className={styles.historyControls}>
        <Button
          variant="ghost"
          size="icon-md"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <Undo size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon-md"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          <Redo size={18} />
        </Button>
      </div>
    </div>
  );
};
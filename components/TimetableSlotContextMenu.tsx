import React from "react";
import { Edit, Trash2, Replace } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ContextMenu";
import { TimetableSlotWithDetails } from "../endpoints/timetable_GET.schema";
import { useDeleteTimetableSlot } from "../helpers/useTimetableMutation";
import styles from "./TimetableSlotContextMenu.module.css";

interface TimetableSlotContextMenuProps {
  children: React.ReactNode;
  slot: TimetableSlotWithDetails;
  timetableId: number;
  onEdit: (slot: TimetableSlotWithDetails) => void;
  onStartSwap: (slot: TimetableSlotWithDetails) => void;
  className?: string;
}

export const TimetableSlotContextMenu = ({
  children,
  slot,
  timetableId,
  onEdit,
  onStartSwap,
  className,
}: TimetableSlotContextMenuProps) => {
  const { mutate: deleteSlot, isLoading: isDeleting } =
    useDeleteTimetableSlot(timetableId);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this slot?")) {
      deleteSlot({ slotId: slot.id });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={className}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className={styles.contextMenuContent}>
        <ContextMenuItem onSelect={() => onEdit(slot)}>
          <Edit className={styles.menuIcon} />
          <span>Edit Slot</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onStartSwap(slot)}>
          <Replace className={styles.menuIcon} />
          <span>Swap Slot</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={handleDelete}
          disabled={isDeleting}
          className={styles.destructiveItem}
        >
          <Trash2 className={styles.menuIcon} />
          <span>{isDeleting ? "Deleting..." : "Delete Slot"}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";

import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Spinner } from "./Spinner";
import {
  postExportTimetable,
  ExportView,
} from "../endpoints/export-timetable_POST.schema";
import { exportTimetable } from "../helpers/timetableExporter";
import { useSchoolConfig } from "../helpers/useSchoolConfig";
import styles from "./TimetableExportControls.module.css";

interface TimetableExportControlsProps {
  timetableId: number;
  className?: string;
}

export const TimetableExportControls: React.FC<TimetableExportControlsProps> = ({
  timetableId,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: schoolConfig, isLoading: isConfigLoading } = useSchoolConfig();

  const exportMutation = useMutation({
    mutationFn: (variables: { view: ExportView; type: "pdf" | "excel" }) =>
      postExportTimetable({ timetableId, view: variables.view }),
    onSuccess: (data, variables) => {
      if (!schoolConfig) {
        toast.error("School configuration not loaded. Cannot export.");
        return;
      }
      toast.success(`Generating ${variables.type.toUpperCase()} file...`);
      exportTimetable({
        type: variables.type,
        view: variables.view,
        data,
        schoolConfig: schoolConfig.schoolConfig,
      });
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const handleExport = (view: ExportView, type: "pdf" | "excel") => {
    exportMutation.mutate({ view, type });
  };

  const isLoading = exportMutation.isPending || isConfigLoading;

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={isLoading}
          aria-label="Export timetable"
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <Download className={styles.icon} />
          )}
          Export
          <ChevronDown
            className={`${styles.chevron} ${isMenuOpen ? styles.chevronOpen : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={styles.dropdownContent}>
        <DropdownMenuLabel>Export as PDF</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleExport("class-view", "pdf")}>
            <FileText className={styles.menuIcon} />
            Class View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("teacher-view", "pdf")}>
            <FileText className={styles.menuIcon} />
            Teacher View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("full-view", "pdf")}>
            <FileText className={styles.menuIcon} />
            Full Timetable
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export as Excel</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleExport("class-view", "excel")}>
            <FileSpreadsheet className={styles.menuIcon} />
            Class View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("teacher-view", "excel")}
          >
            <FileSpreadsheet className={styles.menuIcon} />
            Teacher View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("full-view", "excel")}>
            <FileSpreadsheet className={styles.menuIcon} />
            Full Timetable
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
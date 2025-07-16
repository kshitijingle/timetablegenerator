import { OutputType as TimetableExportData } from "../endpoints/export-timetable_POST.schema";
import { SchoolConfig } from "../helpers/schema";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ExportType = "excel" | "pdf";
type ExportView = "class-view" | "teacher-view" | "full-view";

interface ExportOptions {
  type: ExportType;
  view: ExportView;
  data: TimetableExportData;
  schoolConfig: SchoolConfig;
}

const getFilename = (view: ExportView, extension: "xlsx" | "pdf"): string => {
  const date = new Date().toISOString().split("T")[0];
  return `timetable-${view}-${date}.${extension}`;
};

const generateExcel = (
  view: ExportView,
  data: TimetableExportData,
  schoolConfig: SchoolConfig
) => {
  const wb = XLSX.utils.book_new();

  const periods = Array.from(
    { length: schoolConfig.totalPeriods },
    (_, i) => `P${i + 1}`
  );
  const headers = ["Name", "Total Hours", ...periods];

  if (view === "class-view" && "classes" in data) {
    const wsData = data.classes.map((c) => {
      const row: { [key: string]: string | number } = {
        Name: c.className,
        "Total Hours": c.totalHours,
      };
      c.schedule.forEach((slot) => {
        row[`P${slot.periodNumber}`] = `${slot.teacherName} - ${slot.subject}`;
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(wsData, { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, "Class View");
  }

  if (view === "teacher-view" && "teachers" in data) {
    const wsData = data.teachers.map((t) => {
      const row: { [key: string]: string | number } = {
        Name: t.teacherName,
        "Total Hours": t.totalHours,
      };
      t.schedule.forEach((slot) => {
        row[`P${slot.periodNumber}`] = `${slot.className} - ${slot.subject}`;
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(wsData, { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, "Teacher View");
  }

  if (view === "full-view" && "slots" in data) {
    const wsData = data.slots.map((slot) => ({
      Day: slot.dayOfWeek,
      Period: slot.periodNumber,
      Class: slot.className,
      Teacher: slot.teacherName,
      Subject: slot.subject,
      Classroom: slot.classroom,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Full Timetable");
  }

  XLSX.writeFile(wb, getFilename(view, "xlsx"));
};

const generatePdf = (
  view: ExportView,
  data: TimetableExportData,
  schoolConfig: SchoolConfig
) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const title = `${schoolConfig.name} - Timetable (${view})`;
  doc.text(title, 14, 15);

  const periods = Array.from(
    { length: schoolConfig.totalPeriods },
    (_, i) => `P${i + 1}`
  );

  if (view === "class-view" && "classes" in data) {
    autoTable(doc, {
      startY: 20,
      head: [["Class", "Total Hours", ...periods]],
      body: data.classes.map((c) => {
        const row: (string | number)[] = [c.className, c.totalHours];
        const periodMap = new Map(
          c.schedule.map((s) => [
            s.periodNumber,
            `${s.teacherName}\n${s.subject}`,
          ])
        );
        for (let i = 1; i <= schoolConfig.totalPeriods; i++) {
          row.push(periodMap.get(i) || "");
        }
        return row;
      }),
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  if (view === "teacher-view" && "teachers" in data) {
    autoTable(doc, {
      startY: 20,
      head: [["Teacher", "Total Hours", ...periods]],
      body: data.teachers.map((t) => {
        const row: (string | number)[] = [t.teacherName, t.totalHours];
        const periodMap = new Map(
          t.schedule.map((s) => [
            s.periodNumber,
            `${s.className}\n${s.subject}`,
          ])
        );
        for (let i = 1; i <= schoolConfig.totalPeriods; i++) {
          row.push(periodMap.get(i) || "");
        }
        return row;
      }),
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  if (view === "full-view" && "slots" in data) {
    autoTable(doc, {
      startY: 20,
      head: [["Day", "Period", "Class", "Teacher", "Subject", "Classroom"]],
      body: data.slots.map((s) => [
        s.dayOfWeek,
        s.periodNumber,
        s.className || "N/A",
        s.teacherName || "N/A",
        s.subject,
        s.classroom || "N/A",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  doc.save(getFilename(view, "pdf"));
};

export const exportTimetable = (options: ExportOptions) => {
  const { type, view, data, schoolConfig } = options;

  if (type === "excel") {
    generateExcel(view, data, schoolConfig);
  } else if (type === "pdf") {
    generatePdf(view, data, schoolConfig);
  }
};
export const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const periods = [
  { name: "Period 1", time: "08:00 - 08:45" },
  { name: "Period 2", time: "08:45 - 09:30" },
  { name: "Period 3", time: "09:30 - 10:15" },
  { name: "Break", time: "10:15 - 10:30" },
  { name: "Period 4", time: "10:30 - 11:15" },
  { name: "Period 5", time: "11:15 - 12:00" },
  { name: "Lunch", time: "12:00 - 13:00" },
  { name: "Period 6", time: "13:00 - 13:45" },
  { name: "Period 7", time: "13:45 - 14:30" },
  { name: "Period 8", time: "14:30 - 15:15" },
];

const grade6A = [
  // Monday
  [
    { subject: "Math", teacher: "Mr. Doe", room: "C101" },
    { subject: "English", teacher: "Ms. Smith", room: "C101" },
    { subject: "Science", teacher: "Mr. Doe", room: "Lab 1" },
    null, // Break
    { subject: "History", teacher: "Ms. Jones", room: "C101" },
    { subject: "P.E.", teacher: "Mr. Davis", room: "Gym" },
    null, // Lunch
    { subject: "Art", teacher: "Ms. White", room: "Art Room" },
    null,
    null,
  ],
  // Tuesday
  [
    { subject: "English", teacher: "Ms. Smith", room: "C101" },
    { subject: "Math", teacher: "Mr. Doe", room: "C101" },
    { subject: "History", teacher: "Ms. Jones", room: "C101" },
    null,
    { subject: "Science", teacher: "Mr. Doe", room: "Lab 1" },
    null,
    null,
    { subject: "P.E.", teacher: "Mr. Davis", room: "Gym" },
    { subject: "Math", teacher: "Mr. Doe", room: "C101" },
    null,
  ],
  // Wednesday
  [
    { subject: "Science", teacher: "Mr. Doe", room: "Lab 1" },
    { subject: "History", teacher: "Ms. Jones", room: "C101" },
    { subject: "English", teacher: "Ms. Smith", room: "C101" },
    null,
    { subject: "Math", teacher: "Mr. Doe", room: "C101" },
    { subject: "Art", teacher: "Ms. White", room: "Art Room" },
    null,
    null,
    null,
    null,
  ],
  // Thursday
  [
    { subject: "P.E.", teacher: "Mr. Davis", room: "Gym" },
    { subject: "Math", teacher: "Mr. Doe", room: "C101" },
    { subject: "English", teacher: "Ms. Smith", room: "C101" },
    null,
    null,
    { subject: "Science", teacher: "Mr. Doe", room: "Lab 1" },
    null,
    { subject: "History", teacher: "Ms. Jones", room: "C101" },
    { subject: "English", teacher: "Ms. Smith", room: "C101" },
    null,
  ],
  // Friday
  [
    { subject: "History", teacher: "Ms. Jones", room: "C101" },
    null,
    { subject: "Math", teacher: "Mr. Doe", room: "C101" },
    null,
    { subject: "English", teacher: "Ms. Smith", room: "C101" },
    { subject: "P.E.", teacher: "Mr. Davis", room: "Gym" },
    null,
    { subject: "Art", teacher: "Ms. White", room: "Art Room" },
    null,
    null,
  ],
];

const grade7B = [
    // Monday
    [
      { subject: "History", teacher: "Ms. Jones", room: "C202" },
      { subject: "Science", teacher: "Mr. Doe", room: "Lab 2" },
      { subject: "Math", teacher: "Mr. Doe", room: "C202" },
      null,
      { subject: "English", teacher: "Ms. Smith", room: "C202" },
      null,
      null,
      { subject: "P.E.", teacher: "Mr. Davis", room: "Gym" },
      { subject: "Art", teacher: "Ms. White", room: "Art Room" },
      null,
    ],
    // ... other days for 7B
    ...Array(4).fill(grade6A[0]) // Placeholder data
];

export const sampleTimetableData = {
  "Grade 6A": grade6A,
  "Grade 7B": grade7B,
};
# Intelligent School Scheduling System
        
Smart School Timetable Generator — Dynamic Teacher-Classroom Scheduling

Build an app that automates the creation of school timetables by intelligently assigning teachers to classrooms based on a wide range of constraints. The app should generate weekly schedules that optimize teaching hours, avoid conflicts, and ensure fair distribution of workload.

Inputs:
School Parameters:
* Working days (e.g., Monday to Friday)
* Start and end time of the school day (e.g., 8:00 AM to 3:00 PM)
* Duration of each class period (e.g., 45 minutes)
* Total number of periods per day
* Number of classrooms available
* Teacher Profiles:
  * Name
  * Subjects they can teach (e.g., Math, Science, English)
  * Maximum teaching hours per day
  * Preferred days (optional)
  * Availability constraints (e.g., not available in period 1 on Wednesdays)
* Class Data:
  * List of student classes (e.g., Grade 6A, 6B, 7A)
  * Subjects required for each class
  * Weekly frequency for each subject (e.g., Math = 5 times/week)
* Special Constraints:
  * No teacher should have back-to-back classes more than 3 times in a day (customizable)
  * At least 1 free period per day for each teacher
  * Certain subjects (e.g., lab sessions) require specific rooms
  * Subjects should not repeat twice in a day for the same class
  * Teachers teaching multiple subjects should not be double-booked

Core Features:
* Generate dynamic weekly timetables
* Auto-resolve conflicts in teacher/classroom allocation
* Optimize for balanced workload across all teachers
* Display results in a user-friendly calendar/table format
* Allow manual overrides after initial auto-generation
* Export to Excel/PDF

Advanced Options:
* Detect and highlight scheduling bottlenecks (e.g., too few teachers for a subject)
* Suggest optimal changes in subject frequencies or teacher loads
* Optionally allow co-teaching (two teachers in one period)

Built with Combini.

TO DOS:
1. Build a Conflict Resolution System > Identify potential scheduling conflicts and prevent them beforehand without requiring human intervention.
2. Implement Co-Teaching - the option is present but it doesn't work. Plans to update it in future.

# How to use

1. Import CombiniSetup.css to set up the css variables and basic styles.
2. Import the components into your react codebase.

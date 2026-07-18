# Requirements Document

## Introduction

This feature replaces the static green dot on employee profile cards in the owner's Employee Directory page with a dynamic clock-in status indicator. The dot will reflect each employee's real attendance data for today: green when the employee has clocked in (regardless of late/half-day status), and red when the employee has not clocked in or is absent.

The backend already exposes `GET /api/attendance/overview`, which returns today's attendance data for all company employees including their `check_in_time`. The frontend needs to call this endpoint and use the result to colour the status dot on each card.

## Glossary

- **Employee_Directory_Page**: The owner-facing page at `/owner/employees` that renders a grid of employee profile cards.
- **Attendance_Overview_API**: The existing backend endpoint `GET /api/attendance/overview` that returns today's attendance records for all employees in the owner's company.
- **Clock_Status_Dot**: The small circular indicator displayed at the bottom-right of an employee avatar on the Employee Directory page.
- **Clocked_In**: An employee who has a non-null `check_in_time` value in today's attendance record, regardless of status (present, late, or half_day).
- **Not_Clocked_In**: An employee who has a null `check_in_time` or has no attendance record for today.
- **Status_Map**: An in-memory mapping from employee `user_id` to a boolean `isClockedIn` value, derived from the Attendance_Overview_API response.

---

## Requirements

### Requirement 1: Fetch Today's Clock-In Status on Page Load

**User Story:** As an owner, I want the employee directory to load today's real attendance data automatically, so that I can see which employees are clocked in without navigating to the attendance page.

#### Acceptance Criteria

1. WHEN the Employee_Directory_Page mounts, THE Employee_Directory_Page SHALL fetch data from the Attendance_Overview_API concurrently with the existing employee list fetch.
2. WHEN the Attendance_Overview_API responds successfully, THE Employee_Directory_Page SHALL build a Status_Map keyed by employee `user_id` containing a boolean `isClockedIn` value for each employee.
3. WHEN an employee record in the Attendance_Overview_API response has a non-null `check_in_time`, THE Employee_Directory_Page SHALL set `isClockedIn` to `true` for that employee in the Status_Map.
4. WHEN an employee record in the Attendance_Overview_API response has a null `check_in_time`, THE Employee_Directory_Page SHALL set `isClockedIn` to `false` for that employee in the Status_Map.
5. IF the Attendance_Overview_API request fails or returns a non-successful HTTP status, THEN THE Employee_Directory_Page SHALL continue rendering employee cards and SHALL default all Clock_Status_Dots to the red (not clocked in) state without displaying an error to the user.

---

### Requirement 2: Display Dynamic Clock Status Dot on Employee Cards

**User Story:** As an owner, I want each employee card to show a coloured dot that reflects whether the employee has clocked in today, so that I can quickly assess attendance at a glance.

#### Acceptance Criteria

1. THE Employee_Directory_Page SHALL render a Clock_Status_Dot on every employee card at the bottom-right position of the employee avatar.
2. WHEN `isClockedIn` is `true` for an employee, THE Employee_Directory_Page SHALL render the Clock_Status_Dot with a green colour (Tailwind class `bg-green-500`).
3. WHEN `isClockedIn` is `false` for an employee, THE Employee_Directory_Page SHALL render the Clock_Status_Dot with a red colour (Tailwind class `bg-red-500`).
4. WHEN the attendance data is still loading, THE Employee_Directory_Page SHALL render the Clock_Status_Dot with a neutral/muted colour (Tailwind class `bg-muted`) as a loading placeholder.
5. THE Clock_Status_Dot SHALL display a tooltip with the text "Clocked in today" when `isClockedIn` is `true`.
6. THE Clock_Status_Dot SHALL display a tooltip with the text "Not clocked in" when `isClockedIn` is `false`.

---

### Requirement 3: Refresh Attendance Status

**User Story:** As an owner, I want the clock-in status to refresh when I manually reload the employee list, so that the dots stay current throughout my session.

#### Acceptance Criteria

1. WHEN the owner triggers a manual refresh of the employee directory (via the "Refresh Directory" empty-state button or any retry action), THE Employee_Directory_Page SHALL re-fetch data from the Attendance_Overview_API and rebuild the Status_Map.
2. WHEN the Status_Map is updated after a refresh, THE Employee_Directory_Page SHALL re-render Clock_Status_Dots to reflect the new attendance data.
3. IF the Attendance_Overview_API request fails or times out during a manual refresh, THEN THE Employee_Directory_Page SHALL silently retain the existing Status_Map without displaying an error to the user.

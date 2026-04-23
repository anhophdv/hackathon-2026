// Hourly staffing plan & throughput model.
// Used to detect labor gaps vs forecast demand and recommend redeployments.

export type Role = "Manager" | "Shift Lead" | "Make Line" | "Oven" | "Driver" | "Front";

export type Shift = {
  id: string;
  name: string;
  role: Role;
  start: number; // hour 0..23
  end: number;
};

// Default plan for an "average" weekday
export const SHIFTS: Shift[] = [
  { id: "s1", name: "Mike (Mgr)", role: "Manager", start: 10, end: 22 },
  { id: "s2", name: "Aisha", role: "Shift Lead", start: 11, end: 20 },
  { id: "s3", name: "Tom", role: "Shift Lead", start: 16, end: 23 },
  { id: "s4", name: "Sam", role: "Make Line", start: 11, end: 19 },
  { id: "s5", name: "Priya", role: "Make Line", start: 16, end: 23 },
  { id: "s6", name: "Jay", role: "Make Line", start: 17, end: 22 },
  { id: "s7", name: "Liam", role: "Oven", start: 11, end: 20 },
  { id: "s8", name: "Noah", role: "Oven", start: 17, end: 23 },
  { id: "s9", name: "Ben", role: "Driver", start: 17, end: 23 },
  { id: "s10", name: "Hugo", role: "Driver", start: 18, end: 23 },
  { id: "s11", name: "Ella", role: "Front", start: 11, end: 19 },
  { id: "s12", name: "Maya", role: "Front", start: 17, end: 22 },
];

// Pizzas per make-line staff per hour (peak throughput)
export const MAKE_LINE_THROUGHPUT = 22;
// Orders per driver per hour (round-trip)
export const DRIVER_THROUGHPUT = 3.0;

export function staffByHour(role: Role, hour: number, shifts = SHIFTS) {
  return shifts.filter(
    (s) => s.role === role && s.start <= hour && hour < s.end,
  ).length;
}

export function pizzaCapacityByHour(hour: number, shifts = SHIFTS) {
  return staffByHour("Make Line", hour, shifts) * MAKE_LINE_THROUGHPUT;
}

export function deliveryCapacityByHour(hour: number, shifts = SHIFTS) {
  return staffByHour("Driver", hour, shifts) * DRIVER_THROUGHPUT;
}

export function totalLaborHours(shifts = SHIFTS) {
  return shifts.reduce((s, sh) => s + (sh.end - sh.start), 0);
}

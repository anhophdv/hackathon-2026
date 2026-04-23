export const PH = {
  red: "#EE3124",
  redDark: "#C8221A",
  yellow: "#FFCE00",
  black: "#0F0F10",
  ink: "#1A1A1D",
  surface: "#F7F5F2",
  card: "#FFFFFF",
  muted: "#6B6B70",
  line: "#E6E3DE",
  green: "#2E7D32",
  amber: "#F59E0B",
} as const;

export const CHART = {
  actual: PH.black,
  predicted: PH.red,
  band: "#FCC8C2",
  grid: PH.line,
  axis: PH.muted,
  good: PH.green,
  warn: PH.amber,
  bad: PH.red,
} as const;

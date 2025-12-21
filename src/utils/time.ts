import { format } from 'date-fns'

export enum TimeUnits {
  Millisecond = 1,
  Second = 1000,
  Minute = 60 * Second,
  Hour = 60 * Minute,
  Day = 24 * Hour
}

export function formatTime(
  time: number | Date | string,
  formatString = 'yyyy-MM-dd HH:mm:ss'
): string {
  return format(new Date(time), formatString)
}

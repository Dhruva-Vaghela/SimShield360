// Date utilities
export class DateUtils {
  // Current timestamp
  static now(): Date {
    return new Date();
  }

  // Current timestamp in milliseconds
  static timestamp(): number {
    return Date.now();
  }

  // Format date to ISO string
  static toISO(date: Date): string {
    return date.toISOString();
  }

  // Format date to human-readable string
  static toHuman(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  // Add time to date
  static add(date: Date, amount: number, unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'): Date {
    const result = new Date(date);
    switch (unit) {
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'weeks':
        result.setDate(result.getDate() + amount * 7);
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
    }
    return result;
  }

  // Subtract time from date
  static subtract(date: Date, amount: number, unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'): Date {
    return this.add(date, -amount, unit);
  }

  // Calculate difference between dates
  static diff(date1: Date, date2: Date, unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'): number {
    const diffMs = date2.getTime() - date1.getTime();

    switch (unit) {
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      case 'years':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    }
  }

  // Check if date is in the past
  static isPast(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  // Check if date is in the future
  static isFuture(date: Date): boolean {
    return date.getTime() > Date.now();
  }

  // Check if date is between two dates
  static isBetween(date: Date, start: Date, end: Date): boolean {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }

  // Check if date is today
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  // Check if date is tomorrow
  static isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();
  }

  // Check if date is yesterday
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
  }

  // Get date range (start and end of day)
  static getDayRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // Get month range
  static getMonthRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // Get year range
  static getYearRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // Format date for database queries
  static toDatabaseFormat(date: Date): string {
    return date.toISOString();
  }

  // Parse date from database format
  static fromDatabaseFormat(dateString: string): Date {
    return new Date(dateString);
  }

  // Format date for API responses
  static toAPIDateFormat(date: Date): string {
    return date.toISOString();
  }

  // Parse date from API format
  static fromAPIDateFormat(dateString: string): Date {
    return new Date(dateString);
  }
}

// Time range types
export type TimeRange = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year';

// Get time range dates
export function getTimeRange(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();

  switch (range) {
    case 'today':
      return DateUtils.getDayRange(now);

    case 'yesterday':
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return DateUtils.getDayRange(yesterday);

    case 'last_7_days':
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      return { start: last7Days, end: now };

    case 'last_30_days':
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      return { start: last30Days, end: now };

    case 'this_month':
      return DateUtils.getMonthRange(now);

    case 'last_month':
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return DateUtils.getMonthRange(lastMonth);

    case 'this_year':
      return DateUtils.getYearRange(now);

    default:
      return { start: now, end: now };
  }
}

// Export all utilities
export default {
  DateUtils,
  getTimeRange,
};

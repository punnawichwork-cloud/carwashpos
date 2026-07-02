// Formatting + Asia/Bangkok date-range helpers.
// The reporting views (v_daily_revenue) bucket by Asia/Bangkok, so every
// "today / week / month" boundary the client computes must use the same TZ.
// Bangkok is a fixed UTC+7 (no DST), which keeps the math simple.

const TZ = 'Asia/Bangkok'
const BKK_OFFSET = '+07:00'
const DAY_MS = 86_400_000

export interface DateRange {
  fromISO: string
  toISO: string // exclusive upper bound
  prevFromISO: string
  prevToISO: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// Y/M/D as seen on a wall clock in Bangkok.
function bkkParts(d: Date): { y: number; m: number; day: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const [y, m, day] = s.split('-').map(Number)
  return { y, m, day }
}

// UTC ISO string for midnight of the given Bangkok calendar date.
function bkkMidnightISO(y: number, m: number, day: number): string {
  return new Date(`${y}-${pad(m)}-${pad(day)}T00:00:00${BKK_OFFSET}`).toISOString()
}

function shiftDaysISO(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString()
}

function withPrev(fromISO: string, toISO: string): DateRange {
  const durMs = new Date(toISO).getTime() - new Date(fromISO).getTime()
  return {
    fromISO,
    toISO,
    prevToISO: fromISO,
    prevFromISO: new Date(new Date(fromISO).getTime() - durMs).toISOString(),
  }
}

export function todayRange(now: Date = new Date()): DateRange {
  const { y, m, day } = bkkParts(now)
  const from = bkkMidnightISO(y, m, day)
  return withPrev(from, shiftDaysISO(from, 1))
}

/** Rolling 7 days including today. */
export function weekRange(now: Date = new Date()): DateRange {
  const { y, m, day } = bkkParts(now)
  const todayStart = bkkMidnightISO(y, m, day)
  return withPrev(shiftDaysISO(todayStart, -6), shiftDaysISO(todayStart, 1))
}

/** Month-to-date (1st of month .. tomorrow). */
export function monthRange(now: Date = new Date()): DateRange {
  const { y, m, day } = bkkParts(now)
  const from = bkkMidnightISO(y, m, 1)
  const to = shiftDaysISO(bkkMidnightISO(y, m, day), 1)
  return withPrev(from, to)
}

export type RangeKind = 'today' | 'week' | 'month'

export function rangeFor(kind: RangeKind, now: Date = new Date()): DateRange {
  if (kind === 'week') return weekRange(now)
  if (kind === 'month') return monthRange(now)
  return todayRange(now)
}

/** Build a range from two YYYY-MM-DD inputs (inclusive of the "to" day). */
export function rangeFromDates(fromDate: string, toDate: string): { fromISO: string; toISO: string } {
  const [fy, fm, fd] = fromDate.split('-').map(Number)
  const [ty, tm, td] = toDate.split('-').map(Number)
  const fromISO = bkkMidnightISO(fy, fm, fd)
  const toISO = shiftDaysISO(bkkMidnightISO(ty, tm, td), 1)
  return { fromISO, toISO }
}

// ---- display formatters ----

export function baht(n: number | null | undefined): string {
  return '฿' + Number(n ?? 0).toLocaleString('th-TH')
}

export function timeHM(iso: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** e.g. "2 ก.ค. 2569" (Thai Buddhist calendar). */
export function dateTH(iso: string): string {
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

/** YYYY-MM-DD in Bangkok — used for CSV cells and filenames. */
export function dateISO(iso: string): string {
  const { y, m, day } = bkkParts(new Date(iso))
  return `${y}-${pad(m)}-${pad(day)}`
}

/** Long label for the owner topbar, e.g. "พฤหัสบดี 2 ก.ค. 2569". */
export function todayLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now)
}

/** Hour (0–23) in Bangkok for a timestamp — used to bucket peak hours. */
export function bkkHour(iso: string): number {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    hour12: false,
  }).format(new Date(iso))
  return Number(s)
}

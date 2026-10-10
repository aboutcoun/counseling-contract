import type { OperatingHoursDetail, TimeBlock } from './types'

const DAY_LABELS: Record<string, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
}

function blockText(b?: TimeBlock) {
  if (!b) return ''
  if (b.closed) return '휴무'
  return `${b.open}~${b.close}`
}

export function summarizeHours(detail: OperatingHoursDetail | null | undefined): string {
  if (!detail) return ''
  if (detail.mode === 'same') {
    return blockText(detail.same)
  }
  if (detail.mode === 'weekday_weekend') {
    return `평일 ${blockText(detail.weekday)}, 주말 ${blockText(detail.weekend)}`
  }
  if (detail.mode === 'daily') {
    return (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const)
      .map((d) => `${DAY_LABELS[d]} ${blockText(detail[d])}`)
      .join(' / ')
  }
  return ''
}

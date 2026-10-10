'use client'

import type { HoursMode, OperatingHoursDetail, TimeBlock } from '@/lib/types'

// director 가입 흐름(join/basic)과 관리자 직접등록(admin/add-center)이
// 운영시간을 서로 다른 형태로 입력받고 있던 것을 하나로 통일한 공용 컴포넌트.

export function emptyBlock(): TimeBlock {
  return { open: '10:00', close: '19:00' }
}

export function defaultHours(): OperatingHoursDetail {
  return { mode: 'same', same: emptyBlock() }
}

export default function OperatingHoursEditor({
  hours,
  onChange,
}: {
  hours: OperatingHoursDetail
  onChange: (h: OperatingHoursDetail) => void
}) {
  return (
    <div>
      <label className="text-sm text-neutral-500 block mb-2">영업 시간을 알려주세요</label>
      <div className="flex gap-2 mb-3">
        {(
          [
            ['same', '모든 영업일이 같아요'],
            ['weekday_weekend', '평일/주말 달라요'],
            ['daily', '요일별로 달라요'],
          ] as [HoursMode, string][]
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() =>
              onChange({
                mode,
                same: mode === 'same' ? emptyBlock() : undefined,
                weekday: mode === 'weekday_weekend' ? emptyBlock() : undefined,
                weekend: mode === 'weekday_weekend' ? emptyBlock() : undefined,
                mon: mode === 'daily' ? emptyBlock() : undefined,
                tue: mode === 'daily' ? emptyBlock() : undefined,
                wed: mode === 'daily' ? emptyBlock() : undefined,
                thu: mode === 'daily' ? emptyBlock() : undefined,
                fri: mode === 'daily' ? emptyBlock() : undefined,
                sat: mode === 'daily' ? emptyBlock() : undefined,
                sun: mode === 'daily' ? emptyBlock() : undefined,
              })
            }
            className={`flex-1 text-xs px-2 py-2 rounded-md border ${
              hours.mode === mode ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {hours.mode === 'same' && (
        <TimeBlockEditor
          label="영업시간"
          block={hours.same ?? emptyBlock()}
          onChange={(b) => onChange({ ...hours, same: b })}
        />
      )}

      {hours.mode === 'weekday_weekend' && (
        <div className="flex flex-col gap-3">
          <TimeBlockEditor
            label="평일 (월~금)"
            block={hours.weekday ?? emptyBlock()}
            onChange={(b) => onChange({ ...hours, weekday: b })}
          />
          <TimeBlockEditor
            label="주말"
            block={hours.weekend ?? emptyBlock()}
            onChange={(b) => onChange({ ...hours, weekend: b })}
          />
        </div>
      )}

      {hours.mode === 'daily' && (
        <div className="flex flex-col gap-3">
          {(
            [
              ['mon', '월'],
              ['tue', '화'],
              ['wed', '수'],
              ['thu', '목'],
              ['fri', '금'],
              ['sat', '토'],
              ['sun', '일'],
            ] as [keyof OperatingHoursDetail, string][]
          ).map(([key, label]) => (
            <TimeBlockEditor
              key={key}
              label={label}
              block={(hours[key] as TimeBlock) ?? emptyBlock()}
              onChange={(b) => onChange({ ...hours, [key]: b })}
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TimeBlockEditor({
  label,
  block,
  onChange,
}: {
  label: string
  block: TimeBlock
  onChange: (b: TimeBlock) => void
  compact?: boolean
}) {
  return (
    <div className="border border-neutral-200 rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">{label}</span>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={!!block.closed}
            onChange={(e) => onChange({ ...block, closed: e.target.checked })}
          />
          휴무
        </label>
      </div>
      {!block.closed && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="time"
              className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
              value={block.open}
              onChange={(e) => onChange({ ...block, open: e.target.value })}
            />
            <span className="text-xs text-neutral-400">~</span>
            <input
              type="time"
              className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
              value={block.close}
              onChange={(e) => onChange({ ...block, close: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1.5">
            <input
              type="checkbox"
              checked={block.breakStart != null}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? { ...block, breakStart: '13:00', breakEnd: '14:00' }
                    : { ...block, breakStart: undefined, breakEnd: undefined }
                )
              }
            />
            휴게시간이 있어요
          </label>
          {block.breakStart != null && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                value={block.breakStart}
                onChange={(e) => onChange({ ...block, breakStart: e.target.value })}
              />
              <span className="text-xs text-neutral-400">~</span>
              <input
                type="time"
                className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                value={block.breakEnd}
                onChange={(e) => onChange({ ...block, breakEnd: e.target.value })}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

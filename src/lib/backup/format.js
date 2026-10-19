// Locale-aware UI formatters for tasks: priority label/color, due-date label,
// recurrence summary. All produce human-readable strings for the user's `lang`.

import { tr } from '../i18n.js'
import { PRIORITIES, DAY } from './schema.js'
import { num, clampImportance } from './io.js'
import { hasDueDate, hasDueTime, startOfToday } from './query.js'

export function priorityLabel(p, lang) {
  const entry = PRIORITIES.find((x) => x.value === clampImportance(p))
  return tr(lang, entry.key)
}

export function priorityColor(p) {
  const names = { 0: 'high', 1: 'medium', 2: 'low', 3: 'none' }
  return `var(--p-${names[clampImportance(p)]})`
}

export function dueLabel(t, lang) {
  if (!hasDueDate(t)) return ''
  const locale = lang === 'ar' ? 'ar' : 'en'
  const today = startOfToday()
  const due = new Date(t.dueDate)
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
  const time = hasDueTime(t) ? ` · ${timeFmt.format(due)}` : ''
  if (dueStart < today) return tr(lang, 'due.overdue') + time
  if (dueStart === today) return tr(lang, 'due.today') + time
  if (dueStart === today + DAY) return tr(lang, 'due.tomorrow') + time
  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
  return dateFmt.format(due) + time
}

const WEEKDAY_LETTERS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const MONDAY_BASE = new Date(2026, 8, 14).getTime()

function weekdayNames(locale) {
  const dtf = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  return WEEKDAY_LETTERS.map((_, i) => dtf.format(new Date(MONDAY_BASE + i * DAY)))
}

export function recurrenceSummary(rrule, lang) {
  if (!rrule || typeof rrule !== 'string') return ''
  const raw = rrule.trim()
  if (!raw) return ''
  const body = raw.replace(/^RRULE:/i, '')
  if (!/^FREQ=/i.test(body)) return raw
  const parts = {}
  for (const p of body.split(';')) {
    const idx = p.indexOf('=')
    if (idx > 0) parts[p.slice(0, idx).toUpperCase()] = p.slice(idx + 1)
  }
  const freq = String(parts.FREQ || '').toUpperCase()
  const interval = num(parts.INTERVAL, 1)
  const byday = parts.BYDAY ? parts.BYDAY.split(',') : []
  const locale = lang === 'ar' ? 'ar' : 'en'
  const freqParts = {
    DAILY: [tr(lang, 'recur.day'), tr(lang, 'recur.days')],
    WEEKLY: [tr(lang, 'recur.week'), tr(lang, 'recur.weeks')],
    MONTHLY: [tr(lang, 'recur.month'), tr(lang, 'recur.months')],
    YEARLY: [tr(lang, 'recur.year'), tr(lang, 'recur.years')]
  }
  const pair = freqParts[freq]
  if (!pair) return raw
  const every = tr(lang, 'recur.every')
  const intervalText = new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en').format(interval)
  const base =
    interval === 1 ? `${every} ${pair[0]}` : `${every} ${intervalText} ${pair[1]}`
  if (freq === 'WEEKLY' && byday.length) {
    const order = byday
      .map((d) => WEEKDAY_LETTERS.indexOf(String(d).toUpperCase().replace(',', '')))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)
    const names = weekdayNames(locale)
    const days = order.map((i) => names[i])
    if (days.length) return `${base} · ${days.join(', ')}`
  }
  return base
}

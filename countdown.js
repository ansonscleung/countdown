const DEFAULT_TARGET = '2026-08-28T18:00:00+08:00';

const injected = globalThis.COUNTDOWN_CONFIG ?? {};

function offsetOf(target) {
  const timePart = target.split('T')[1] ?? '';
  const match = /([+-]\d{2}:?\d{2}|[+-]\d{2}|Z)$/.exec(timePart);
  if (!match) return '';
  const raw = match[1];
  if (raw === 'Z') return '+00:00';
  return raw.length === 3 ? `${raw}:00` : raw;
}

const resolvedTarget = injected.target ?? DEFAULT_TARGET;

export const countdownConfig = {
  target: resolvedTarget,
  title: injected.title ?? 'The darkest hour is just before the dawn',
  timezoneLabel:
    injected.timezoneLabel ??
    (resolvedTarget === DEFAULT_TARGET || !offsetOf(resolvedTarget)
      ? 'HKT'
      : `UTC${offsetOf(resolvedTarget)}`)
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function formatTargetLabel(target = countdownConfig.target) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(target);
  if (!match) return '';
  const [, year, month, day, hour = '00', minute = '00'] = match;
  const offset = offsetOf(target);
  const tzLabel =
    target === DEFAULT_TARGET || !offset ? countdownConfig.timezoneLabel : `UTC${offset}`;
  return `Until ${Number(day)} ${MONTHS[Number(month) - 1]} ${year} · ${hour}:${minute} ${tzLabel}`;
}

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export function getRemaining(now = new Date(), target = countdownConfig.target) {
  const totalSeconds = Math.max(0, Math.ceil((new Date(target).getTime() - now.getTime()) / SECOND));
  const days = Math.floor((totalSeconds * SECOND) / DAY);
  const hours = Math.floor(((totalSeconds * SECOND) % DAY) / HOUR);
  const minutes = Math.floor(((totalSeconds * SECOND) % HOUR) / MINUTE);
  const seconds = totalSeconds % 60;

  return { totalSeconds, days, hours, minutes, seconds, complete: totalSeconds === 0 };
}

export function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatRemaining(remaining) {
  return [remaining.days, remaining.hours, remaining.minutes, remaining.seconds].map(pad).join(' : ');
}

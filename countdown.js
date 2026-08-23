export const countdownConfig = {
  target: '2026-08-28T18:00:00+08:00',
  title: 'The darkest hour is just before the dawn',
  timezoneLabel: 'HKT'
};

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

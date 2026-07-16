export function formatEventDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(new Date(isoDate));
}

const dateFmt = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatEventDateRange(
  startsAt: string,
  endsAt?: string | null,
): string {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;

  if (!end || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return `${dateFmt.format(start)}, ${timeFmt.format(start)}`;
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }

  return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${dateFmt.format(end)}, ${timeFmt.format(end)}`;
}

export function formatEventDateRangeShort(
  startsAt: string,
  endsAt?: string | null,
): string {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;

  if (!end || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return formatEventDate(startsAt);
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }

  return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
}

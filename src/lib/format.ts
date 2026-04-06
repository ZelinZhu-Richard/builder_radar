const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatTimestamp(value: string) {
  return timestampFormatter.format(new Date(value));
}

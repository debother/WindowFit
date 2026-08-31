export type OverflowDimensions = Readonly<{
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
}>;

export function hasVisualOverflow(dimensions: OverflowDimensions): boolean {
  return (
    dimensions.scrollWidth - dimensions.clientWidth > 0.5 ||
    dimensions.scrollHeight - dimensions.clientHeight > 0.5
  );
}

export function recipientHasTooManyExplicitLines(recipient: string, maxLines: number): boolean {
  return recipient !== "" && recipient.split("\n").length > maxLines;
}
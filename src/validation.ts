export type OverflowDimensions = Readonly<{
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
}>;

export function hasVisualOverflow(dimensions: OverflowDimensions): boolean {
  return dimensions.scrollWidth > dimensions.clientWidth || dimensions.scrollHeight > dimensions.clientHeight;
}

export function recipientHasTooManyExplicitLines(recipient: string, maxLines: number): boolean {
  return recipient !== "" && recipient.split("\n").length > maxLines;
}

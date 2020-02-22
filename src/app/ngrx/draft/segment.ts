export interface DraftSegment {
  start: [number, number];
  end: [number, number];
  pattern: Array<Array<boolean>>;
  id: string;
}
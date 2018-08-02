/**
 * Definition of pattern object.
 * @class
 */
export class Pattern {
  height: number;
  width: number;
  pattern: Array<Array<boolean>>;
  favorite: boolean;
  id: number;

  constructor() {
    this.favorite = false;
    this.height = 0;
    this.width = 0;
    this.pattern = [];
  }

  setPattern(pattern) {
    this.height = pattern.length;

    if (this.height > 0) {
      this.width = pattern[0].length;
    } else {
      this.width = 0;
    }

    this.pattern = pattern;

    return this;
  }
}
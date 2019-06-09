interface IPoint { x: number; y: number; }

export class Counter {

  private step: number = 1;
  private start: number = 0;
  private finish: number = 10;
  private value: number = 0;
  private delay: number = 100;
  private delayInitial: number = 100;
  private regimeType: string = "REPEAT";

  constructor(start: number, finish: number, step: number, regimeType?: string) {

    this.value = start;
    this.start = start;
    this.finish = finish;
    this.step = step;
    if (regimeType) { this.regimeType = regimeType; }

  }

  public setNewSeqFrameRegimeType(newSeqType: string) {
    this.regimeType = newSeqType;
  }

  public setNewValue(newValue: number) {
    this.value = newValue;
  }

  public setDelay(newDelay) {
    this.delay = newDelay;
    this.delayInitial = newDelay;
  }

  public getRawValue(): number {
    return this.value;
  }

  public getValue(): number {

    if (this.regimeType === "CONST") { return this.value; }

    if (this.delay > 0) {
      this.delay--;
      return this.value;
    }
    this.delay = this.delayInitial;

    if (this.regimeType !== "oscMin" && this.regimeType !== "oscMax") {

      if (this.value + this.step <= this.finish) {
        this.value = this.value + this.step;
        return this.value;
      } else {

        switch (this.regimeType) {

          case "STOP": {
              return this.value;
            }
          case "REPEAT": {
              this.value = this.start;
              this.onRepeat();
              return this.value;
            }
          default:
            console.warn("NO CASE");
        }
      }

    } else {

      if (this.regimeType === "oscMin") {

        if (this.value - this.step >= this.start) {
          this.value = this.value - this.step;
          return this.value;
        } else {
          this.regimeType = "oscMax";
          return this.value;
        }

      } else if (this.regimeType === "oscMax") {

        if (this.value + this.step <= this.finish) {
          this.value = this.value + this.step;
          return this.value;
        } else {
          this.regimeType = "oscMin";
          return this.value;
        }

      }

    }
    return 0;
  }

  // tslint:disable-next-line:no-empty
  public onRepeat = () => { };

}

export function getDistance(pointA: IPoint, pointB: IPoint): number {
  const a = pointA.x - pointB.x;
  const b = pointA.y - pointB.y;
  return Math.sqrt(a * a + b * b);
}

export function rotateVector(vector, angle) {
  return {
    x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
    y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle),
  };
}

export function someRandomNumber() { return (Math.random() * 1000).toString().replace(".", ""); }

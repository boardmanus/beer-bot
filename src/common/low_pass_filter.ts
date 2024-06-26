// A simple low-pass filter implementation.
// Uses a time constant provided by the user to filter out
// higher frequencies. This should be chosen to match the
// half the period of the measurements being recorded.

export class LowPassFilter {
  private tk: number;
  private t0: number;
  private x0: number;

  constructor(tk: number) {
    this.tk = tk;
    this.t0 = -1.0;
    this.x0 = -1.0;
  }

  update(x: number, t: number): number {
    if (this.t0 >= 0.0 && this.t0 < t) {
      const dt = t - this.t0;
      const alpha = dt / (this.tk + dt);
      const x1 = this.x0 + alpha * (x - this.x0);
      this.t0 = t;
      this.x0 = x1;
      return x1;
    } else if (this.t0 < 0.0) {
      this.t0 = t;
      this.x0 = x;
      return this.x0;
    } else {
      return this.x0;
    }
  }
}

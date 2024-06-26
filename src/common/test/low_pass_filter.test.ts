import { LowPassFilter } from '../low_pass_filter';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Low pass filter', () => {
  it('Should be able to be created', () => {
    const filter = new LowPassFilter(60.0);
    expect(filter).toBeDefined();
  });
  it('Should return the same value for the first measurement', () => {
    const filter = new LowPassFilter(60.0);
    expect(filter.update(7.0, 0.0)).toBe(7.0);
  });
  it('Should return filter larger input value', () => {
    const filter = new LowPassFilter(60.0);
    expect(filter.update(7.0, 0.0)).toBe(7.0);
    const x1 = filter.update(8.0, 1.0);
    expect(x1).toBeGreaterThan(7.0);
    expect(x1).toBeLessThan(8.0);
  });
  it('Should return filter smaller input values', () => {
    const filter = new LowPassFilter(60.0);
    expect(filter.update(7.0, 0.0)).toBe(7.0);
    const x1 = filter.update(6.0, 1.0);
    expect(x1).toBeLessThan(7.0);
    expect(x1).toBeGreaterThan(6.0);
  });
  it('Should ignore values when time goes backwards', () => {
    const filter = new LowPassFilter(60.0);
    expect(filter.update(7.0, 10.0)).toBe(7.0);
    const x1 = filter.update(50.0, 9.0);
    expect(x1).toEqual(7.0);
  });
});

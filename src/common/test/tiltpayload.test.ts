import { TiltPayload } from '../tiltpayload';

describe('TiltPayload', () => {
  it('should build payload with normalized UUID, temperature, and color', () => {
    const payload = new TiltPayload('a495bb20-c5b1-4b44-b512-1370f02d74de', 68.0, 1.05, -50);

    expect(payload.uuid).toBe('a495bb20-c5b1-4b44-b512-1370f02d74de');
    expect(payload.color).toBe('Green');
    expect(payload.gravity).toBe(1.05);
    expect(payload.rssi).toBe(-50);
    expect(payload.temperature).toBeCloseTo(20.0, 6);
    expect(payload.isValid()).toBe(true);
  });

  it('should report invalid when UUID is not known', () => {
    const payload = new TiltPayload('00000000-0000-0000-0000-000000000000', 68.0, 1.05, -50);

    expect(payload.color).toBeUndefined();
    expect(payload.isValid()).toBe(false);
  });

  it('should report invalid when values are out of expected range', () => {
    const baseUuid = 'a495bb20-c5b1-4b44-b512-1370f02d74de';

    const hot = new TiltPayload(baseUuid, 400.0, 1.05, -50);
    expect(hot.isValid()).toBe(false);

    const cold = new TiltPayload(baseUuid, -100.0, 1.05, -50);
    expect(cold.isValid()).toBe(false);

    const highG = new TiltPayload(baseUuid, 68.0, 1.9, -50);
    expect(highG.isValid()).toBe(false);

    const lowG = new TiltPayload(baseUuid, 68.0, 0.5, -50);
    expect(lowG.isValid()).toBe(false);
  });
});

import { TiltPayload, TILT_UUIDS } from '../../common/tiltpayload';
import { Tilt } from '../tilt';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Tilt Device', () => {
  it('Should be constructable', () => {
    const tilt = new Tilt((_payload) => {});
    expect(tilt).toBeDefined();
  });
  it('Should invoke the callback on handling a new measurement', () => {
    const callback = jest.fn((_p) => {});
    const tilt = new Tilt(callback);

    tilt.handleTiltPayload(
      new TiltPayload(Object.keys(TILT_UUIDS)[0], 45.0, 1.1, 0.0)
    );
    expect(callback).toHaveBeenCalled();
  });
});

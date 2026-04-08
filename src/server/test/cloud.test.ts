import { Cloud } from '../cloud';
import { TiltPayload } from '../../common/tiltpayload';
import * as beerbot_config from '../../config/config.json';

const CLOUD_REPORT_PERIOD_S = beerbot_config?.cloud?.report_period_s ?? 300.0;

const payload1 = new TiltPayload('uuid', 68.0, 1.05, -60, 0);
const payload2 = new TiltPayload('uuid', 71.6, 1.06, -60, 100);
const payload3 = new TiltPayload('uuid', 75.2, 1.07, -60, CLOUD_REPORT_PERIOD_S + 1);

describe('Cloud module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('payloadToCloud maps fields and converts units', () => {
    const cloud = new Cloud('Test Beer');
    const data = cloud.payloadToCloud('Test Beer', payload1);

    expect(data).toMatchObject({
      Beer: 'Test Beer',
      Temp: 68.0,
      SG: 1.05,
      Color: payload1.color,
      Comment: ''
    });

    expect(data.Timepoint).toBeCloseTo(payload1.timestamp / 86400.0 + 25568.0, 6);
  });

  it('reportToCloud returns correct behavior across report period', () => {
    const cloud = new Cloud('Test Beer');

    expect(cloud.reportToCloud(payload1)).toBe(true);

    // simulate first report and lastReportedPayload set through onPayload:
    cloud.onPayload(payload1);

    // within REPORT_PERIOD (300s), should be false
    expect(cloud.reportToCloud(payload2)).toBe(false);

    // beyond REPORT_PERIOD, should be true
    expect(cloud.reportToCloud(payload3)).toBe(true);
  });

  it('onBeerChange resets lastReportedPayload when beer changes', () => {
    const cloud = new Cloud('Initial Beer');
    cloud.onPayload(payload1);

    cloud.onBeerChange('Initial Beer');
    // same name, should preserve lastReportedPayload and therefore next report should still be throttled
    expect(cloud.reportToCloud(payload2)).toBe(false);

    cloud.onBeerChange('New Beer');
    // beer changed, lastReportedPayload reset by onBeerChange
    expect(cloud.reportToCloud(payload2)).toBe(true);
  });
});

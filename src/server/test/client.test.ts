import { Client } from '../client';
import { TiltPayload } from '../../common/tiltpayload';
import { EventEmitter } from 'events';

describe('Client', () => {
  it('should send SSE payload over response on onPayload when connected', () => {
    const client = new Client();
    const write = jest.fn();
    const end = jest.fn();
    const req: any = new EventEmitter();
    const res: any = {
      write,
      setHeader: jest.fn(),
      end
    };

    client.handleSseTiltMeasConnection(req as any, res as any);

    const payload = new TiltPayload(
      'a495bb20-c5b1-4b44-b512-1370f02d74de',
      68.0, // = 20C
      1.050,
      -60
    );

    client.onPayload(payload);

    expect(write).toHaveBeenCalled();
    const calledValue = write.mock.calls[0][0];
    expect(calledValue).toMatch(/data:/);
    expect(calledValue).toContain('"temperature":20');
    expect(calledValue).toContain('"gravity":1.05');
  });

  it('should clear payload response and end on client close', () => {
    const client = new Client();
    const write = jest.fn();
    const end = jest.fn();
    const req = new EventEmitter();
    const res: any = {
      write,
      setHeader: jest.fn(),
      end
    };

    client.handleSseTiltMeasConnection(req as any, res as any);
    req.emit('close');

    expect(end).toHaveBeenCalled();

    const payload = new TiltPayload(
      'a495bb20-c5b1-4b44-b512-1370f02d74de',
      68.0,
      1.050,
      -60
    );
    client.onPayload(payload);
    expect(write).toHaveBeenCalledTimes(0);
  });
});

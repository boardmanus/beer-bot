import { Client } from '../client';
import { TiltPayload } from '../../common/tiltpayload';
import { EventEmitter } from 'events';
import { Request, Response } from 'express';

describe('Client', () => {
  it('should send SSE payload over response on onPayload when connected', () => {
    const client = new Client();
    const write = jest.fn();
    const end = jest.fn();
    const req = new EventEmitter() as Request;
    const res = {
      write,
      setHeader: jest.fn(),
      end
    } as unknown as Response;

    client.handleSseTiltMeasConnection(req, res);

    const payload = new TiltPayload(
      'a495bb20-c5b1-4b44-b512-1370f02d74de',
      68.0, // = 20C
      1.05,
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
    const req = new EventEmitter() as Request;
    const res: Response = {
      write,
      setHeader: jest.fn(),
      end
    } as unknown as Response;

    client.handleSseTiltMeasConnection(req, res);
    req.emit('close');

    expect(end).toHaveBeenCalled();

    const payload = new TiltPayload('a495bb20-c5b1-4b44-b512-1370f02d74de', 68.0, 1.05, -60);
    client.onPayload(payload);
    expect(write).toHaveBeenCalledTimes(0);
  });
});

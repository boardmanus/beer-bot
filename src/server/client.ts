import { LowPassFilter } from '../common/low_pass_filter';
import { TiltPayload } from '../common/tiltpayload';
import { Request, Response } from 'express';

const RC = 60;
const TEMPERATURE_RC = RC;
const GRAVITY_RC = RC;

export class Client {
  private gFilter = new LowPassFilter(GRAVITY_RC);
  private tFilter = new LowPassFilter(TEMPERATURE_RC);
  private tiltPayloadResponse: Response | null = null;

  constructor() {}

  onPayload(payload: TiltPayload) {
    const rawGravity = payload.gravity;
    const rawTemperature = payload.temperature;
    payload.gravity = this.gFilter.update(rawGravity, payload.timestamp);
    payload.temperature = this.tFilter.update(rawTemperature, payload.timestamp);
    const payloadJson = JSON.stringify(payload);
    this.tiltPayloadResponse?.write(`data: ${payloadJson}\n\n`);
  }

  handleSseTiltMeasConnection(req: Request, res: Response) {
    console.log('handle-sse-tilt-meas-connection: connecting to client...');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    this.tiltPayloadResponse = res;

    req.on('close', () => {
      console.log('Connection to client closed.');
      this.tiltPayloadResponse = null;
      res.end();
    });
  }
}

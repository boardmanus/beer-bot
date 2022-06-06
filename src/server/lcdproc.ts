import { TiltPayload } from '../common/tiltpayload';
import { Socket } from 'net';

export class LcdProc {
  private socket: Socket;
  private host = 'localhost';
  private port = 13666;
  private width = 0;
  private height = 0;
  private connected = false;
  private lastTemperature = NaN;
  private lastGravity = NaN;
  private updateTimer: NodeJS.Timeout;

  constructor(host: string, port = 13666) {
    this.host = host;
    this.port = port;

    this.socket = new Socket();
    this.socket.connect(this.port, this.host, () => {
      this.socket.write('hello\n');
      this.connected = true;
    });

    this.socket.on('data', (d) => {
      const data_str = d.toString();
      const [cmd, ...params] = data_str.split(' ');
      if (cmd == 'connect') {
        params.forEach((v, i, a) => {
          if (v === 'wid') {
            this.width = parseInt(a[i + 1]);
          }
          if (v === 'hgt') {
            this.height = parseInt(a[i + 1]);
          }
        });

        this.socket.write('client_set name {beer-bot}\n');
        console.log(`LCDProc: width=${this.width}, height=${this.height}`);
        this.initScreen();
      }
    });

    this.socket.on('error', (error) => {
      console.log(`lcdproc: socket error (${error})`);
      this.connected = false;
    });
  }

  private initScreen(): void {
    this.socket.write('screen_add screen\n');
    this.socket.write('screen_set screen name {screen}\n');
    this.socket.write('screen_set screen heartbeat on\n');
    this.socket.write('screen_set screen priority 2\n');
    this.socket.write('screen_set screen backlight on\n');
    this.socket.write(this.widget('Temperature'));
    this.socket.write(this.widget('Gravity'));
    this.updateTimer = setTimeout(() => this.updateScreen(), 3000);
  }

  private updateScreen(): void {
    console.log(
      `lcdproc: updating screen with t=${this.lastTemperature}, g=${this.lastGravity}`
    );
    this.socket.write(this.temperatureVal(this.lastTemperature));
    this.socket.write(this.gravityVal(this.lastGravity));
    this.updateTimer.refresh();
  }

  private widget(name: string): string {
    return `widget_add screen ${name} string\n`;
  }

  private widgetVal(name: string, x: number, y: number, value: string): string {
    return `widget_set screen ${name} ${x} ${y} {${value}}\n`;
  }

  private vStr(val: number, dps: number): string {
    return isNaN(val) ? '???' : val.toFixed(dps);
  }

  private temperatureVal(temp: number): string {
    return this.widgetVal('Temperature', 1, 1, `Temp: ${this.vStr(temp, 1)}C`);
  }

  private gravityVal(g: number): string {
    return this.widgetVal('Gravity', 1, 2, `Gravity: ${this.vStr(g, 3)}`);
  }

  onPayload(payload: TiltPayload): void {
    if (!this.connected) {
      return;
    }
    this.lastTemperature = payload.temperature;
    this.lastGravity = payload.gravity;
    this.updateScreen();
  }
}

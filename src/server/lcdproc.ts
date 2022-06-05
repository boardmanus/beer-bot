import config from '../config/config.json';
import { TiltPayload } from '../common/tiltpayload';
import { Socket } from 'net';

class LcdProc {
  private socket: Socket;
  private host = 'localhost';
  private port = 13666;
  private width = 0;
  private height = 0;
  private connected = false;

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
        const pmap = params.reduce((acc: { [k: string]: string }, v, i, a) => {
          if (i % 2) acc[a[i - 1]] = v;
          return acc;
        }, {});
        this.width = parseInt(pmap['wid'] ?? '0');
        this.height = parseInt(pmap['hgt'] ?? '0');

        this.socket.write('client_set name {beer-bot}\n');
        console.log(`LCDProc: width=${this.width}, height=${this.height}`);
        this.screen();
      }
    });

    this.socket.on('error', (error) => {
      console.log(`lcdproc: socket error (${error})`);
      this.connected = false;
    });
  }

  screen() {
    this.socket.write('screen_add screen\n');
    this.socket.write('screen_set screen name {screen}\n');
    this.socket.write('screen_set screen heartbeat on\n');
    this.socket.write('screen_set screen priority 2\n');
    this.socket.write('screen_set screen backlight on\n');
    this.socket.write(this.widget('Temperature'));
    this.socket.write(this.widget_val('Temperature', 1, 1, '???'));
    this.socket.write(this.widget('Gravity'));
    this.socket.write(this.widget_val('Gravity', 1, 2, '???'));
  }

  widget(name: string) {
    return `widget_add screen ${name} string\n`;
  }

  widget_val(name: string, x: number, y: number, value: string) {
    return `widget_set screen ${name} ${x} ${y} {${value}}\n`;
  }

  temperature_val(temp: number) {
    return this.widget_val('Temperature', 1, 1, temp.toFixed(1));
  }

  gravity_val(g: number) {
    return this.widget_val('gravity', 1, 2, g.toFixed(3));
  }

  onPayload(payload: TiltPayload) {
    if (!this.connected) {
      return;
    }
    this.socket.write(this.temperature_val(payload.temperature));
    this.socket.write(this.gravity_val(payload.gravity));
  }
}

export const lcdproc = new LcdProc(config.server.LCDd ?? 'localhost');

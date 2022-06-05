import * as config from '../config/config.json';
import { TiltPayload } from '../common/tiltpayload';

class LcdProc {
  private lc: any;

  constructor() {
    const LcdClient = require('lcdproc-client').LcdClient;

    try {
      const lc = new LcdClient(13666, config.server.LCDd ?? 'localhost');

      lc.on('init', function () {
        console.log('LCD Proc initialized...');
      });
      lc.on('ready', function () {
        console.log(`LCDProc: width=${lc.width}, height=${lc.height}`);
        lc.screen('brew-bot');
        lc.widget('Temperature');
        lc.widget_val('Temperature', 1, 1, '???');
        lc.widget('Gravity');
        lc.widget_val('Gravity', 1, 2, '???');
      });
      lc.init();
      this.lc = lc;
    } catch (error) {
      console.log(`Failed to connect to LCDd @ ${config.server.LCDd}`);
    }
  }

  onPayload(payload: TiltPayload) {
    if (this.lc) {
      this.lc.widget_val(
        'Temperature',
        1,
        1,
        `Temp: ${payload.temperature.toFixed(1)}`
      );
      this.lc.widget_val(
        'Gravity',
        1,
        2,
        `Gravity: ${payload.gravity.toFixed(3)}`
      );
    }
  }
}

export const lcdproc = new LcdProc();

= Raspberry Pi Setup

- Install and Setup using the [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
  - This will allow you to flash the sdcard, and setup user, host and networking
    (SSH) so you don't require a monitor
- SSH into the Pi over wifi/ethernet - whatever setup
  - Run `raspi-config` to perform any other Pi changes required
- Install some extra stuff:
  - `sudo apt install vim git`
- Install nvm:
  - `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
  - Restart shell, then: `nvm install 20 && nvm use 20`
- SSH setup:
  - On R-Pi: `ssh-keygen`
  - On PC (assuming private key already setup): `ssh-copy-id <user>@<raspberry-pi>`
  - On PC, test login via ssh: `ssh <user>@<raspberry-pi>`
  - On R-Pi (if successful), disable password login:
    - `/etc/ssh/sshd_config  => PasswordAuthentication no`
- Get beer-bot onto the R-Pi:
  - `git clone git@github.com:boardmanus/beer-bot.git`
- Change to `beer-bot`, and install its dependencies using pnpm (the project uses pnpm for scripts):
  - `npm install -g pnpm`
  - `pnpm install`
- Enable running Noble bluetooth handling without root/sudo:
  - `sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)`
- Update the config file, by copying the example config in the repository and editing it:
  - `cp src/config/config.example.json src/config/config.json`
  - `vim src/config/config.json`
  - The cloud `url` to enter can be found in the Tilt google sheet.
    Once the AppScript has been deployed, and permissions given, a `Tilt` menu can be
    accessed from the Tilt Document list. This will have an option to:
    - `View Cloud URL` or `Email Cloud URL`.
- Install `pm2` to run the beer-bot: -`npm install -g pm2`
- Start beer-bot with pm2 (after building for production):
  - `pm2 startup`: follow instructions given
  - `pm2 start dist-pro/server.js --name beer-bot`
  - `pm2 save`

Note: If you are running a development build, the dev build output is `dist-dev/server.js`; for production builds the output is `dist-pro/server.js` (see package.json scripts).

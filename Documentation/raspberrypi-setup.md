# Raspberry Pi Setup

- Install and Setup using the [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
  - This will allow you to flash the sdcard, and setup user, host and networking
    (SSH) so you don't require a monitor
- SSH into the Pi over wifi/ethernet - whatever setup
  - Run `raspi-config` to perform any other Pi changes required
- Install some extra stuff:
  `sudo apt install vim git`
- Install nvm:
  `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
  - Restart shell, then: `nvm install 20 && nvm use 20`
- SSH setup:
  - On R-Pi: `ssh-keygen`
  - On PC (assuming private key already setup): `ssh-copy-id <user>@<raspberry-pi>`
  - On PC, test login via ssh: `ssh <user>@<raspberry-pi>`
  - On R-Pi (if successful), disable password login:
    `/etc/ssh/sshd_config  => PasswordAuthentication no`
- Get beer-bot onto the R-Pi:
  `git clone git@github.com:boardmanus/beer-bot.git`
- Change to `beer-bot`, and install it's dependencies using `yarn` (seems to work better)
  `npm install -g yarn`
  `yarn install`
- Enable running Noble bluetooth handling without root/sudo:
  `sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)`
- Update the config file, by first copying the `config.example.json`
  `cp config/config.example.json config/config.json`
  `vim config/config.json`
  - The cloud `url` to enter can be found in the Tilt google sheet.
    Once the AppScript has been deployed, and permissions given, a `Tilt` menu can be
    accessed from the Tilt Document list. This will have an option to:
    `View Cloud URL` or `Email Cloud URL`.
- Install `pm2` to run the beer-bot:
  `npm install -g pm2`
- Start beer-bot with pm2:
  `pm2 startup`: follow instructions given
  `pm2 start dist-server/server/server.js --name beer-bot`
  `pm2 save`

# Beer-Bot

Beer-Bot is a simple node.js server that performs a few tasks:

- reads Tilt hydrometer measurements via BLE beacon frames
- logs Tilt measurements to the cloud
- serves a simple webpage that displays the start of the beer

## Tilt Hydrometer

The [Tilt](https://tilthydrometer.com/) hydrometer is a clever little device
that floats in the wort to measure the specific gravity (SG).
It is weighted in a way such that the angle it floats at is proportional to
the SG of the wort.
It uses Bluetooth to send BLE beacon messages that provide temperature
and SG measurements.

Beer-Bot is designed to run on a Raspberry Pi, utilizing Node.js bluetooth
support to read the BLE beacon packets.

## Logging to the Cloud

Tilt Measurements are logged to a Google Sheet designed by the Tilt manufacturer.
It provides an easy way to log and visualize the data. The setup is a little
bit finnicky, and involves allowing a script to have permissions that may not be
desireable, but it works well enough.

For more information, checkout: [Cloud Logging](https://tilthydrometer.com/pages/app#cloudlogging)

## Web App

Beer-Bot serves a simple Web App that displays the state of the fermentation
in a simple visualization. It allows the name of the beer, original gravity (OG),
and beer colour (in SRM units) to be configured.
The name is used to log Tilt measurements to the correct Google Sheet, automatically
creating new entries.

![Screenshot](docs/readme/brew-bot-webapp.png)

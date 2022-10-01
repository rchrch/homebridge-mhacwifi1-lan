# Homebridge Plugin for LAN Control of Mitsubishi Heavy Industries MH-AC-WIFI-1

[![Version](https://img.shields.io/npm/v/homebridge-mhacwifi1-lan)](https://www.npmjs.com/package/homebridge-mhacwifi1-lan) &nbsp;
<img src="https://img.shields.io/badge/node-%3E%3D10.17-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/homebridge-%3E%3D1.3.0-brightgreen"> &nbsp;
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins) &nbsp;

This [Homebridge](https://github.com/nfarina/homebridge) plugin allows Mitsubishi Heavy Industries AirCon using the Intesis MH-AC-WIFI-1 controller to be accessible in Apple HomeKit.  It creates a platform device that allows aircons to be configured via the [Homebridge Config UI](https://github.com/oznu/homebridge-config-ui-x) or manually in the Homebridge config.json file.

The plugin creates the following Homekit accessories:
* HeaterCooler - HEAT, COOL, and AUTO modes, fan speed, and swing, and remote control lock
* Dehumidifier - DRY mode, fan speed, and swing
* Fan - FAN mode, fan speed, and swing
* Temperature - Optional outdoor temperature sensor accessory on the compressor (if available)

## Installing

For instructions on installing Homebridge look [here](https://github.com/homebridge/homebridge/wiki).

The plugin may be installed via the Homebridge Config UI or via npm.

To install under the Homebridge UI, click on "Plugins" and search for "mhacwifi1-lan".  Click on the "INSTALL" link for "Homebridge Mhacwifi1 Lan".

If you are not using the Homebridge UI, install with `npm install homebridge-mhacwifi1-lan`.


## Configuration

The easiest approach to configuration is to use the web-based Homebridge UI.  If you aren't using the web-based UI, use the following sections to configure the plugin.

### Required

The only required configuration for this plugin are the username, password, and IP address of the unit.  Adding the following json configuration to the platforms area:

```json
{
    ...
    "platforms": [
        {
            "platform": "MH-AC-WIFI-1",
            "name": "My Aircon",
            "host": "192.168.1.100",
            "username": "admin",
            "password": "admin",
        }
    ]
}
```

### Optional

Additional devices may be added as new platforms.  If you need to customise the username or password per device, you can add these values .  Additionally, you can disable the outdoor temperature sensor by setting `outdoorTemperature` to false.

```json
{
    ...
    "platforms": [
        {
            "platform": "MH-AC-WIFI-1",
            "name": "Lounge",
            "host": "192.168.1.100",
            "username": "admin-1",
            "password": "password-1",
            "outdoorTemperature": true
        },
        {
            "platform": "MH-AC-WIFI-1",
            "name": "Bedroom",
            "host": "192.168.1.101",
            "username": "admin-2",
            "password": "password-2",
            "outdoorTemperature": false
        }
    ]
}
```

### All config options

| Config | Description | Default |
| ------ | ----------- | ------- |
| name | Name you want to identify the aircon by | *required* |
| host | IP address or hostname of the device | *required* |
| username | Login name | admin |
| password | Login password | admin|
| outdoorTemperature | Enables outdoor temperature sensor | true |
| minSetpoint | Minimum allowed temperature | 18 |
| maxSetpoint | Maximum allowed temperature | 30 |
| slowThreshold | Number of milliseonds before logging slow require | 500 |
| syncPeriod | Number of milliseconds between sensor value polling requests | 1000 |

## Known Issues

From testing the MH-AC-WIFI-1 controller can be slow to respond to commands.  This appears to be normal.  To mitigate frequently queries, the plugin is designed to regularly poll all sensors every `syncPeriod` milliseconds.  The update interval is set to 1000 milliseconds by default.  You can get increase/decrease slow request logging by changing the `slowThrehold` value.  It is not recommended to sync faster than 1000 milliseconds.

## TODO
* Device discovery tools


## License

This project is licensed under the Apache v2 License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

* Other existing plugin implementations for MH-AC-WIFI-1
    * https://github.com/LarsenDX/homebridge-mhacwifi1-v2
    * https://github.com/Rickth64/homebridge-mhacwifi1

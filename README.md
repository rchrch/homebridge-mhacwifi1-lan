# Homebridge Plugin for LAN Control of Mitsubishi Heavy Industries MH-AC-WIFI-1

<img src="https://img.shields.io/badge/node-%3E%3D10.17-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/homebridge-%3E%3D1.3.0-brightgreen"> &nbsp;

This [Homebridge](https://github.com/nfarina/homebridge) plugin allows Mitsubishi Heavy Industries AirCon using the Intesis MH-AC-WIFI-1 controller to be accessible in Apple HomeKit.  It creates a platform device that allows aircons to be configured via the [Homebridge Config UI](https://github.com/oznu/homebridge-config-ui-x) or manually in the Homebridge config.json file.

The plugin creates the following Homekit accessories:
* HeaterCooler - HEAT, COOL, and AUTO modes, fan speed, and swing, and remote control lock
* Dehumidifier - DRY mode, fan speed, and swing
* Fan - FAN mode, fan speed, and swing
* Temperature - Optional outdoor temperature sensor accessory on the compressor (if available)

## Installing

For instructions on installing Homebridge look [here](https://github.com/homebridge/homebridge/wiki).

The plugin may be installed via the Hombridge Config UI or via npm.

TODO: npm install .....


## Configuration

The easiest approach to configuration is to use the web-based Homebridge UI.  If you aren't using the web-based UI, use the following sections to configure the plugin.

### Required

The only required configuration for this plugin are the username, password, and IP address of the unit.  Adding the following json configuration to the platforms area:

```json
{
    "platform": "MH-AC-WIFI-1",
    "username": "admin",
    "password": "admin",
    "devices": [
        {
            "name": "My Aircon",
            "host": "192.168.1.100",
        }
    ]
}
```

### Optional

Additional devices may be added to the `devices` list.  If you need to customise the username or password per device, you can add these values to the device entry.  Additionally, you can disable the outdoor temperature sensor by setting `outdoorTemperature` to false.

```json
...
{
   "platform": "MH-AC-WIFI-1",
   "devices": [
       {
           "name": "Lounge",
           "host": "192.168.1.100",
           "username": "admin-1",
           "password": "password-1",
           "outdoorTemperature": true
       },
       {
           "name": "Bedroom",
           "host": "192.168.1.101",
           "username": "admin-2",
           "password": "password-2",
           "outdoorTemperature": false
       }
   ]
}
```

## Known Issues

From testing the MH-AC-WIFI-1 controller can be slow to respond to commands.  This appears to be normal.  To mitigate frequently queries, the plugin is designed to regularly poll all sensors and provide cached copies.  This update interval is currently set to 2 seconds.

## TODO
* Device discovery tools
* Make the update interval configurable (not sure if this is necessary)


## License

This project is licensed under the Apache v2 License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

* Other existing plugin implementations for MH-AC-WIFI-1
    * https://github.com/LarsenDX/homebridge-mhacwifi1-v2
    * https://github.com/Rickth64/homebridge-mhacwifi1

# This document was acquired from the /js/data/data.json endpoint

```json
{
    "api":{
        "url":{
            "getinfo"               : "/js/api/getconfig.json",
            "login"                 : "/js/api/login.json",
            "logout"                : "/js/api/logout.json",
            "update_password"       : "/js/api/update_password.json",
            "getavailabledatapoints": "/js/api/getavailabledatapoints.json",
            "getdatapointvalue"     : "/js/api/getdatapointvalue.json",
            "setdatapointvalue"     : "/js/api/setdatapointvalue.json",
            "getcurrentconfig"      : "/js/api/getcurrentconfig.json",
            "identify"              : "/js/api/identify.json",
            "wpsstart"              : "/js/api/wpsstart.json",
            "getaplist"             : "/js/api/getaplist.json",
            "setdefaults"           : "/js/api/setdefaults.json",
            "setconfig"             : "/js/api/setconfig.json",
            "reboot"                : "/js/api/reboot.json",
            "getavailableservices"  : "/js/api/getavailableservices.json"
        },
        "error":{
            "0":"Undefined error",
            "1":"Login Required.",
            "2":"Write Error",
            "3":"Read Error",
            "4":"Malformed Command",
            "5":"Incorrect User name or password",
            "6":"Current password is incorrect",
            "7":"Out of range",
            "8":"Invalid datapoint",
            "9":"Internal error",
            "10":"General error"
        }
    },
    "info":{
        "deviceModel":"Device Model",
        "fwVersion":"Device Firmware Version",
        "wlanFwVersion":"Wireless Firmware Version",
        "sn":"Serial Number",
        "wlanSTAMAC":"Device Client MAC Address",
        "ssid":"Wireless Network SSID",
        "wlanLNK":"Connection Status with Wireless Network",
        "rssi":"Wireless Signal Strength",
        "wlanAPMAC":"Device Access Point MAC Address",
        "ownSSID":"Device Access Point SSID",
        "tcpServerLNK":"Cloud Server Connection",
        "acStatus":"Air Conditioner Communication Status",
        "lastconfigdatetime":"Last Configuration",
        "localdatetime":"Local Date Time"
    },
    "types":{
        "int":0,
        "enum":1,
        "temp":2
    },
    "acStatus":{
        "0":"Ok",
        "1":"Indoor Unit Error",
        "2":"Communication Error"
    },
    "lastError":{
        "0":"No error",
        "1":"Wrong SSID introduced in the last configuration attempt",
        "2":"Unsuccessful connection with the Access Point or router, check the password or the security mode selected",
        "3":"Wrong IP configuration introduced or Internet connection problem in your network",
        "4":"Your Access Point might be a captive portal. This type of network is not supported",
        "7":"WPS failed. Try it again or configure your device by using the automatic or manual mode"
    },
    "wifiConfig":{
        "securityType": {
            "0":"Open",
            "1":"WEP",
            "2":"WPA_PSK",
            "3":"WPA2_PSK",
            "4":"WPA_WPA2_PSK",
            "5":"WPA2_Enterprise"
        },
        "levelText":{
            "0":"Low",
            "1":"Acceptable",
            "2":"Good",
            "3":"Very Good",
            "4":"Excelent"
        }
    },
    "signals":{
        "uid":{
            "1": ["On/Off", "TEXT_VALUES_ONOFF", ""],
            "2": ["User Mode", "TEXT_VALUES_MODES", ""],
            "4": ["Fan Speed", "TEXT_VALUES_FANSPEED", ""],
            "5": ["Vane Up/Down Position", "TEXT_VALUES_VANES", ""],
            "6": ["Vane Left/Right Position", "TEXT_VALUES_VANES", ""],
            "9": ["User Setpoint", {}, "°C"],
            "10": ["Return Path Temperature", {}, "°C"],
            "12": ["Remote Disable", "TEXT_VALUES_REMOTE", ""],
            "13": ["On Time", {}, "h"],
            "14": ["Alarm Status", "TEXT_VALUES_ONOFF", ""],
            "15": ["Error Code", {}, ""],
            "34": ["Quiet Mode", "TEXT_VALUES_ONOFF", ""],
            "35": ["Min Temperature Setpoint", {}, "°C"],
            "36": ["Max Temperature Setpoint", {}, "°C"],
            "37": ["Outdoor Temperature", {}, "°C"],
            "60": ["Heat 8/10ºC", "TEXT_VALUES_ONOFF", ""],
            "61": ["cfg Mode Map", {}, ""],
            "62": ["cfg Mode Restrict", {}, ""],
            "63": ["cfg Horizontal Vanes", {}, ""],
            "64": ["cfg Vertical Vanes", {}, ""],
            "65": ["cfg Quiet mode", {}, ""],
            "66": ["cfg Confirmation On/Off", {}, ""],
            "67": ["cfg Fan Map Speed", {}, ""],
            "68": ["Instant Power Consumption", {}, "W"],
            "69": ["Accumulated Power Consumption", {}, "Wh"],
            "181": ["Maintenance time", {}, "h"],
            "182": ["Maintenance config", {}, "h"],
            "183": ["Maintenance Filter time", {}, "h"],
            "184": ["Maintenance Filter config", {}, "h"]
        },
        "uidTextvalues":{
            "TEXT_VALUES_ONOFF": {
                "0":"Off",
                "1":"On"
            },
            "TEXT_VALUES_MODES": {
                "0":"Auto",
                "1":"Heat",
                "2":"Dry",
                "3":"Fan",
                "4":"Cool"
            },
            "TEXT_VALUES_FANSPEED": {
                "0":"Auto",
                "1":"Speed 1",
                "2":"Speed 2",
                "3":"Speed 3",
                "4":"Speed 4",
                "5":"Speed 5",
                "6":"Speed 6",
                "7":"Speed 7",
                "8":"Speed 8",
                "9":"Speed 9",
                "10":"Speed 10"
            },
            "TEXT_VALUES_VANES": {
                "0":"Auto",
                "1":"Position 1",
                "2":"Position 2",
                "3":"Position 3",
                "4":"Position 4",
                "5":"Position 5",
                "6":"Position 6",
                "7":"Position 7",
                "8":"Position 8",
                "9":"Position 9",
                "10":"Swing",
                "11":"Swirl",
                "12":"Wide"
            },
            "TEXT_VALUES_REMOTE": {
                "0":"Remote Enabled",
                "1":"Remote Disabled"
            }
        }
    }
}
```

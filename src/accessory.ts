import { PlatformAccessory } from 'homebridge'
import { Aircon } from "./accessories/aircon"
import { Dehumidifier } from "./accessories/dehumidifier"
import { EVENT_UPDATED, MHACWIFI1 } from './accessories/device'
import { Fan } from "./accessories/fan"
import { OutdoorTemperature } from "./accessories/outdoor"
import { MHACConfig, MitsubishiHeavyAirconPlatform } from './platform'


const MANUFACTURER = "Mitsubishi Heavy Industries"
const MODEL = "MH-AC-WIFI-1"


export class AirconAccessory {

    private aircon: Aircon
    private fan: Fan
    private dehumidifier: Dehumidifier

    constructor(
        device: MHACWIFI1,
        platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        config: MHACConfig,
    ) {
        let context = accessory.context
        let Characteristic = platform.Characteristic
        device.on(EVENT_UPDATED, this.updateHomeBridgeState.bind(this))

        // set accessory information
        accessory.getService(platform.Service.AccessoryInformation)!
            .setCharacteristic(Characteristic.Identify, false)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, config.info.sn)
            .setCharacteristic(Characteristic.FirmwareRevision, config.info.fwVersion)

        // Add the relavant accessories
        this.aircon = new Aircon(platform, accessory, device)
        this.fan = new Fan(platform, accessory, device)
        this.dehumidifier = new Dehumidifier(platform, accessory, device)
    }

    async updateHomeBridgeState() {
        this.aircon.updateHomeBridgeState()
        this.fan.updateHomeBridgeState()
        this.dehumidifier.updateHomeBridgeState()
    }
}


export class OutdoorTemperatureAccessory {

    private temperature: OutdoorTemperature

    constructor(
        device: MHACWIFI1,
        platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        config: MHACConfig,
    ) {
        let context = accessory.context
        let Characteristic = platform.Characteristic
        device.on(EVENT_UPDATED, this.updateHomeBridgeState.bind(this))

        // set accessory information
        accessory.getService(platform.Service.AccessoryInformation)!
            .setCharacteristic(Characteristic.Name, 'Outdoor')
            .setCharacteristic(Characteristic.Identify, false)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, config.info.sn)
            .setCharacteristic(Characteristic.FirmwareRevision, config.info.fwVersion)

        this.temperature = new OutdoorTemperature(platform, accessory, device)
    }

    async updateHomeBridgeState() {
        this.temperature.updateHomeBridgeState()
    }
}

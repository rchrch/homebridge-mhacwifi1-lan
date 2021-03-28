import { PlatformAccessory } from 'homebridge'
import { AirconService } from "./accessories/aircon"
import { DehumidifierService } from "./accessories/dehumidifier"
import { EVENT_UPDATED, MHACWIFI1 } from './accessories/device'
import { FanService } from "./accessories/fan"
import { OutdoorTemperatureService } from "./accessories/outdoor"
import { MHACConfig, MitsubishiHeavyAirconPlatform } from './platform'


const MANUFACTURER = "Mitsubishi Heavy Industries"
const MODEL = "MH-AC-WIFI-1"

/**
 * Homebridge accessory class containing indoor aircon related services
 */
export class AirconAccessory {

    private aircon: AirconService
    private fan: FanService
    private dehumidifier: DehumidifierService

    constructor(
        device: MHACWIFI1,
        platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        config: MHACConfig,
    ) {
        const Characteristic = platform.Characteristic
        device.on(EVENT_UPDATED, this.updateHomeBridgeState.bind(this))

        // set accessory information
        const service = accessory.getService(platform.Service.AccessoryInformation)
        if (service) {
            service
            .setCharacteristic(Characteristic.Identify, false)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, config.info.sn)
            .setCharacteristic(Characteristic.FirmwareRevision, config.info.fwVersion)
        }

        // Add the relavant accessories
        this.aircon = new AirconService(platform, accessory, device)
        this.fan = new FanService(platform, accessory, device)
        this.dehumidifier = new DehumidifierService(platform, accessory, device)
    }

    async updateHomeBridgeState(): Promise<void> {
        this.aircon.updateHomeBridgeState()
        this.fan.updateHomeBridgeState()
        this.dehumidifier.updateHomeBridgeState()
    }
}


/**
 * Homebridge accessory class containing outdoor aircon related services
 */
export class OutdoorTemperatureAccessory {

    private temperature: OutdoorTemperatureService

    constructor(
        device: MHACWIFI1,
        platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        config: MHACConfig,
    ) {
        const Characteristic = platform.Characteristic
        device.on(EVENT_UPDATED, this.updateHomeBridgeState.bind(this))

        // set accessory information
        const service = accessory.getService(platform.Service.AccessoryInformation)
        if (service) {
            service
            .setCharacteristic(Characteristic.Name, 'Outdoor')
            .setCharacteristic(Characteristic.Identify, false)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, config.info.sn)
            .setCharacteristic(Characteristic.FirmwareRevision, config.info.fwVersion)
        }

        this.temperature = new OutdoorTemperatureService(platform, accessory, device)
    }

    async updateHomeBridgeState(): Promise<void> {
        this.temperature.updateHomeBridgeState()
    }
}

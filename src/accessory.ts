import { PlatformAccessory, Service } from 'homebridge'
import { MitsubishiHeavyAirconPlatform } from './platform'
import { MHACWIFI1, EVENT_UPDATED } from './accessories/device'
import { Aircon } from "./accessories/aircon"
import { Fan } from "./accessories/fan"
import { Dehumidifier } from "./accessories/dehumidifier"
import { OutsideTemperature } from "./accessories/outside"


const MANUFACTURER = "Mitsubishi Heavy Industries"
const MODEL = "MH-AC-WIFI-1"


export type MHACConfig = {
    name: string
    host: string
    username: string
    password: string
    mac: string
    info: any     // TODO define this structure
}

export class MHACAccessory {

    private device: MHACWIFI1
    private aircon: Aircon
    private fan: Fan
    private dehumidifier: Dehumidifier
    private outside: OutsideTemperature

    constructor(
        private platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        config: MHACConfig,
    ) {
        let context = accessory.context
        let Characteristic = platform.Characteristic
        this.device = new MHACWIFI1(platform.log, config.host, config.username, config.password)
        this.device.startSynchronization()
        this.device.on(EVENT_UPDATED, this.updateHomeBridgeState.bind(this))

        // set accessory information
        accessory.getService(platform.Service.AccessoryInformation)!
            .setCharacteristic(Characteristic.Identify, false)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, config.info.sn)
            .setCharacteristic(Characteristic.FirmwareRevision, config.info.fwVersion)

        this.aircon = new Aircon(platform, accessory, this.device)
        this.fan = new Fan(platform, accessory, this.device)
        this.dehumidifier = new Dehumidifier(platform, accessory, this.device)
        this.outside = new OutsideTemperature(platform, accessory, this.device)
    }

    async updateHomeBridgeState() {
        this.aircon.updateHomeBridgeState()
        this.fan.updateHomeBridgeState()
        this.dehumidifier.updateHomeBridgeState()
        this.outside.updateHomeBridgeState()
    }
}

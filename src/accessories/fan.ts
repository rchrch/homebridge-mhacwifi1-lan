import { CharacteristicValue, PlatformAccessory, Service } from "homebridge"
import { MitsubishiHeavyAirconPlatform } from "../platform"
import { MhacModeTypes, MHACWIFI1 } from "./device"

export class FanService {

    private service: Service

    constructor(
        private readonly platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        private readonly device: MHACWIFI1,
    ) {
        const Characteristic = platform.Characteristic

        // Create the fan service
        // Implemented characteristics:
        //    Active
        //    Name
        //    RotationSpeed
        //    SwingMode
        this.service = accessory.getService(platform.Service.Fanv2) ||
            accessory.addService(platform.Service.Fanv2, accessory.context.device.name + " Fan")
        this.service.getCharacteristic(Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this))
        this.service.setCharacteristic(Characteristic.Name, "Fan")
        this.service.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({ minValue: 0, maxValue: 100, minStep: 25 })
            .onGet(this.getRotationSpeed.bind(this))
            .onSet(this.setRotationSpeed.bind(this))
        this.service.getCharacteristic(Characteristic.SwingMode)
            .onGet(this.getSwingMode.bind(this))
            .onSet(this.setSwingMode.bind(this))
    }

    updateHomeBridgeState(): void {
        if (!this.device.get.valid())
            return
        this.syncCharacteristic("Active", this.getActive())
        this.syncCharacteristic("RotationSpeed", this.getRotationSpeed())
        this.syncCharacteristic("SwingMode", this.getSwingMode())
    }

    syncCharacteristic(characteristic: string, value: number): void {
        if (this.service.getCharacteristic(this.platform.Characteristic[characteristic]).value != value) {
            this.platform.log.debug(`Updating homebridge characteristics Fan.${characteristic} => ${value}`)
            this.service.getCharacteristic(this.platform.Characteristic[characteristic]).updateValue(value)
        }
    }

    private checkValid():  void {
        if (!this.device.get.valid())
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getActive(): number {
        this.checkValid()
        const active = this.device.get.active()
        const mode = this.device.get.mode()
        return (active && mode == MhacModeTypes.FAN) ? 1 : 0
    }

    private async setActive(value: CharacteristicValue) {
        const active = value as number
        this.platform.log.debug(`Set characteristic Fan.Active -> ${value}`)
        if (active) {
            this.device.set.mode(MhacModeTypes.FAN)
        }
        this.device.set.active(active)
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getRotationSpeed(): number {
        this.checkValid()
        return this.device.get.fanSpeed() * 25
    }

    private async setRotationSpeed(value: CharacteristicValue) {
        this.checkValid()
        const hw_value = Math.ceil(value as number / 25)
        this.platform.log.debug(`Set characteristic Fan.RotationSpeed -> ${hw_value}`)
        this.device.set.fanSpeed(hw_value)
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getSwingMode(): number {
        return this.device.get.swingMode()
    }

    private async setSwingMode(value: CharacteristicValue) {
        const swing = value as number
        this.platform.log.debug(`Set characteristic Fan.SwingMode -> ${swing}`)
        this.device.set.swingMode(swing)
    }
}
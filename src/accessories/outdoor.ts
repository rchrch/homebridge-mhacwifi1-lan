import { PlatformAccessory, Service } from 'homebridge';
import { MitsubishiHeavyAirconPlatform } from '../platform';
import { MHACWIFI1 } from './device';

export class OutdoorTemperatureService {

    private service: Service;
    private debounce: any = { speed: null };

    constructor(
        private readonly platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        private readonly device: MHACWIFI1
    ) {
        let Characteristic = platform.Characteristic;

        // Create the outdoor temperature service
        // Implemented characteristics:
        //    CurrentTemperature
        this.service = accessory.getService(platform.Service.TemperatureSensor) ||
            accessory.addService(platform.Service.TemperatureSensor, "Outdoor")
        this.service.setCharacteristic(Characteristic.Name, "Outdoor")
        this.service.getCharacteristic(Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this))
    }

    updateHomeBridgeState() {
        if (!this.device.get.valid())
            return
        this.syncCharacteristic('CurrentTemperature', this.getCurrentTemperature())
    }

    syncCharacteristic(characteristic: string, value: number) {
        if (this.service.getCharacteristic(this.platform.Characteristic[characteristic]).value != value) {
            this.platform.log.debug(`Updating homebridge characteristics TemperatureSensor.${characteristic} => ${value}`)
            this.service.getCharacteristic(this.platform.Characteristic[characteristic]).updateValue(value)
        }
    }

    private checkValid() {
        if (!this.device.get.valid())
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getCurrentTemperature(): number {
        this.checkValid()
        return this.device.get.outdoorTemperature()
    }
}
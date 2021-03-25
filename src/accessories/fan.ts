import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { MHACWIFI1, MhacModeTypes } from './device';
import { MitsubishiHeavyAirconPlatform } from '../platform';

export class Fan {

    private service: Service;
    private debounce: any = { speed: null };

    constructor(
        private readonly platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        private readonly device: MHACWIFI1
    ) {
        let Characteristic = platform.Characteristic;

        // Create the fan service
        // Implemented characteristics:
        //    Active
        //    Name
        //    RotationSpeed
        //    SwingMode
        this.service = accessory.getService(platform.Service.Fanv2) ||
            accessory.addService(platform.Service.Fanv2, accessory.context.device.name + " Fan");
        this.service.getCharacteristic(Characteristic.Active)
            .onGet(this.fanGetActive.bind(this))
            .onSet(this.fanSetActive.bind(this));
        this.service.setCharacteristic(Characteristic.Name, "Fan");
        this.service.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({ minValue: 0, maxValue: 100, minStep: 25 })
            .onGet(this.getRotationSpeed.bind(this))
            .onSet(this.setRotationSpeed.bind(this, 'Fanv2'));
        this.service.getCharacteristic(Characteristic.SwingMode)
            .onGet(this.getSwingMode.bind(this))
            .onSet(this.setSwingMode.bind(this, 'Fanv2'));
    }

    updateHomeBridgeState() {
        this.syncCharacteristic('Active', this.fanGetActive());
        this.syncCharacteristic('RotationSpeed', this.getRotationSpeed());
        this.syncCharacteristic('SwingMode', this.getSwingMode());
    }

    syncCharacteristic(characteristic: string, value: number) {
        if (this.service.getCharacteristic(this.platform.Characteristic[characteristic]).value != value) {
            this.platform.log.debug(`Updating homebridge characteristics Fan.${characteristic} => ${value}`)
            this.service.getCharacteristic(this.platform.Characteristic[characteristic]).updateValue(value)
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fanGetActive(): number {
        let active = this.device.get.active();
        let mode = this.device.get.mode();
        return (active && mode == MhacModeTypes.FAN) ? 1 : 0;
    }

    async fanSetActive(value: CharacteristicValue) {
        let active = value as number;
        this.platform.log.debug(`Set characteristic Fan.Active -> ${value}`);
        if (active) {
            this.device.set.mode(MhacModeTypes.FAN);
        }
        this.device.set.active(active);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getRotationSpeed(): number {
        let hw_value = this.device.get.fanSpeed();
        return hw_value * 25;
    }

    async setRotationSpeed(service: string, value: CharacteristicValue) {
        let hw_value = Math.ceil(value as number / 25);
        this.platform.log.debug(`Set characteristic ${service}.RotationSpeed -> ${hw_value}`);
        this.device.set.fanSpeed(hw_value);
        clearTimeout(this.debounce.speed)
        this.debounce.speed = setTimeout(() => { this.device.set.fanSpeed(hw_value); }, 500);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getSwingMode(): number {
        return this.device.get.swingMode();
    }

    async setSwingMode(service: string, value: CharacteristicValue) {
        let swing = value as number;
        this.platform.log.debug(`Set characteristic ${service}.SwingMode -> ${swing}`);
        this.device.set.swingMode(swing);
    }
}
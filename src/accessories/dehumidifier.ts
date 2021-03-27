import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { MHACWIFI1, MhacModeTypes } from './device';
import { MitsubishiHeavyAirconPlatform } from '../platform';

export class Dehumidifier {

    private service: Service;
    private debounce: any = { speed: null };

    constructor(
        private readonly platform: MitsubishiHeavyAirconPlatform,
        accessory: PlatformAccessory,
        private readonly device: MHACWIFI1
    ) {
        let Characteristic = platform.Characteristic;

        // Create the dehumidifier service
        // Implemented characteristics:
        //    Active
        //    Current Humidifier-Dehumidifier State
        //    Name
        //    RotationSpeed
        //    SwingMode
        //    Target Humidifier-Dehumidifier State
        this.service = accessory.getService(platform.Service.HumidifierDehumidifier) ||
            accessory.addService(platform.Service.HumidifierDehumidifier, accessory.context.device.name + " Dehumidifier");
        this.service.getCharacteristic(Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));
        this.service.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
            .onGet(this.getCurrentHumidifierDehumidifierState.bind(this));
        this.service.setCharacteristic(Characteristic.Name, "Dehumidifier");
        this.service.getCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold)
            .onGet(this.getRelativeHumidityDehumidifierThreshold.bind(this));
        this.service.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({ minValue: 0, maxValue: 100, minStep: 25 })
            .onGet(this.getRotationSpeed.bind(this))
            .onSet(this.setRotationSpeed.bind(this));
        this.service.getCharacteristic(Characteristic.SwingMode)
            .onGet(this.getSwingMode.bind(this))
            .onSet(this.setSwingMode.bind(this));
        this.service.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
            .setProps({
                minValue: Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER,
                maxValue: Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER,
                validValues: [Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER]
            })
            .onGet(this.getTargetHumidifierDehumidifierState.bind(this))
            .onSet(this.setTargetHumidifierDehumidifierState.bind(this));

    }

    updateHomeBridgeState() {
        if (!this.device.get.valid())
            return
        this.syncCharacteristic('Active', this.getActive());
        this.syncCharacteristic('CurrentHumidifierDehumidifierState', this.getCurrentHumidifierDehumidifierState());
        this.syncCharacteristic('RotationSpeed', this.getRotationSpeed());
        this.syncCharacteristic('SwingMode', this.getSwingMode());
        this.syncCharacteristic('TargetHumidifierDehumidifierState', this.getTargetHumidifierDehumidifierState());
    }

    private syncCharacteristic(characteristic: string, value: number) {
        if (this.service.getCharacteristic(this.platform.Characteristic[characteristic]).value != value) {
            this.platform.log.debug(`Updating homebridge characteristics Dehumidifier.${characteristic} => ${value}`)
            this.service.getCharacteristic(this.platform.Characteristic[characteristic]).updateValue(value)
        }
    }

    private checkValid() {
        if (!this.device.get.valid())
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getActive(): number {
        this.checkValid()
        let active = this.device.get.active();
        let mode = this.device.get.mode();
        return active && mode == MhacModeTypes.DRY;
    }

    private async setActive(value: CharacteristicValue) {
        let active = value as number;
        this.platform.log.debug(`Set characteristic HumidifierDehumidifier.Active -> ${value}`);
        if (active) {
            this.device.set.mode(MhacModeTypes.DRY);
        }
        this.device.set.active(active);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getCurrentHumidifierDehumidifierState(): number {
        this.checkValid()
        let active = this.device.get.active();
        let mode = this.device.get.mode();
        if (active && mode == MhacModeTypes.DRY) {
            return this.platform.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING
        } else {
            return this.platform.Characteristic.CurrentHumidifierDehumidifierState.INACTIVE
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getRelativeHumidityDehumidifierThreshold(): number {
        this.checkValid()
        let active = this.device.get.active();
        let mode = this.device.get.mode();
        return (active && mode == MhacModeTypes.DRY) ? 50 : 0;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getRotationSpeed(): number {
        this.checkValid()
        return this.device.get.fanSpeed() * 25
    }

    private async setRotationSpeed(value: CharacteristicValue) {
        let hw_value = Math.ceil(value as number / 25);
        this.platform.log.debug(`Set characteristic HumidifierDehumidifier.RotationSpeed -> ${hw_value}`);
        clearTimeout(this.debounce.speed)
        this.debounce.speed = setTimeout(() => { this.platform.log.debug(`setting hw to ${hw_value}`); this.device.set.fanSpeed(hw_value); }, 500);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getSwingMode(): number {
        this.checkValid()
        return this.device.get.swingMode();
    }

    private async setSwingMode(value: CharacteristicValue) {
        let swing = value as number;
        this.platform.log.debug(`Set characteristic HumidifierDehumidifier.SwingMode -> ${swing}`);
        this.device.set.swingMode(swing);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private getTargetHumidifierDehumidifierState(): number {
        this.checkValid()
        return this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER
    }

    private setTargetHumidifierDehumidifierState(value: CharacteristicValue) {
        if (value != this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER) {
            this.platform.log.error(`Invalid state for TargetHumidifierDehumidifierState => ${value}`)
        }
    }
}
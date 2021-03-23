import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { MHACWIFI1, MhacModeTypes } from './device';
import { MitsubishHeavyAirconPlatform } from '../platform';

export class Aircon {

    private service: Service;
    private debounce: any = { speed: null };

    constructor(
        private readonly platform: MitsubishHeavyAirconPlatform,
        private readonly accessory: PlatformAccessory,
        private readonly device: MHACWIFI1
    ) {
        let Characteristic = platform.Characteristic;

        // Create the HeaterCooler service
        // Implemented characteristics:
        //    Active
        //    CoolingThresholdTemperature
        //    Current Heater-Cooler State
        //    Current Temperature
        //    HeatingThresholdTemperature
        //    LockPhysicalControls
        //    Name
        //    RotationSpeed
        //    SwingMode
        //    Target Heater-Cooler State
        //    TemperatureDisplayUnits
        this.service = accessory.getService(platform.Service.HeaterCooler) ||
            accessory.addService(platform.Service.HeaterCooler, accessory.context.device.name + " H/C");
        this.service.getCharacteristic(Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));
        this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature)
            .onGet(this.getCoolingThresholdTemperature.bind(this))
            .onSet(this.setCoolingThresholdTemperature.bind(this));
        this.service.getCharacteristic(Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));
        this.service.getCharacteristic(Characteristic.CurrentHeaterCoolerState)
            .onGet(this.getCurrentHeaterCoolerState.bind(this));
        this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature)
            .onGet(this.getHeatingThresholdTemperature.bind(this))
            .onSet(this.setHeatingThresholdTemperature.bind(this));
        this.service.getCharacteristic(Characteristic.LockPhysicalControls)
            .onGet(this.getLockPhysicalControls.bind(this))
            .onSet(this.setLockPhysicalControls.bind(this, 'HeaterCooler'));
        this.service.setCharacteristic(Characteristic.Name, "Aircon");
        this.service.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({ minValue: 0, maxValue: 100, minStep: 25 })
            .onGet(this.getRotationSpeed.bind(this))
            .onSet(this.setRotationSpeed.bind(this, 'HeaterCooler'));
        this.service.getCharacteristic(Characteristic.SwingMode)
            .onGet(this.getSwingMode.bind(this))
            .onSet(this.setSwingMode.bind(this, 'HeaterCooler'));
        this.service.getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .onGet(this.getTargetHeaterCoolerState.bind(this))
            .onSet(this.setTargetHeaterCoolerState.bind(this));
        this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
            .onGet(this.getTemperatureDisplayUnits.bind(this))
            .onSet(this.setTemperatureDisplayUnits.bind(this));
    }

    updateHomeBridgeState() {
        this.syncCharacteristic('Active', this.getActive());
        this.syncCharacteristic('CoolingThresholdTemperature', this.getCoolingThresholdTemperature());
        this.syncCharacteristic('CurrentTemperature', this.getCurrentTemperature());
        this.syncCharacteristic('CurrentHeaterCoolerState', this.getCurrentHeaterCoolerState());
        this.syncCharacteristic('HeatingThresholdTemperature', this.getHeatingThresholdTemperature());
        this.syncCharacteristic('LockPhysicalControls', this.getLockPhysicalControls());
        this.syncCharacteristic('RotationSpeed', this.getRotationSpeed());
        this.syncCharacteristic('SwingMode', this.getSwingMode());
        this.syncCharacteristic('TargetHeaterCoolerState', this.getTargetHeaterCoolerState());
    }

    syncCharacteristic(characteristic: string, value: number) {
        if (this.service.getCharacteristic(this.platform.Characteristic[characteristic]).value != value) {
            this.platform.log.debug(`Updating homebridge characteristics HeaterCooler.${characteristic} => ${value}`)
            this.service.getCharacteristic(this.platform.Characteristic[characteristic]).updateValue(value)
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getRotationSpeed(): number {
        let hw_value = this.device.get.fanSpeed();
        return hw_value * 25;
    }

    async setRotationSpeed(service: string, value: CharacteristicValue) {
        let hw_value = Math.ceil(value as number / 25);
        this.platform.log.debug(`Set characteristic ${service}.RotationSpeed -> ${hw_value}`);
        clearTimeout(this.debounce.speed)
        this.debounce.speed = setTimeout(() => { console.log(`setting hw to ${hw_value}`); this.device.set.fanSpeed(hw_value); }, 500);
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


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getActive(): number {
        let active = this.device.get.active();
        let mode = this.device.get.mode();
        return (active && [MhacModeTypes.AUTO, MhacModeTypes.COOL, MhacModeTypes.HEAT].includes(mode)) ?
            this.platform.Characteristic.Active.ACTIVE : this.platform.Characteristic.Active.INACTIVE;
    }

    async setActive(value: CharacteristicValue) {
        let active = value as number;
        let mode = this.device.get.mode();

        this.platform.log.debug(`Set characteristic HeaterCooler.Active -> ${value}`);
        this.device.set.active(active);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getCoolingThresholdTemperature(): number {
        return this.device.get.maxSetpoint();
    }

    async setCoolingThresholdTemperature(value: CharacteristicValue) {
        let setpoint = value as number;
        this.platform.log.debug(`Set characteristic HeaterCooler.CoolingThresholdTemperature -> ${setpoint}`);
        this.device.set.maxSetpoint(setpoint);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getCurrentHeaterCoolerState(): number {
        let currentState: number;
        let characteristic = this.platform.Characteristic;
        let mode = this.device.get.mode();
        let currentTemperature = this.device.get.currentTemperature()
        let minSetpoint = this.device.get.minSetpoint();
        let maxSetpoint = this.device.get.maxSetpoint();

        if (mode == MhacModeTypes.AUTO) {
            if (currentTemperature > maxSetpoint) {
                currentState = characteristic.CurrentHeaterCoolerState.COOLING;
            } else if (currentTemperature < minSetpoint) {
                currentState = characteristic.CurrentHeaterCoolerState.HEATING;
            } else {
                currentState = characteristic.CurrentHeaterCoolerState.IDLE;
            }
        } else if (mode == MhacModeTypes.HEAT) {
            if (currentTemperature < minSetpoint) {
                currentState = characteristic.CurrentHeaterCoolerState.HEATING;
            } else {
                currentState = characteristic.CurrentHeaterCoolerState.IDLE;
            }
        } else if (mode == MhacModeTypes.DRY) {
            currentState = characteristic.CurrentHeaterCoolerState.IDLE;
        } else if (mode == MhacModeTypes.FAN) {
            currentState = characteristic.CurrentHeaterCoolerState.IDLE;
        } else {   // state.mode == MhacModeTypes.COOL
            if (currentTemperature > maxSetpoint) {
                currentState = characteristic.CurrentHeaterCoolerState.COOLING;
            } else {
                currentState = characteristic.CurrentHeaterCoolerState.IDLE;
            }
        }
        return currentState;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getCurrentTemperature(): number {
        return this.device.get.currentTemperature();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getHeatingThresholdTemperature(): number {
        return this.device.get.minSetpoint();
    }

    async setHeatingThresholdTemperature(value: CharacteristicValue) {
        let setpoint = value as number;
        this.platform.log.debug(`Set characteristic HeaterCooler.HeatingThresholdTemperature -> ${setpoint}`);
        this.device.set.minSetpoint(setpoint);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getLockPhysicalControls(): number {
        return this.device.get.locked();
    }

    async setLockPhysicalControls(value: CharacteristicValue) {
        let locked = value as number;
        this.platform.log.debug(`Set characteristic HeaterCooler.LockPhysicalControls -> ${locked}`);
        this.device.set.locked(locked);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getTargetHeaterCoolerState(): number {
        let characteristic = this.platform.Characteristic;

        switch (this.device.get.mode()) {
            case MhacModeTypes.AUTO:
                return characteristic.TargetHeaterCoolerState.AUTO;
            case MhacModeTypes.HEAT:
                return characteristic.TargetHeaterCoolerState.HEAT;
            case MhacModeTypes.DRY:
                return characteristic.TargetHeaterCoolerState.AUTO;
            case MhacModeTypes.FAN:
                return characteristic.TargetHeaterCoolerState.AUTO;
            case MhacModeTypes.COOL:
            default:
                return characteristic.TargetHeaterCoolerState.COOL;
        }
    }

    async setTargetHeaterCoolerState(value: CharacteristicValue) {
        let characteristic = this.platform.Characteristic;
        let mode: number | null = null;

        switch (value) {
            case this.platform.Characteristic.TargetHeaterCoolerState.AUTO:
                mode = MhacModeTypes.AUTO;
                break;
            case this.platform.Characteristic.TargetHeaterCoolerState.COOL:
                mode = MhacModeTypes.COOL;
                break;
            case this.platform.Characteristic.TargetHeaterCoolerState.HEAT:
                mode = MhacModeTypes.HEAT;
                break;
        }

        if (mode != null) {
            this.platform.log.debug(`Set characteristic HeaterCooler.TargetHeaterCoolerState -> ${value}`);
            this.device.set.mode(mode);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getTemperatureDisplayUnits(): number {
        let units = this.accessory.context.device.units;
        units = units ? this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT :
            this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
        return units;
    }

    async setTemperatureDisplayUnits(value: CharacteristicValue) {
        this.accessory.context.device.units = value;
    }
}
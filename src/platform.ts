import { API, APIEvent, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { MHACWIFI1 } from './accessories/device';
import { AirconAccessory, OutdoorTemperatureAccessory } from './accessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';


const DISCOVER_DELAY = 10000;

export type MHACConfig = {
    name: string
    host: string
    username: string
    password: string
    outdoorTemperature: boolean
    mac: string
    info: any     // TODO define this structure
}


/**
 * MitsubishiHeavyAirconPlatform
 *
 * TODO: add description
 */
export class MitsubishiHeavyAirconPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.discoverDevices();
        });
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }

    private async discoverDevices() {

        if (!this.config.devices) {
            this.log.warn('No devices defined - add devices to the config')
            return
        }

        this.log.info('Configuring devices')
        for (const config of this.config.devices) {
            // Default username/password to global settings if not present
            if (!config.username) {
                config.username = this.config.username
            }
            if (!config.password) {
                config.password = this.config.password
            }
            setImmediate(() => { this.discoverDevice(config) });
        }
    }

    private async discoverDevice(config: MHACConfig) {
        this.log.info(`Checking for device at ${config.host}`)
        let device = new MHACWIFI1(this.log, config.host, "", "");
        await device.getInfo()
            .then(info => {
                config.info = info;
                config.mac = info.wlanSTAMAC
                this.log.info(`Found device at address: ${config.host}  [${config.mac}]`);
                this.addDevice(config)
            })
            .catch(error => {
                this.log.info(`No device found at address: ${config.host} (${error})`)
                setTimeout(() => {
                    this.discoverDevice(config);
                }, DISCOVER_DELAY)
            })
    }

    private addDevice(config: MHACConfig) {

        // Create the inteface to the controller
        let device = new MHACWIFI1(this.log, config.host, config.username, config.password)
        device.startSynchronization()

        let uuid = this.api.hap.uuid.generate('aircon' + config.mac);
        let accessory = this.accessories.find(accessory => accessory.UUID === uuid);
        if (accessory) {
            this.log.info(`Restoring aircon accessory from cache: ${accessory.displayName} [${accessory.context.device.mac}]`);
            new AirconAccessory(device, this, accessory, config);
        } else {
            // Create the new accessory and link it to the platform
            this.log.info(`Adding new aircon accessory: ${config.name} [${config.mac}]`);
            const accessory = new this.api.platformAccessory(config.name, uuid);
            accessory.context.device = config;
            new AirconAccessory(device, this, accessory, config);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }

        uuid = this.api.hap.uuid.generate('outdoor' + config.mac);
        accessory = this.accessories.find(accessory => accessory.UUID === uuid);
        if (config.outdoorTemperature) {
            if (accessory) {
                this.log.info(`Restoring outdoor temperature accessory from cache: ${accessory.displayName} [${accessory.context.device.mac}]`);
                new AirconAccessory(device, this, accessory, config);
            } else {
                // Create the new accessory and link it to the platform
                this.log.info(`Adding new outdoor temperature accessory: ${config.name} [${config.mac}]`);
                const accessory = new this.api.platformAccessory(config.name, uuid);
                accessory.context.device = config;
                new OutdoorTemperatureAccessory(device, this, accessory, config);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
        } else {
            if (accessory) {
                // Remove accessory as it was unchecked
                this.log.info(`Removing existing outdoor temperature accessory from cache: ${accessory.displayName} [${accessory.context.device.mac}]`);
                this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
            }
        }

    }
}

import { API, APIEvent, BridgeConfiguration, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge'
import { MHACWIFI1 } from './accessories/device'
import { AirconAccessory, OutdoorTemperatureAccessory } from './accessory'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings'


const DISCOVER_DELAY = 10000

/**
 *  Configuration fields available in PlatformConfig
 *
 *  name: string                           // Name given to the device
 *  host: string                           // IP or hostname
 *  username: string                       // Username used for authentication
 *  password: string                       // Password used for authentication
 *  outdoorTemperature: boolean            // Flag to enable outdoorTemperature monitoring
 *  slowThreshold: number                  // Number of milliseconds before reporting a slow connection
 *  minSetpoint: number                    // Minimum value for the setpoint temperature
 *  maxSetpoint: number                    // Maximum value for the setpoint temperature
 *  syncPeriod: number                     // Number of milliseconds between sensor sync requests
 */

 //   mac: string                            // MAC address for the device
 //   info: Record<string, string>           // TODO define this structure



/**
 * MitsubishiHeavyAirconPlatform
 *
 * TODO: add description
 */
export class MitsubishiHeavyAirconPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic

    private readonly accessories: PlatformAccessory[] = []

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.discoverDevice()
        })
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void {
        this.log.info('Loading accessory from cache:', accessory.displayName)
        this.accessories.push(accessory)
    }

    private async discoverDevice(): Promise<void> {

        let config = this.config

        if (!config.host) {
            this.log.warn(`Host IP not defined for ${config.name}`)
            return
        }

        this.log.info(`Checking for device at ${config.host}`)

        const device = new MHACWIFI1(this.log, config.host, "", "")
        await device.getInfo()
            .then(info => {
                config.info = info
                config.mac = info.wlanSTAMAC
                this.log.info(`Found device at address: ${config.host}  [${config.mac}]`)
                this.addDevice(config)
            })
            .catch(error => {
                this.log.info(`No device found at address: ${config.host} (${error})`)
                setTimeout(() => {
                    this.discoverDevice()
                }, DISCOVER_DELAY)
            })
    }

    private addDevice(config: PlatformConfig): void {

        // Create the inteface to the controller
        config.name = config.name || "Aircon"
        config.slowThreshold = config.slowThreshold || 0
        config.minSetpoint = config.minSetpoint || 0
        config.maxSetpoint = config.maxSetpoint || 100
        config.syncPeriod = config.syncPeriod || 0
        const device = new MHACWIFI1(this.log, config.host, config.username, config.password,
            config.slowThreshold, config.minSetpoint, config.maxSetpoint, config.syncPeriod)
        device.startSynchronization()

        let uuid = this.api.hap.uuid.generate('aircon' + config.mac)
        let accessory = this.accessories.find(accessory => accessory.UUID === uuid)
        if (accessory) {
            this.log.info(`Restoring aircon accessory from cache: ${accessory.displayName} [${accessory.context.device.mac}]`)
            new AirconAccessory(device, this, accessory, config)
        } else {
            // Create the new accessory and link it to the platform
            this.log.info(`Adding new aircon accessory: ${config.name} [${config.mac}]`)
            const accessory = new this.api.platformAccessory(config.name, uuid)
            accessory.context.device = config
            new AirconAccessory(device, this, accessory, config)
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
        }

        uuid = this.api.hap.uuid.generate('outdoor' + config.mac)
        accessory = this.accessories.find(accessory => accessory.UUID === uuid)
        if (config.outdoorTemperature) {
            if (accessory) {
                this.log.info(`Restoring outdoor temperature accessory from cache: ${accessory.displayName} [${accessory.context.device.mac}]`)
                new AirconAccessory(device, this, accessory, config)
            } else {
                // Create the new accessory and link it to the platform
                this.log.info(`Adding new outdoor temperature accessory: ${config.name} [${config.mac}]`)
                const accessory = new this.api.platformAccessory(config.name, uuid)
                accessory.context.device = config
                new OutdoorTemperatureAccessory(device, this, accessory, config)
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
            }
        } else {
            if (accessory) {
                // Remove accessory as it was unchecked
                this.log.info(`Removing existing outdoor temperature accessory from cache: ${accessory.displayName} [${accessory.context.device.mac}]`)
                this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
            }
        }

    }
}

import { API, APIEvent, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { MHACWIFI1 } from './accessories/device';
import { MHACAccessory, MHACConfig } from './accessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';


const DISCOVER_DELAY = 10000;


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

    private devices_to_find = [];

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

    async discoverDevices() {

        this.log.info('Configuring devices')
        this.log.debug(this.config.devices)
        if (!this.config.devices) {
          this.log.info('No devices defined - add devices to the config')
          return
        }

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

        /*
        TODO: implement discovery
        var browser = bonjour.find({
          type: ''
        }, function(result) {
          if (result.txt) {
            for (const address of result.addresses) {
              console.log("%s, %s, %s,  %s:%s", result.type, result.name, result.txt.md, address, result.port);
            }
          } else {
            console.log("Unsupported device found, skipping", result.name);
          }
        });*/

    }

    async discoverDevice(config: MHACConfig) {
      this.log.info(`Checking for device at ${config.host}`)
      let device = new MHACWIFI1(this.log, config.host, "", "");
      await device.getInfo()
          .then(info => {
            config.info = info;
            config.mac = info.wlanSTAMAC
            this.log.info(`Found device at address: ${config.host}  (${config.mac})`);
            this.addDevice(config)
          })
          .catch(error => {
            this.log.info(`No device found at address: ${config.host} (${error})`)
            setTimeout(() => {
              this.discoverDevice(config);
            }, DISCOVER_DELAY)
          })
    }

    addDevice(config: MHACConfig) {
      // Create a unique ID for the device
      const uuid = this.api.hap.uuid.generate(config.mac);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
          // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          existingAccessory.context.device = config;
          this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          let device = new MHACAccessory(this, existingAccessory, config);

          // TODO: remove old devices
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
          this.log.info('Adding new accessory:', config.name);

          // create a new accessory
          const accessory = new this.api.platformAccessory(config.name, uuid);
          accessory.context.device = config;
          new MHACAccessory(this, accessory, config);

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
}

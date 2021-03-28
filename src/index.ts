import { API } from 'homebridge';
import { MitsubishiHeavyAirconPlatform } from './platform';
import { PLATFORM_NAME } from './settings';


export = (api: API) => {
    api.registerPlatform(PLATFORM_NAME, MitsubishiHeavyAirconPlatform);
};

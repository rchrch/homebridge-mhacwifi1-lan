import { Logger } from 'homebridge';
import * as http from 'http';
import { EventEmitter } from 'events';

type CommandResponseType = any;

export enum MhacModeTypes {
    AUTO = 0,
    HEAT = 1,
    DRY = 2,
    FAN = 3,
    COOL = 4,
}

type SensorType = {
    uid: number
    value: number
}

export class MHACWIFI1 extends EventEmitter {

    public syncTimeoutPeriod: number
    public slowThreshold: number

    private sessionID: string
    private syncTimeout: NodeJS.Timeout | null
    private sensorMap: any = {}
    private previousState: any = {}
    private state: any = {}

    constructor(
        private log: Logger,
        private ip: string,
        private username: string,
        private password: string,
    ) {
        super();
        this.sessionID = "";
        this.syncTimeout = null;
        this.syncTimeoutPeriod = 2000;
        this.slowThreshold = 400;
        this._buildSensorMap();
    }

    /**
     * Public API for getting state values
     */
    public get = {
        active: () => { return this.state.active },
        currentTemperature: () => { return this.state.currentTemperature },
        fanSpeed: () => { return this.state.fanSpeed },
        locked: () => { return this.state.remoteDisable },
        maxSetpoint: () => { return this.state.maxSetpoint },
        minSetpoint: () => { return this.state.minSetpoint },
        mode: () => { return this.state.mode },
        outdoorTemperature: () => { return this.state.outdoorTemperature },
        swingMode: () => { return (this.state.verticalPosition == 10) ? 1 : 0 },
        valid: () => Object.keys(this.state).length > 0,
    };

    /**
     * Public API for setting state values
     */
    public set = {
        active: async (value: number) => {
            this.setState('active', value);
        },
        fanSpeed: async (value: number) => {
            this.setState('fanSpeed', value);
        },
        locked: async (value: number) => {
            this.setState('locked', value);
        },
        maxSetpoint: async (value: number) => {
            this.setState('maxSetpoint', value);
        },
        minSetpoint: async (value: number) => {
            this.setState('minSetpoint', value);
        },
        mode: async (value: number) => {
            this.setState('mode', value);
        },
        swingMode: async (value: number) => {
            if (value) {
                this.setState('verticalPosition', 10);
            } else {
                this.setState('verticalPosition', 4);
            }
        }
    }

    /**
     * Enables periodic timer for polling all device sensor states
     */
    startSynchronization() {
        setImmediate(() => { this.syncState() });
    }

    /**
     * Stops the periodic polling for sensor states
     */
    stopSynchronization() {
        if (this.syncTimeout)
            clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
    }

    /**
     * Reads all sensors values from the device and caches them into the `state` variable.
     */
    async syncState() {
        if (!this.sessionID) {
            this.log.debug('Logging in to obtain a session ID');
            await this.login()
                .then(() => {
                    this.log.debug('Obtained session ID', this.sessionID);
                })
                .catch(error => {
                    this.log.error('Unable to authenticate', error);
                    this.sessionID = "";
                    this.previousState = {}
                    this.state = {}
                });
        }

        if (this.sessionID) {
            // this.log.debug('Refreshing state')
            let start = Date.now()
            await this.refreshState()
                .then(() => {
                    let query_time = Date.now() - start;
                    if (query_time > this.slowThreshold) {
                        this.log.warn(`Slow response time from ${this.ip} query time ${query_time}ms`);
                    }

                    // Check all state values to see if anything changed.  If change
                    // has occurred, emit appropriate signals.
                    let changed = false;
                    Object.keys(this.state).forEach((key) => {
                        if (this.state[key] != this.previousState[key]) {
                            changed = true;
                            this.log.info(`State change for ${key}  ${this.previousState[key]} => ${this.state[key]}`);
                            this.emit('change', key, this.previousState[key], this.state[key]);
                            this.previousState[key] = this.state[key];
                        }
                    })
                    if (changed) {
                        setTimeout(() => { this.emit('refresh'); }, 100);
                    }
                })
                .catch(error => {
                    this.log.error('Unable to refresh state', error);
                    this.sessionID = "";
                    this.previousState = {}
                    this.state = {}
                });
        }

        this.syncTimeout = setTimeout(async () => { this.syncState() }, this.syncTimeoutPeriod)
    }

    /**
     * Requests hardware configuration information from the device
     *
     * @returns Object containing device information such as firmware version
     */
    async getInfo() {
        let result = await this.httpRequest("getinfo", {})
        return result.info
    }

    /**
     * Performs login with the device
     *
     * @returns Session ID if login is successful
     */
    async login() {
        let result = await this.httpRequest("login", { username: this.username, password: this.password })
        this.sessionID = result.id.sessionID
        return result.id.sessionID
    }

    /**
     * Performs device logout
     */
    async logout() {
        await this.httpRequest("logout", {});
        this.sessionID = "";
    }

    /**
     * Queries all sensors on the device
     *
     * After the device query, the returned values are normalized into the
     * "state" object variable.
     *
     */
    async refreshState() {
        let result = await this.httpRequest("getdatapointvalue", { uid: "all" })
        this.parseState(result.dpval)
    }

    /**
     * Converts the raw sensor data into normalized state values
     *
     * @param states
     */
    private parseState(sensors: SensorType[]) {
        sensors.forEach(item => {
            let map = this.sensorMap[item.uid];
            if (!map) {
                this.log.error('Unhandled sensor item', item);
                return;
            }
            if (!map.attr) {
                return;
            }
            this.state[map.attr] = map.xform ? map.xform(item.value) : item.value;
        });
    }

    /**
     * Sets the given sensor to the given value
     *
     * @param attr  Attribute name
     * @param value Normalized value (will be mapped into device specific value)
     */
    private async setState(attr: string, value: number) {
        let map = this.sensorMap[attr];
        if (this.state[attr] == value) {
            this.emit('refresh');
        }
        let xvalue = map.xform ? map.xform(value) : value
        this.log.debug(`setState attr=${attr}, uid=${map.uid}, value=${xvalue}`);
        await this.httpRequest("setdatapointvalue", { uid: map.uid, value: xvalue });
        this.state[attr] = value;
        this.emit('refresh');
    }

    /**
     * Sends an HTTP POST request to the device with the given command
     *
     * This function takes care of adding sessionID credentials to the request
     * from current login.  Returned result is the "data" field in the
     * response json payload.
     *
     * @param command   Command for the request
     * @param data      Parameters associated with the command
     * @returns         JSON data returned by the device
     */
    private httpRequest(command: string, data: object) {
        if (command != "getdatapointvalue") {
            // Log before adding credentials
            this.log.debug(`httpRequest: ${command} ${JSON.stringify(data)}`)
        }
        data['sessionID'] = this.sessionID;
        const payload = JSON.stringify({ command: command, data: data });

        const options = {
            hostname: this.ip,
            path: "/api.cgi",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": payload.length
            }
        };

        return new Promise<CommandResponseType>((resolve, reject) => {

            const req = http.request(options, (resp) => {
                let buffer = new Array();

                if (resp.statusCode != 200) {
                    this.log.debug(`Received http error code ${resp.statusCode} for ${command}`);
                    reject({ code: resp.statusCode, message: "Invalid HTTP response" })
                }

                resp.on("data", (chunk: string) => buffer.push(chunk));
                resp.on("end", () => {
                    let content = buffer.join("").toString();
                    let result = JSON.parse(content);
                    result.code = resp.statusCode;
                    if (result.success) {
                        resolve(result.data);
                    } else {
                        this.log.debug(`Received http error response: ${content}`)
                        reject(result);
                    }
                });
            });

            req.on("error", (error) => {
                this.log.error(`Http request error: ${error}`)
                reject(error);
            });
            req.write(payload);
            req.end();
        });
    }

    /**
     * Converts the SensorCOnfigMap into a two-way translation structure for converting
     * uid <-> attrName and human-values <-> machine-values.
     */
    private _buildSensorMap() {
        SensorConfigMap.forEach(sensor => {
            let rev_values = {}
            for (const key in sensor.values) {
                rev_values[sensor.values[key]] = key;
            };

            this.sensorMap[sensor.uid] = {
                attr: sensor.attr,
                values: sensor.values,
                xform: sensor.fromVal,
            };
            if (sensor.attr) {
                this.sensorMap[sensor.attr] = {
                    uid: sensor.uid,
                    values: rev_values,
                    xform: sensor.toVal,

                };
            }
        });

    }
}

const SensorConfigMap = [
    {
        uid: 1,
        attr: "active",
        values: {
            0: "off",
            1: "on",
        }
    },
    {
        uid: 2,
        attr: "mode",
        values: {
            "auto": 0,
            "heat": 1,
            "dry": 2,
            "fan": 3,
            "cool": 4,
        },
    },
    {
        uid: 4,
        attr: "fanSpeed",
        values: {
            "auto": 0,
            "quiet": 1,
            "low": 2,
            "medium": 3,
            "high": 4,
        }
    },
    {
        uid: 5,
        attr: "verticalPosition",
        values: {
            "auto": 0,
            "pos-ll": 1,
            "pos-lm": 2,
            "pos-rm": 3,
            "pos-rr": 4,
            "swing": 10,
            "swirl": 11,
            "wide": 12
        }
    },
    {
        uid: 9,
        attr: 'userSetpoint',
        fromVal: (v: number) => { if (v == 32768) { return 30; } else { return v / 10.0 } },
        toVal: (v: number) => { return v * 10.0 },
    },
    {
        uid: 10,
        attr: 'currentTemperature',
        fromVal: (v: number) => { return v / 10.0 },
    },
    {
        uid: 12,
        attr: 'remoteDisable',
        values: {
            0: "off",
            1: "on",
        }
    },
    {
        uid: 13,
        attr: 'onTime',
        // Number of hours the unit has been on
    },
    {
        uid: 14,
        attr: 'alarmStatus',
        values: {
            0: "off",
            1: "on",
        }
    },
    {
        uid: 15,
        attr: 'errorCode',
        // Error status code
    },
    {
        uid: 34,
        attr: 'quietMode',
        values: {
            0: "off",
            1: "on",
        }
    },
    {
        uid: 35,
        attr: 'minSetpoint',
        toVal: (v: number) => { return v * 10.0 },
        fromVal: (v: number) => { return v / 10.0 },
    },
    {
        uid: 36,
        attr: 'maxSetpoint',
        toVal: (v: number) => { return v * 10.0 },
        fromVal: (v: number) => { return v / 10.0 },
    },
    {
        uid: 37,
        attr: 'outdoorTemperature',
        fromVal: (v: number) => { return v / 10.0 },
    },
    { uid: 181 },       // ignore this code
    { uid: 182 },       // ignore this code
    { uid: 183 },       // ignore this code
    { uid: 184 },       // ignore this code
];

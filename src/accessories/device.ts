import { EventEmitter } from "events"
import * as http from "http"
import { setTimeout, setImmediate } from "timers/promises"
import { Logger } from "homebridge"

export enum MhacModeTypes {
    AUTO = 0,
    HEAT = 1,
    DRY = 2,
    FAN = 3,
    COOL = 4,
}

export const EVENT_CHANGED = "changed"
export const EVENT_UPDATED = "updated"

type CommandResponseType = any;         // eslint-disable-line @typescript-eslint/no-explicit-any

type SensorType = {
    uid: number
    value: number
}


/**
 * Hardware interface class for the MH-AC-WIFI-1
 *
 * This class provides local HTTP access to the Intesis WIFI control board used
 * in the Mitsubishi Heavy Aircon.
 *
 * If enabled (via the `startSynchronization` method), the object periodically
 * polls all of the device's sensors and reflects those back in the `state`
 * property of the class.  When sensors change values, the object will emit
 * an `update` event to notify listeners that at least one value in the state
 * has changed.  For specific changes, listeners can monitor the `changed`
 * event for the specific state that changed.
 *
 * The aircon status should be obtained through the `get` API such as obj.get.active()
 * or obj.get.currentTemperature().  To control the aircon, you use the `set`
 * API such as obj.set.active(1) or object.setFanSpeed(2).
 */
export class MHACWIFI1 extends EventEmitter {

    private sessionID = ""
    private enabled: boolean = true

    private sensorMap: any = {}             // eslint-disable-line @typescript-eslint/no-explicit-any
    private previousState: any = {}         // eslint-disable-line @typescript-eslint/no-explicit-any
    private state: any = {}                 // eslint-disable-line @typescript-eslint/no-explicit-any

    constructor(
        private log: Logger,
        private host: string,                            // IP or hostname
        private username: string,                        // Username used for authentication
        private password: string,                        // Password used for authentication
        private slowThreshold: number = 500,             // Number of milliseconds before reporting a slow connection
        private minSetpoint: number = 18,                // Minimum value for the setpoint temperature
        private maxSetpoint: number = 30,                // Maximum value for the setpoint temperature
        private syncPeriod: number = 1000,               // Number of milliseconds between sensor sync requests
    ) {
        super()
        this.minSetpoint = Math.max(18, minSetpoint)
        this.state.minSetpoint = this.minSetpoint
        this.log.info(`Minimum setpoint is ${this.minSetpoint}`)
        this.maxSetpoint = Math.min(30, maxSetpoint)
        this.state.maxSetpoint = this.maxSetpoint
        this.log.info(`Minimum setpoint is ${this.maxSetpoint}`)
        this.slowThreshold = slowThreshold || 500
        this.log.info(`Slow device threshold is ${this.slowThreshold}ms`)
        this.syncPeriod = Math.max(1000, syncPeriod)
        this.log.info(`Device sync period is ${this.syncPeriod}ms`)
        this._buildSensorMap()
    }

    /**
     * Public API for getting state values
     */
    public get = {
        active: (): number => this.state.active,
        currentTemperature: (): number => this.state.currentTemperature,
        fanSpeed: (): number => this.state.fanSpeed,
        locked: (): number => this.state.remoteDisable,
        maxSetpoint: (): number => this.state.maxSetpoint,
        minSetpoint: (): number => this.state.minSetpoint,
        mode: (): number => this.state.mode,
        outdoorTemperature: (): number => this.state.outdoorTemperature,
        setpoint: (): number => this.state.setpoint,
        swingMode: (): number => (this.state.verticalPosition === 10) ? 1 : 0,
        valid: (): boolean => typeof this.state.active !== "undefined",
    }

    /**
     * Public API for setting state values
     *
     */
    public set = {
        active: async (value: number): Promise<void> => {
            this.setState("active", value)
        },
        fanSpeed: async (value: number): Promise<void> => {
            this.setState("fanSpeed", value)
        },
        locked: async (value: number): Promise<void> => {
            this.setState("remoteDisable", value)
        },
        maxSetpoint: async (value: number): Promise<void> => {
            this.setState("maxSetpoint", value)
        },
        minSetpoint: async (value: number): Promise<void> => {
            this.setState("minSetpoint", value)
        },
        mode: async (value: number): Promise<void> => {
            this.setState("mode", value)
        },
        setpoint: async (value: number): Promise<void> => {
            this.setState("setpoint", value)
        },
        swingMode: async (value: number): Promise<void> => {
            if (value) {
                this.setState("verticalPosition", 10)
            } else {
                this.setState("verticalPosition", 4)
            }
        },
    }

    /**
     * Enables periodic timer for polling all device sensor states
     */
    public startSynchronization(): void {
        this.syncState()
    }

    /**
     * Requests hardware configuration information from the device
     *
     * @returns Object containing device information such as firmware version
     */
    public async getInfo(): Promise<Record<string, string>> {
        const result = await this.httpRequest("getinfo", {})
        return result.info
    }

    /**
     * Performs login with the device
     *
     * @returns Session ID if login is successful
     */
    public async login(): Promise<string> {
        const result = await this.httpRequest("login", { username: this.username, password: this.password })
        this.sessionID = result.id.sessionID
        this.previousState = {}
        this.state = {}
        return result.id.sessionID
    }

    /**
     * Performs device logout
     */
    public async logout(): Promise<void> {
        await this.httpRequest("logout")
        this.resetState()
    }

    /**
     * Returns the services that are currently available
     *
     * @returns List of service commands available on device
     */
    public async getAvailableServices(): Promise<string[]> {
        const result = await this.httpRequest("getavailableservices")
        return result.userinfo.servicelist
    }

    /**
     * Returns the services that are currently available
     *
     * @returns List of service commands available on device
     */
    public async getAvailableDatapoints(): Promise<Record<string, unknown>> {
        const result = await this.httpRequest("getavailabledatapoints")
        return result.dp.datapoints
    }

    /**
     * Queries all sensors on the device
     *
     * After the device query, the returned values are normalized into the
     * "state" object variable.
     *
     */
    public async refreshState(): Promise<void> {
        const result = await this.httpRequest("getdatapointvalue", { uid: "all" })
        this.parseState(result.dpval)
    }

    /**
     * Reads all sensors values from the device and caches them into the `state` variable.
     */
    private async syncState() {
        while (this.enabled) {
            const waitTime = await this._syncState()
            await setTimeout(waitTime)
        }
    }

    private async _syncState(): Promise<number> {
        if (!this.sessionID) {
            this.log.debug("Logging in to obtain a session ID")
            await this.login()
                .then(() => {
                    this.log.debug("Obtained a new session ID")
                })
                .catch(error => {
                    this.log.error("Unable to authenticate", error)
                    this.resetState()
                })
            if (this.sessionID) {
                await this.getAvailableServices()
                    .then((result) => {
                        this.log.debug(`Available services: ${JSON.stringify(result)}`)
                    })
                    .catch(error => {
                        this.log.error("Unable to get available services", error)
                        this.resetState()
                    })

                await this.getAvailableDatapoints()
                    .then((result) => {
                        this.log.debug(`Available datapoints: ${JSON.stringify(result)}`)
                    })
                    .catch(error => {
                        this.log.error("Unable to get available services", error)
                        this.resetState()
                    })

                // Set sane defaults
                await this.set.minSetpoint(this.minSetpoint)
                    .catch(error => {
                        this.log.error("Unable to get set minSetpoint value", error)
                    })
                await this.set.maxSetpoint(this.maxSetpoint)
                    .catch(error => {
                        this.log.error("Unable to get set maxSetpoint value", error)
                    })
            }
        }

        if (this.sessionID) {
            // this.log.debug('Refreshing state')
            const start = Date.now()
            await this.refreshState()
                .then(() => {
                    const query_time = Date.now() - start
                    if (query_time > this.slowThreshold) {
                        this.log.warn(`Slow response time from ${this.host} query time ${query_time}ms`)
                    }
                    this.checkForChange()
                })
                .catch(error => {
                    this.log.error("Unable to refresh state", error)
                    this.resetState()
                })

            return this.syncPeriod
        } else {
            // Not logged in. slow down the polling
            return 30000
        }
    }

    /**
     * Clears all state information and sessionID
     */
    private resetState(): void {
        this.log.info("Resetting device state")
        this.sessionID = ""
        this.previousState = {}
        this.state = {}
    }

    /**
     * Converts the raw sensor data into normalized state values
     *
     * @param states
     */
    private parseState(sensors: SensorType[]): void {
        sensors.forEach(item => {
            const map = this.sensorMap[item.uid]
            if (!map) {
                this.log.error("Unhandled sensor item", item)
                return
            }
            if (!map.attr) {
                return
            }
            this.state[map.attr] = map.xform ? map.xform(item.value) : item.value
        })
    }

    /**
     * Checks previous and current state for differences and emits signal on difference
     *
     * Emits a EVENT_CHANGED event for each changed property with property name, old
     * value, and new value.  Emits a generic EVENT_UPDATED property if any property
     * values have changed.
     */
    private async checkForChange() {
        let changed = false
        Object.keys(this.state).forEach((attr) => {
            if (this.state[attr] !== this.previousState[attr]) {
                changed = true
                this.log.info(`State change for ${attr}  ${this.previousState[attr]} => ${this.state[attr]}`)
                this.emit(EVENT_CHANGED, attr, this.previousState[attr], this.state[attr])
                this.previousState[attr] = this.state[attr]
            }
        })
        if (changed) {
            await setImmediate(() => {
                this.emit(EVENT_UPDATED)
            })
        }
    }

    /**
     * Sets the given sensor to the given value
     *
     * @param attr  Attribute name
     * @param value Normalized value (will be mapped into device specific value)
     */
    private async setState(attr: string, value: number) {
        const map = this.sensorMap[attr]
        const xvalue = map.xform ? map.xform(value) : value
        let tries = 0
        let success = false
        while (!success && tries < 3) {
            tries += 1
            this.log.debug(`setState attr=${attr}, uid=${map.uid}, value=${xvalue}`)
            await this.httpRequest("setdatapointvalue", { uid: map.uid, value: xvalue })
                .then(async () => {
                    success = true
                    this.state[attr] = value
                    await setTimeout(1000)   // Delay here because the air-con is slow to update (helps debounce)
                    this.checkForChange()
                })
                .catch(async error => {
                    this.log.warn(`Unable to set state for ${attr} to ${value}: ${error}`)
                    await setTimeout(2000)   // Sleep a bit before trying again
                })
        }
        if (!success) {
            this.log.error(`Unable to set state for ${attr} to ${value} after ${tries} attempts`)
        }
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
    private httpRequest(command: string, data: Record<string, unknown> = {}) {
        if (command !== "getdatapointvalue") {
            // Log before adding credentials
            this.log.debug(`httpRequest: ${command} ${JSON.stringify(data)}`)
        }
        data.sessionID = this.sessionID
        const payload = JSON.stringify({ command: command, data: data })

        const options = {
            hostname: this.host,
            timeout: 5000,
            path: "/api.cgi",
            method: "POST",
            headers: {
                "Content-Length": payload.length,
                "Content-Type": "application/json",
            },
        }

        return new Promise<CommandResponseType>((resolve, reject) => {
            const req = http.request(options, (res) => {
                if (res.statusCode !== 200) {
                    this.log.debug(`Received http error code ${res.statusCode} for ${command}`)
                    reject({ code: res.statusCode, message: "Invalid HTTP response" })
                }

                const buffer: string[] = []
                res.on("data", (chunk: string) => buffer.push(chunk))
                res.on("end", () => {
                    const content = buffer.join("").toString()
                    const result = JSON.parse(content)
                    if (result.success) {
                        resolve(result.data)
                    } else {
                        this.log.debug(`Received http error response: ${content}`)
                        reject(result)
                    }
                })
            })
            req.on("timeout", () => {
                this.log.error("Http request timeout")
                req.destroy()
            })
            req.on("error", (error) => {
                this.log.error(`Http request error: ${error}`)
                reject(error)
            })
            req.write(payload)
            req.end()
        })
    }

    /**
     * Converts the SensorCOnfigMap into a two-way translation structure for converting
     * uid <-> attrName and human-values <-> machine-values.
     */
    private _buildSensorMap() {
        SensorConfigMap.forEach(sensor => {
            const rev_values = {}
            for (const key in sensor.values) {
                rev_values[sensor.values[key]] = key
            }

            this.sensorMap[sensor.uid] = {
                attr: sensor.attr,
                values: sensor.values,
                xform: sensor.fromVal,
            }
            if (sensor.attr) {
                this.sensorMap[sensor.attr] = {
                    uid: sensor.uid,
                    values: rev_values,
                    xform: sensor.toVal,

                }
            }
        })

    }
}

const SensorConfigMap = [
    {
        uid: 1,
        attr: "active",
        values: {
            0: "off",
            1: "on",
        },
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
            "quiet": 1,
            "low": 2,
            "medium": 3,
            "high": 4,
        },
    },
    {
        uid: 5,
        attr: "verticalPosition",
        values: {
            "auto": 0,
            "pos-1": 1,
            "pos-2": 2,
            "pos-3": 3,
            "pos-4": 4,
            "pos-5": 5,
            "pos-6": 6,
            "pos-7": 7,
            "pos-8": 8,
            "pos-9": 9,
            "swing": 10,
            "swirl": 11,
            "wide": 12,
        },
    },
    {
        uid: 9,
        attr: "setpoint",
        fromVal: (v: number) => { if (v === 32768) { return 28 } else { return v / 10.0 } },
        toVal: (v: number) => { return v * 10.0 },
    },
    {
        uid: 10,
        attr: "currentTemperature",
        fromVal: (v: number) => { return v / 10.0 },
    },
    {
        uid: 12,
        attr: "remoteDisable",
        values: {
            0: "off",
            1: "on",
        },
    },
    {
        uid: 13,
        attr: "onTime",
        // Number of hours the unit has been on
    },
    {
        uid: 14,
        attr: "alarmStatus",
        values: {
            0: "off",
            1: "on",
        },
    },
    {
        uid: 15,
        attr: "errorCode",
        // Error status code
    },
    {
        uid: 34,
        attr: "quietMode",
        values: {
            0: "off",
            1: "on",
        },
    },
    {
        uid: 35,
        attr: "minSetpoint",
        toVal: (v: number) => { return v * 10.0 },
        fromVal: (v: number) => { return v / 10.0 },
    },
    {
        uid: 36,
        attr: "maxSetpoint",
        toVal: (v: number) => { return v * 10.0 },
        fromVal: (v: number) => { return v / 10.0 },
    },
    {
        uid: 37,
        attr: "outdoorTemperature",
        fromVal: (v: number) => { return v / 10.0 },
    },
    { uid: 181 },       // ignore this code
    { uid: 182 },       // ignore this code
    { uid: 183 },       // ignore this code
    { uid: 184 },       // ignore this code
]

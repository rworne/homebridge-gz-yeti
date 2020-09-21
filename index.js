"use strict";

var Accessory, hap, Service, Characteristic;

const request = require("request");

const fetch = require("node-fetch");

const url = require("url");

let jsonInfo = "";
let jsonInfoAvailable = false;

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    hap = homebridge.hap;
    Service = hap.Service;
    Characteristic = hap.Characteristic;
    homebridge.registerAccessory("homebridge-gz-yeti", "gz-yeti", myYeti);
};

function myYeti(log, config, api) {
    this.config = config;
    this.log = log;
    this.api = api;
    this.url = url.parse(config["url"]);
    this.sysinfourl = url.parse(config["url"] + "/sysinfo");
    this.stateurl = url.parse(config["url"] + "/state");
    this.joindirecturl = url.parse(config["url"] + "/join-direct");
    this.rebooturl = url.parse(config["url"] + "/rpc/Sys.Reboot");
    this.joinurl = url.parse(config["url"] + "/join");
    this.wifiurl = url.parse(config["url"] + "/wifi");
    this.manufacturer = "GoalZero";
    this.name = config["name"] || "My Name";
    this.model = config["model"] || "My Model";
    this.firmwareVersion = config["firmwareversion"] || "My FirmwareVersion";
    this.macaddress = config["macaddress"] || "My Macaddress";
    this.platform = "My Platform";
    this.thingName = config["devname"] || "My Devicename";
    this.v12PortStatus = "My DC Status";
    this.usbPortStatus = "My DC Status";
    this.acPortStatus = "My DC Status";
    this.backlight = "My DC Status";
    this.app_online = "My DC Status";
    this.wattsIn = "My DC Status";
    this.ampsIn = "My DC Status";
    this.wattsOut = "My DC Status";
    this.ampsOut = "My DC Status";
    this.whOut = "My DC Status";
    this.whStored = "My DC Status";
    this.volts = "My DC Status";
    this.socPercent = "My DC Status";
    this.isCharging = "My DC Status";
    this.timeToEmptyFull = "My DC Status";
    this.temperature = "My DC Status";
    this.wifiStrength = "My DC Status";
    this.timestamp = "My DC Status";
    this.version = "My DC Status";
    this.showHumidity = config["showHumidity"] || "no";
    this.tempUnits = "0"; // "celsius"

    this.api.on("didFinishLaunching", this.didFinishLaunching.bind(this));
}

myYeti.prototype = {
    getSysInfo: function() {
        me = this;
        fetch(this.sysinfourl)
            .then((res) => res.json())
            .then((json) => sysInfoSub(json));

        function sysInfoSub(json) {
            jsonInfo = json;
            jsonInfoAvailable = true;
            this.thingname = jsonInfo.name;
            this.model = jsonInfo.model;
            this.firmwareVersion = jsonInfo.firmwareVersion;
        }

        function stateSub(json) {
            jsonInfo = json;
            jsonInfoAvailable = true;
            me.v12PortStatus = jsonInfo.v12PortStatus;
            me.usbPortStatus = jsonInfo.usbPortStatus;
            me.acPortStatus = jsonInfo.acPortStatus;
            me.backlight = jsonInfo.backlight;
            me.app_online = jsonInfo.app_online;
            me.wattsIn = jsonInfo.wattsIn;
            me.ampsIn = jsonInfo.ampsIn;
            me.wattsOut = jsonInfo.wattsOut;
            me.ampsOut = jsonInfo.ampsOut;
            me.whOut = jsonInfo.whOut;
            me.whStored = jsonInfo.whStored;
            me.volts = jsonInfo.voltes;
            me.socPercent = jsonInfo.socPercent;
            me.isCharging = jsonInfo.isCharging;
            me.timeToEmptyFull = jsonInfo.timeToEmpty;
            me.temperature = jsonInfo.temperature;
            me.wifiStrength = jsonInfo.wifiStrength;
            me.timestamp = jsonInfo.timestamp;
            me.version = jsonInfo.version;
        }
    },
    didFinishLaunching: function() {
        const me = this;
        me.log("Finished Launching!");
        this.getSysInfo();
    },
    getServices: function() {
        this.services = [];
        const me = this;
        me.log("getServices!");
        /* Information Service */

        let informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, me.manufacturer)
            .setCharacteristic(Characteristic.Model, me.model)
            .setCharacteristic(Characteristic.Name, me.name)
            .setCharacteristic(Characteristic.Model, me.model)
            .setCharacteristic(Characteristic.SerialNumber, me.macaddress)
            .setCharacteristic(Characteristic.FirmwareRevision, me.firmwareversion);
        informationService
            .getCharacteristic(Characteristic.HardwareRevision)
            .on("get", this.getFirmwareCharacteristic.bind(this));
        informationService
            .getCharacteristic(Characteristic.SoftwareRevision)
            .on("get", this.getFirmwareCharacteristic.bind(this));
        informationService
            .getCharacteristic(Characteristic.Version)
            .on("get", this.getFirmwareCharacteristic.bind(this));
        this.services.push(informationService);
        /* Battery Service */

        let batteryService = new Service.BatteryService();
        batteryService
            .getCharacteristic(Characteristic.BatteryLevel)
            .on("get", this.getBatteryLevelCharacteristic.bind(this));
        batteryService
            .getCharacteristic(Characteristic.ChargingState)
            .on("get", this.getChargingStateCharacteristic.bind(this));
        batteryService
            .getCharacteristic(Characteristic.StatusLowBattery)
            .on("get", this.getLowBatteryCharacteristic.bind(this));
        this.services.push(batteryService);
        /* Humidity Service */

        if (this.showHumidity !== "no") {
            let humidityService = new Service.HumiditySensor("Battery level");
            humidityService
                .getCharacteristic(Characteristic.CurrentRelativeHumidity)
                .on("get", this.getBatteryLevelCharacteristic.bind(this));
            this.services.push(humidityService);
            this.humidityService = humidityService;
        }
        /* Switch Service */

        let DC12VswitchService = new Service.Switch("12V Power", "12vswitch");
        DC12VswitchService.getCharacteristic(Characteristic.On)
            .on("get", this.get12VSwitchOnCharacteristic.bind(this))
            .on("set", this.set12VSwitchOnCharacteristic.bind(this));
        this.services.push(DC12VswitchService);
        let ACswitchService = new Service.Switch("AC Power", "ACswitch");
        ACswitchService.getCharacteristic(Characteristic.On)
            .on("get", this.getACSwitchOnCharacteristic.bind(this))
            .on("set", this.setACSwitchOnCharacteristic.bind(this));
        this.services.push(ACswitchService);
        let USBswitchService = new Service.Switch("USB Power", "USBswitch");
        USBswitchService.getCharacteristic(Characteristic.On)
            .on("get", this.getUSBSwitchOnCharacteristic.bind(this))
            .on("set", this.setUSBSwitchOnCharacteristic.bind(this));
        this.services.push(USBswitchService);
        let BLswitchService = new Service.Switch("Backlight Power", "BLswitch");
        BLswitchService.getCharacteristic(Characteristic.On)
            .on("get", this.getBLSwitchOnCharacteristic.bind(this))
            .on("set", this.setBLSwitchOnCharacteristic.bind(this));
        this.services.push(BLswitchService);
        /* Temperature service */

        let tempService = new Service.TemperatureSensor("Temperature");
        tempService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .on("get", this.getTemperatureCharacteristic.bind(this));
        tempService.getCharacteristic(
            Characteristic.TemperatureUnits,
            this.tempUnits
        );
        this.services.push(tempService);
        this.tempService = tempService;
        this.BLswitchService = BLswitchService;
        this.DC12VswitchService = DC12VswitchService;
        this.ACswitchService = ACswitchService;
        this.USBswitchService = USBswitchService;
        this.informationService = informationService;
        this.batteryService = batteryService;
        return this.services;
    },
    identify: function(callback) {
        const me = this;
        me.log("Identify requested!");

        if (jsonInfoAvailable) {
            try {
                me.log("============================");
                me.log("Yeti Manufacturer: " + this.manufacturer);
                me.log("Yeti Name: " + jsonInfo.name);
                me.log("Yeti Model: " + jsonInfo.model);
                me.log("Yeti firmware version: " + jsonInfo.firmwareVersion);
                me.log("Yeti MAC Address: " + jsonInfo.macAddress);
                me.log("Yeti Platform: " + jsonInfo.platform);
                me.log("============================");
            } catch (error) {
                me.log("Something Went Wrong");
            }
        }

        callback(); // success
    },
    getFirmwareCharacteristic: function(next) {
        const me = this;
        request({
                url: me.sysinfourl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("getFirmware  error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);
                me.log("Firmware: " + obj.firmwareVersion);
                return next(null, obj.firmwareVersion);
            }
        );
    },
    getModelNumberCharacteristic: function(next) {
        const me = this;
        request({
                url: me.sysinfourl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("getModelNumber  error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);
                me.log("Model: " + obj.model);
                return next(null, obj.model);
            }
        );
    },
    getSerialNumberCharacteristic: function(next) {
        const me = this;
        request({
                url: me.sysinfourl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("getSerialNumber  error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);
                me.log("SerialNumber: " + obj.macAddress);
                return next(null, obj.macAddress);
            }
        );
    },
    getBatteryLevelCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("BattLevel error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);
                me.log("Battery level: " + obj.socPercent);
                return next(null, obj.socPercent);
            }
        );
    },
    getChargingStateCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                var chargingStatus = 0;

                if (error) {
                    me.log("Charge State error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.isCharging === 1) {
                    chargingStatus = 1;
                }

                if (chargingStatus > 0) {
                    me.log("Yeti is Charging");
                }

                return next(null, chargingStatus);
            }
        );
    },
    // this has a max value of a little over an hour, making it useless
    getRemainingTimeCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                var timeStatus = 0;

                if (error) {
                    me.log("Charge State error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.timeToEmptyFull === -1) {
                    timeStatus = 0;
                } else {
                    timeStatus = obj.timeToEmptyFull; //timeToEmptyFull is in minutes
                }

                timeStatus = timeStatus * 60;

                if (timeStatus > 0) {
                    me.log("ChargingTime: " + timeStatus + " seconds");
                }

                return next(null, timeStatus);
            }
        );
    },
    getLowBatteryCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Low Battery error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.socPercent <= 20) {
                    return next(null, 1);
                    me.log("YETI HAS LOW BATTERY!");
                } else {
                    return next(null, 0);
                }
            }
        );
    },
    getTempUnitCharacteristic: function(next) {
        const me = this;
        var units = 0; //0 = celsius, 1 = Fahrenheit

        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Get Switch on error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.v12PortStatus === 1) {
                    DC12Von = true;
                } else if (obj.v12PortStatus === 0) {
                    DC12Von = false;
                }

                return next(null, DC12Von);
            }
        );
    },
    getBLSwitchOnCharacteristic: function(next) {
        const me = this;
        var BLon = false;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Get BL on error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.backlight === 1) {
                    BLon = true;
                } else if (obj.backlight === 0) {
                    BLon = false;
                }

                return next(null, BLon);
            }
        );
    },
    get12VSwitchOnCharacteristic: function(next) {
        const me = this;
        var DC12Von = false;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Get Switch on error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.v12PortStatus === 1) {
                    DC12Von = true;
                } else if (obj.v12PortStatus === 0) {
                    DC12Von = false;
                }

                return next(null, DC12Von);
            }
        );
    },
    getACSwitchOnCharacteristic: function(next) {
        const me = this;
        var ACon = false;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Get Switch on error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.acPortStatus === 1) {
                    ACon = true;
                } else if (obj.acPortStatus === 0) {
                    ACon = false;
                }

                return next(null, ACon);
            }
        );
    },
    getUSBSwitchOnCharacteristic: function(next) {
        const me = this;
        var USBon = false;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Get Switch on error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);

                if (obj.usbPortStatus === 1) {
                    USBon = true;
                } else if (obj.usbPortStatus === 0) {
                    USBon = false;
                }

                return next(null, USBon);
            }
        );
    },
    setBLSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";

        if (on) {
            onstring = '{"backlight":1}';
        } else {
            onstring = '{"backlight":0}';
        }

        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: "POST"
            },
            function(error, response) {
                if (error) {
                    me.log("Set BL on error: " + error.message);
                    return next(error);
                }

                return next();
            }
        );
    },
    set12VSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";

        if (on) {
            onstring = '{"v12PortStatus":1}';
        } else {
            onstring = '{"v12PortStatus":0}';
        }

        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: "POST"
            },
            function(error, response) {
                if (error) {
                    me.log("Set Switch on error: " + error.message);
                    return next(error);
                }

                return next();
            }
        );
    },
    setACSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";

        if (on) {
            onstring = '{"acPortStatus":1}';
        } else {
            onstring = '{"acPortStatus":0}';
        }

        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: "POST"
            },
            function(error, response) {
                if (error) {
                    me.log("Set Switch on error: " + error.message);
                    return next(error);
                }

                return next();
            }
        );
    },
    setUSBSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";

        if (on) {
            onstring = '{"usbPortStatus":1}';
        } else {
            onstring = '{"usbPortStatus":0}';
        }

        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: "POST"
            },
            function(error, response) {
                if (error) {
                    me.log("Set Switch on error: " + error.message);
                    return next(error);
                }

                return next();
            }
        );
    },
    getTemperatureCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: "GET"
            },
            function(error, response, body) {
                if (error) {
                    me.log("Temperature error: " + error.message);
                    return next(error);
                }

                var obj = JSON.parse(body);
                me.log("Temperature: " + obj.temperature);
                return next(null, obj.temperature);
            }
        );
    }
};

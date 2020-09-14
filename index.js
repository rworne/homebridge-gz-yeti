var Service, Characteristic;
var superagent = require('superagent');
const request = require('request');
const fetch = require('node-fetch');
const url = require('url');
let jsonInfo = "";
let jsonInfoAvailable = false;
let isModern = false;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-gz-yeti", "gz-yeti", myYeti);
}

function myYeti(log, config, api) {
    this.config = config;
    this.log = log;
    this.api = api;
    this.url = url.parse(config["url"]);
    this.sysinfourl = url.parse(config['url'] + '/sysinfo');
    this.stateurl = url.parse(config['url'] + '/state');
    this.joindirecturl = url.parse(config['url'] + '/join-direct');
    this.rebooturl = url.parse(config['url'] + '/rpc/Sys.Reboot');
    this.joinurl = url.parse(config['url'] + '/join');
    this.wifiurl = url.parse(config['url'] + '/wifi');

    this.manufacturer = "GoalZero";
    this.model = config["model"];
    this.serialnumber = config["serialnumber"];
    this.devname = config['devname'];
    this.firmwareVersion = config['firmwareversion'];
    this.showHumidity = config['showHumidity'];
    this.tempUnits = "0"; // "celsius"
    console.log("SysInfoURL = " + this.sysinfourl);
    console.log("StateURL = " + this.stateurl);

    this.service = config["service"];
    this.name = config["name"];
    this.sensors = config["sensors"];
    this.getSysInfo(function(results) {
        this.model = results
    });
}

myYeti.prototype = {
    getSysInfo: function() {
        const me = this;

        me.log("getSysinfo");

        fetch(this.sysinfourl)
            .then(res => res.json())
            .then(json => sysInfoSub(json));

        function sysInfoSub(json) {
            jsonInfo = json;
            jsonInfoAvailable = true;
            me.devname = jsonInfo.name;
            me.model = jsonInfo.model;
            me.firmwareVersion = jsonInfo.firmwareVersion;
            me.serialnumber = jsonInfo.macAddress;
            try {
                me.log("============================");
                me.log("Yeti connected");
                me.log("Yeti Name: " + me.devname);
                me.log("Yeti Model: " + me.model);
                me.log("Yeti serial number: " + me.serialnumber);
                me.log("Yeti firmware version: " + me.firmwareVersion);
                me.log("============================");
            } catch (error) {
                me.log("Something Went Wrong");
            }
        }
    },
    getServices: function() {
        this.services = [];

        const me = this;

        /* Information Service */

        let informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, me.manufacturer)
            .setCharacteristic(Characteristic.Model, me.model)
            .setCharacteristic(Characteristic.SerialNumber, me.serialnumber);
        this.services.push(informationService);

        /* Battery Service */

        let batteryService = new Service.BatteryService();
        batteryService
            .getCharacteristic(Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevelCharacteristic.bind(this));
        batteryService
            .getCharacteristic(Characteristic.ChargingState)
            .on('get', this.getChargingStateCharacteristic.bind(this));
        batteryService
            .getCharacteristic(Characteristic.StatusLowBattery)
            .on('get', this.getLowBatteryCharacteristic.bind(this));
        this.services.push(batteryService);

        /* Humidity Service */
        if (this.showHumidity !== "no") {
            let humidityService = new Service.HumiditySensor("Battery level");
            humidityService
                .getCharacteristic(Characteristic.CurrentRelativeHumidity)
                .on('get', this.getBatteryLevelCharacteristic.bind(this));
            this.services.push(humidityService);
            this.humidityService = humidityService;
        }

        /* Switch Service */

        let DC12VswitchService = new Service.Switch("12V Power", "12vswitch");
        DC12VswitchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.get12VSwitchOnCharacteristic.bind(this))
            .on('set', this.set12VSwitchOnCharacteristic.bind(this));
        this.services.push(DC12VswitchService);

        let ACswitchService = new Service.Switch("AC Power", "ACswitch");
        ACswitchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getACSwitchOnCharacteristic.bind(this))
            .on('set', this.setACSwitchOnCharacteristic.bind(this));
        this.services.push(ACswitchService);

        let USBswitchService = new Service.Switch("USB Power", "USBswitch");
        USBswitchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getUSBSwitchOnCharacteristic.bind(this))
            .on('set', this.setUSBSwitchOnCharacteristic.bind(this));
        this.services.push(USBswitchService);

        /* Temperature service */

        let tempService = new Service.TemperatureSensor("Temperature");
        tempService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .on('get', this.getTemperatureCharacteristic.bind(this));
        tempService
            .getCharacteristic(Characteristic.TemperatureUnits, this.tempUnits);
        this.services.push(tempService);
        this.tempService = tempService;

        this.DC12VswitchService = DC12VswitchService;
        this.ACswitchService = ACswitchService;
        this.USBswitchService = USBswitchService;
        this.informationService = informationService;
        this.batteryService = batteryService;

        return this.services;
    },

    getModelNumberCharacteristic: function(next) {
        const me = this;
        request({
                url: me.sysinfourl,
                method: 'GET',
            },
            function(error, response, body) {
                if (error) {
                    me.log("getModelNumber  error: " + error.message);
                    return next(error);
                }
                var obj = JSON.parse(body);
                me.log("Model: " + obj.model);
                return next(null, obj.model);
            });
    },

    getSerialNumberCharacteristic: function(next) {
        const me = this;
        request({
                url: me.sysinfourl,
                method: 'GET',
            },
            function(error, response, body) {
                if (error) {
                    me.log("getSerialNumber  error: " + error.message);
                    return next(error);
                }
                var obj = JSON.parse(body);
                me.log("SerialNumber: " + obj.macAddress);
                return next(null, obj.macAddress);
            });
    },

    getBatteryLevelCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: 'GET',
            },
            function(error, response, body) {
                if (error) {
                    me.log("BattLevel error: " + error.message);
                    return next(error);
                }
                var obj = JSON.parse(body);
                me.log("Battery level: " + obj.socPercent);
                return next(null, obj.socPercent);
            });
    },

    getChargingStateCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    // this has a max value of a little over an hour, making it useless
    getRemainingTimeCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    getLowBatteryCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    getTempUnitCharacteristic: function(next) {
        const me = this;
        var units = 0; //0 = celsius, 1 = Fahrenheit
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    get12VSwitchOnCharacteristic: function(next) {
        const me = this;
        var DC12Von = false;
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    getACSwitchOnCharacteristic: function(next) {
        const me = this;
        var ACon = false;
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    getUSBSwitchOnCharacteristic: function(next) {
        const me = this;
        var USBon = false;
        request({
                url: me.stateurl,
                method: 'GET',
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
            });
    },
    set12VSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";
        if (on) {
            onstring = "{\"v12PortStatus\":1}";
        } else {
            onstring = "{\"v12PortStatus\":0}";
        }
        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: 'POST',
            },
            function(error, response) {
                if (error) {
                    me.log("Set Switch on error: " + error.message);
                    return next(error);
                }
                return next();
            });
    },
    setACSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";
        if (on) {
            onstring = "{\"acPortStatus\":1}";
        } else {
            onstring = "{\"acPortStatus\":0}";
        }
        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: 'POST',
            },
            function(error, response) {
                if (error) {
                    me.log("Set Switch on error: " + error.message);
                    return next(error);
                }
                return next();
            });
    },
    setUSBSwitchOnCharacteristic: function(on, next) {
        const me = this;
        var onstring = "";
        if (on) {
            onstring = "{\"usbPortStatus\":1}";
        } else {
            onstring = "{\"usbPortStatus\":0}";
        }
        me.log("onstring: " + onstring);
        request({
                url: me.stateurl,
                headers: {
                    "Content-Type": "Application/json",
                    "User-Agent": "YetiApp/1340 CFNetwork/1125.2 Darwin/19.4.0"
                },
                body: onstring,
                method: 'POST',
            },
            function(error, response) {
                if (error) {
                    me.log("Set Switch on error: " + error.message);
                    return next(error);
                }
                return next();
            });
    },

    getTemperatureCharacteristic: function(next) {
        const me = this;
        request({
                url: me.stateurl,
                method: 'GET',
            },
            function(error, response, body) {
                if (error) {
                    me.log("Temperature error: " + error.message);
                    return next(error);
                }
                var obj = JSON.parse(body);
                me.log("Temperature: " + obj.temperature);
                return next(null, obj.temperature);
            });
    }
};

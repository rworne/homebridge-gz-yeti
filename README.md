# homebridge-gz-yeti

**WIP**

My initial take on a Homebridge plugin dor the Goal Zero Yeti power stations (Lithium Ion powered generator).
This provides remote power capability for 12VDC, AC power and USB power, shows the charge state of the battery, and the temperature of the Yeti itself.

## Big Note:

The Yeti appears to be capable of connecting to only one device at a time.  Therefore, when using the Homebridge plugin, the Yeti will communicate via Homebridge as if it were in local (direct connect) mode, but it will be using the assigned IP address and be a part of the WiFi network.  Be aware that the Yeti App will most likely no longer function unless you re-pair the devices.  This will be investigated further later on.

## Usage:

Configure it as follows:

        {
            "accessory": "gz-yeti",
            "service": "Switch",
            "name": "Yeti",
            "model": "Yeti 3000",
            "firmwareversion": "1.2.3",
            "macaddress": "[your Yeti's MAC Address]",
            "url": "[your Yeti's IP Address]"
        }
        
### Note:
 * The accessory, service, name, macaddress and url are required, the rest of the fields are for information or future development.  These values can be found in the Yeti app.
 * name is the name of the device as it appears in Homekit
 * model appears under the detailed info page in the settings page for the device in Home.app.
 * macaddress appears under the detailed info page in the settings page for the device in Home.app. Homebridge uses this for the serial number, as it is unique.
 * firmware version is currently not used, it's there in case any future firmware updates cause breakage.
 * Siri responds to "Turn AC Power on/off", "Turn 12 volt power on/off", "Turn USB power on/off"
 
Credit goes to <a href="https://github.com/dinmammas">dinmammas</a> for his homebridge-robonect plugin.  It provided a basic enough example to use, so any similarities are intentional.
 

# homebridge-gz-yeti

**WIP**

My initial take on a Homebridge plugin dor the Goal Zero Yeti power stations (Lithium Ion powered generator).
This provides remote power capability for 12VDC, AC power and USB power, shows the charge state of the battery, and the temperature of the Yeti itself.

## Usage:

Configure it as follows:

        {
            "accessory": "gz-yeti",
            "service": "Switch",
            "name": "Yeti",
            "url": "http://[your Yeti's IP Address]",
            "model": "Your Yeti Model",
            "devname": "Your Yeti device name",
            "serialnumber": "Your Yeti Serial number",
            "firmwareversion": "Your firmware revision",
            "showHumidity": "no"
        }
        
### Note:
 * Only the url is critical, the rest of the fields are for information or future development.  These values can be found in the Yeti app.
 * name is the name of the device as it appears in Homekit
 * model appears under the detailed info page in the settings page for the device in Home.app.
 * serialnumber appears under the detailed info page in the settings page for the device in Home.app.
 * showHumidity will use the humidity sensor in Homekit to display the charge state of the battery - it's otherwise buried.
 * firmware version is currently not used, it's there in case any future firmware updates cause breakage.
 * Siri responds to "Turn AC Power on/off", "Turn 12 volt power on/off", "Turn USB power on/off"
 
Credit goes to <a href="https://github.com/dinmammas">dinmammas</a> for his homebridge-robonect plugin.  It provided a basic enough example to use, so any similarities are intentional.
 

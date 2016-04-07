Node.js Controller and MQTT for The Dash
================================================================================

The [node-mqtt-for-dash](https://github.com/IBM-Bluemix/node-mqtt-for-dash) project contains two main components to interact between [The Dash](http://www.bragi.com/) and [IBM Bluemix](https://bluemix.net). 

* Controller (Node.js application) running on MacBooks or notebooks to receive data from The Dash using the [Bluebooth Low Energy](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.heart_rate.xml) protocol.
* MQTT interface to send data from The Dash to the cloud. 

In order to run this project you need The Dash from Bragi. Additionally you need a device to run the Node.js application which also supports Bluetooth Low Energy. I tested it with a MacBook Pro successully (without additional adapter). 

At this point only the heart rate sensor data is sent to the cloud.

![alt text](https://raw.githubusercontent.com/IBM-Bluemix/node-mqtt-for-dash/master/screenshots/real-time.png "heart rate")

Author: Niklas Heidloff [@nheidloff](http://twitter.com/nheidloff)


Setup of the Node.js Controller
================================================================================

Make sure the following tools are installed and on your path.

* [node](https://nodejs.org/en/download/)
* [npm](https://docs.npmjs.com/getting-started/installing-node)
* [git](https://git-scm.com/downloads)

Invoke the following commands from your git directory.

> git clone https://github.com/IBM-Bluemix/node-mqtt-for-dash.git
> cd node-mqtt-for-dash
> npm install

You need to find out the Peripheral ID of the Dash you want to connect to. Turn on the charged Dash, press the left Dash for five seconds, make sure Bluetooth is enabled on your MacBook and from the new directory run this command:

> node discovery.js

In the root directory of the project you need to create a config file. By default the application looks for the file 'config.properties'. Copy the peripheral id in this file. You can use the file 'config-sample.properties' as starting point.

To start the controller(s) invoke the following command.

> node controller.js


Setup of MQTT and Bluemix Internet of Things
================================================================================

The project supports [MQTT](http://mqtt.org/) to communicate to the cloud. I have used [IBM Bluemix](https://bluemix.net) and the [Internet of Things](https://console.ng.bluemix.net/catalog/internet-of-things/) service. 

The usage of MQTT is optional. If you don't want to use it just comment out the MQTT configuration in the config files.

In order to perform the following steps, you need to register on [Bluemix](https://bluemix.net).

Next create a new Bluemix application based on the [Internet of Things Foundation Starter](https://console.ng.bluemix.net/catalog/starters/internet-of-things-foundation-starter/). After this add the [Internet of Things Foundation](https://console.ng.bluemix.net/catalog/services/internet-of-things-foundation/) service to it.

You need to register a device type 'dash' and a device for your Dash. After you've registered the device copy the 'authtoken' in the config file.

In the last step you need to create a new application key in the dashboard. The 'apikey' and the 'apitoken' need to be copied in the config file as well.

Open Node-RED in a browser, for example http://dash.mybluemix.net/red/#. Copy the content of [node-red.json](https://github.com/IBM-Bluemix/node-mqtt-for-dash/blob/master/node-red.json) in the clipboard, import it into Node-RED and deploy the flow. After this you can see your heart rate in the debug panel in the right sidebar.
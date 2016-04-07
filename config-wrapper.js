//------------------------------------------------------------------------------
// Copyright IBM Corp. 2015, 2016
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------

var mqtt = require('mqtt');
var properties = require('properties');

function start(deviceId, apiKey, apiToken, mqttHost, mqttPort, dashid, callback) {
  var org = apiKey.split('-')[1];
  var clientId = ['d', org, 'dash', deviceId].join(':');
  var mqttClient = mqtt.connect("mqtt://" + mqttHost + ":" + mqttPort, {
              "clientId" : clientId,
              "keepalive" : 30,
              "username" : "use-token-auth",
              "password" : apiToken
            });

  mqttClient.on('connect', function() {
    mqttClient.subscribe('iot-2/cmd/dash/fmt/json', {qos : 0}, function(err, granted) {
      if (err) {
        mqttClient = null;
      } 
      else {
        console.log('MQTT client connected to IBM IoT Cloud');
      }
    });

    callback(dashid, mqttClient);
  });
}

module.exports = function() {
  return {
    "read" : function(propertiesFileName, callback) {
      if (!propertiesFileName) {
        propertiesFileName = 'config.properties';
        console.error('Default configuration file config.properties is used');
      }
      properties.parse('./' + propertiesFileName, {path: true}, function(err, cfg) {
        if (err) {
          console.error('Error parsing the configuration file - see config-sample.properties for an example');
          process.exit(0);
		    }
        if (!cfg.dashid) {
          console.error('Error parsing the configuration file - see config-sample.properties for an example');
          process.exit(0);
        }

        if (cfg.deviceid) {
          var org = cfg.apikey.split('-')[1];
          start(cfg.deviceid, cfg.apikey, cfg.authtoken, org + '.messaging.internetofthings.ibmcloud.com', '1883', cfg.dashid, callback);
        } else {
          callback(cfg.dashid, null);
        }
      });	
	  }
  };
};
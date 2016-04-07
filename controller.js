//------------------------------------------------------------------------------
// Copyright IBM Corp. 2016
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

var config = require('./config-wrapper.js')();
var async = require('async');
var noble = require('noble');
var mqtt = require('mqtt');
var readline = require('readline');

var characteristicHR;
var dash;
var heartRateServiceUuid = "180d";
var discovered = false;

config.read(process.argv[2], function(dashId, mqttClient) {

  if (!dashId) {
    console.log('Define dashid in a properties file and pass in the name of the file as argv');
    process.exit(0);
  }

  noble.startScanning();
  setTimeout(function() {
    noble.stopScanning();
    if (discovered == false) {
      console.log('No Dash discovered. Make sure sensor data is sent by pressing the left Dash for 5 seconds');
      process.exit(0);
    }
  }, 3000);

  noble.on('discover', function(peripheral) {

    if (peripheral.id === dashId) {
      discovered = true;
      noble.stopScanning();

      var advertisement = peripheral.advertisement;
      var serviceUuids = JSON.stringify(peripheral.advertisement.serviceUuids);
      //console.log('Service Uuids: ' + serviceUuids);
      if(serviceUuids.indexOf(heartRateServiceUuid) > -1) {
        console.log('Dash discovered. ID: ' + peripheral.id); 
        dash = peripheral;
        setUp(dash);
      }
    }
  });

  function getHeartRateService(services) {
    // https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.heart_rate.xml
    if (!services) return null;
    var output;
    for (var i = 0; i < services.length; i++) {
      if (services[i].uuid == heartRateServiceUuid) output = services[i];
    }
    return output;
  }

  function setUp(peripheral) {
    peripheral.on('disconnect', function() {
      console.log('Dash has been disconnected');
      process.exit(0);
    });

    peripheral.connect(function(error) {
      peripheral.discoverServices([], function(error, services) {
        
        var service = getHeartRateService(services);
        
        service.discoverCharacteristics([], function(error, characteristics) {
          var characteristicIndex = 0;

          async.whilst(
            function () {
              return (characteristicIndex < characteristics.length);
            },
            function(callback) {
              var characteristic = characteristics[characteristicIndex];
              async.series([
                function(callback) {
                  if (characteristic.uuid == '2a37') {
                    
                    characteristicHR = characteristic;

                    characteristicHR.notify(true, function(err) {
                    });

                    characteristicHR.on('read', function(data, isNotification) {
                      console.log('Heart rate characteristic on read: ', data);
                      console.log('Heart rate: ', data.readUInt8(1));

                      if (mqttClient) {
                        var messageId = data.readUInt8(0);
                        mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
                          "d" : {
                            "description" : "heart_rate",
                            "heartRate": data.readUInt8(1)
                          }
                        }), function () {
                        }); 
                      }
                    });
                  }

                  if (characteristic.uuid == '2a38') {
                  }

                  callback();
                },
                function() {
                  characteristicIndex++;
                  callback();
                }
              ]);
            },
            function(error) {
            }
          );
        });
      });
    });
  }

  mqttClient.on('error', function(err) {
    console.error('MQTT client error ' + err);
    mqttClient = null;
  });
  mqttClient.on('close', function() {
    console.log('MQTT client closed');
    mqttClient = null;
  });
});

var cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

cli.on('line', function (cmd) {
    console.log("Press control c to quit");                      
});

process.stdin.resume();

function exitHandler(options, err) {
  if (dash) dash.disconnect();
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
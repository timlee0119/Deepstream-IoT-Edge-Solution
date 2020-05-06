'use strict';

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;

Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
    throw err;
  } else {
    client.on('error', function (err) {
      throw err;
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('IoT Hub module client initialized');

        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          pipeMessage(client, inputName, msg);
        });
      }
    });
  }
});

// This function just pipes the messages without any change.
function pipeMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));

  if (inputName === 'input1') {
    var message = msg.getBytes().toString('utf8');
    console.log(message);
    var messageBody = JSON.parse(message);
    if (messageBody.objects && messageBody.objects.length > 0 && messageBody.sensorId) {
      var outputObject = {};
      outputObject['sensorId'] = messageBody['sensorId'];
      messageBody['objects'].forEach(objString => {
        var category = objString.split('|')[5];   // original format: 80|11|22|33|44|<Object Category>|......
        if (outputObject[category]) {
          outputObject[category]++;
        } else {
          outputObject[category] = 1;
        }
      });

      var outputMsg = JSON.stringify(outputObject)
      console.log(`OutputObject: ${outputMsg}`);
      outputMsg = new Message(outputMsg);
      client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
    }
  }
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    }
    if (res) {
      console.log(op + ' status: ' + res.constructor.name);
    }
  };
}

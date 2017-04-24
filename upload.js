var noble = require('noble');
var jimp = require('jimp');
var _ = require('lodash');

var UART_UUID = '6e400001b5a3f393e0a9e50e24dcca9e';
var TX_UUID =   '6e400002b5a3f393e0a9e50e24dcca9e';

var file = process.argv.slice(2)[0];

var calculatePackets = new Promise(function(resolve, reject) {
  jimp.read(file, function(err, img) {
    if(err) reject(err);

    var width = img.bitmap.width;
    var height = img.bitmap.height;

    var curColor = 0;
    var count = 0;

    var data=[]

    for(var i=0; i < width * height; i++) {
      var hex = img.getPixelColor(i % width, Math.floor(i / height));
      var rgba = jimp.intToRGBA(hex);
      var color = rgba.r == 0 ? -1 : 1;

      if(curColor == 0) curColor = color;

      if(color != curColor) {
        data.push(count * curColor)
        count = 1
        curColor = color;
      } else {
        count += 1;
        if(count >= 127) {
          data.push(count * curColor);
          count = 0;
          curColor = 0;
        }
      }
    }

    var rv =
      _(data)
      .chunk(16)
      .map(function(a) {return _.concat(2, a, 0)})
      .map(function(a) {return new Buffer(a)})
      .value()
    resolve(rv);
  });
});


noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning([UART_UUID], false);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
  console.log('Discovered Peripheral');
  peripheral.connect(function(error) {
    console.log('Connected to Peripheral');
    peripheral.discoverServices(null, function(error, services) {
      uartService = services[0];
      uartService.discoverCharacteristics([TX_UUID], function(error, characteristics) {

        console.log('Discovered TX Characteristic')
        var tx = characteristics[0]; 

        tx.write(new Buffer([0x01]));
        calculatePackets.then(function(packets) {
          for(var i = 0; i < packets.length; i++) {
            console.log(packets[i]);
            tx.write(packets[i]);
          }
        });

      });
    });
  });
});


const scanner = require('eddystone-beacon-scanner');
const EventEmitter = require('events');
const util = require('util');
const url = require('url');


var RuuviScanner = function () {
    EventEmitter.call(this);
    scanner.on('found', this.beaconFound.bind(this));
    scanner.on('updated', this.beaconFound.bind(this));
}

util.inherits(RuuviScanner, EventEmitter);

RuuviScanner.prototype.scan = function () {
    scanner.startScanning(true);
    setTimeout(() => {
        scanner.stopScanning();
    }, 5000);
}

RuuviScanner.prototype.start = function (scannerConfig) {
    setInterval(this.scan.bind(this), scannerConfig.interval);
    this.scan();
}

RuuviScanner.prototype.parseData = function (beacon) {

    const now = Math.floor(Date.now() / 1000);
    const hash = url.parse(beacon.url).hash.substring(1);
    const decoded = Buffer.from(hash, 'base64');

    /* Check the format.. only base64 supported nowadays */
    if (decoded[0] == 2) {
        const uTemp = ((decoded[2] & 127) << 8) | decoded[3];
        const tempSign = (decoded[2] >> 7) & 1;

        const data = {
            beacon: beacon.id,
            timestamp: now,
            temperature: tempSign === 0 ? uTemp / 256.0 : -1 * uTemp / 256.0,
            pressure: (((decoded[4] << 8) + decoded[5]) + 50000) / 100,
            humidity: decoded[1] * 0.5
        };
        this.emit('data', data);
    }
}

RuuviScanner.prototype.beaconFound = function (beacon) {
    if (beacon.url && beacon.url.indexOf('ruu.vi') >= 0) {
        this.parseData(beacon);
    }
}

module.exports = RuuviScanner;
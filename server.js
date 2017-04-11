const config = require('config');
const firebase = require('firebase');
const moment = require('moment');
const scanner = require('./ruuvi-scanner');

const firebaseConfig = config.get('firebase');
const scannerConfig = config.get('scanner');
const ruuvitags = config.get('ruuvitags');
 
firebase.initializeApp(firebaseConfig);

const database = firebase.database();


scanner.on('data', function(data) {
 const date = moment(data.timestamp*1000).utc().format('YYYY-MM-DD');

 console.log("%s (%d) beacon=%s (%s), t=%s C, P=%s hPa, r=%s %", moment(data.timestamp * 1000).format('YYYY-MM-DD h:mm:ss'), data.timestamp, ruuvitags[data.beacon].alias, data.beacon, data.temperature, data.pressure, data.humidity);

/* Save to list of devices the configured alias. */
 database.ref().child('devices').child(data.beacon).set({
	alias : ruuvitags[data.beacon].alias
	});
/* Save the measurement result*/
 const measurementRef = database.ref().child('measurements').child(data.beacon).push();
 
 measurementRef.set({
	    temperature: data.temperature,
	    pressure: data.pressure,
            humidity: data.humidity,
	    timestamp: data.timestamp
 });
});

console.log("starting scanning with interval %d", scannerConfig.interval);
scanner.start(scannerConfig);

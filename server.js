const config = require('config');
const firebase = require('firebase');
const moment = require('moment');
const scanner = require('./ruuvi-scanner');

const firebaseConfig = config.get('firebase');
const scannerConfig = config.get('scanner');
const ruuvitags = config.get('ruuvitags');
 
firebase.initializeApp(firebaseConfig);

const database = firebase.database();

let lastTimes = new Map();


scanner.on('data', function(data) {

if (lastTimes.has(data.beacon))
{
  if (data.timestamp < (lastTimes.get(data.beacon) + (scannerConfig.interval / 1000)))
  {
     return;
  }
}
lastTimes.set(data.beacon, data.timestamp);

if (!ruuvitags.hasOwnProperty(data.beacon))
{   
 console.log("data from unknown beacon %s, maybe add it to config?", data.beacon);
 return;
}



 const date = moment(data.timestamp*1000).utc().format('YYYY-MM-DD');

 var alias;
 var hasAlias = false;
 
 if (!ruuvitags[data.beacon].alias)
 {
   alias = "unknown";
 }
 else
 {
  alias = ruuvitags[data.beacon].alias;
  hasAlias = true;
  }

 console.log("%s (%d) beacon=%s (%s), t=%s C, P=%s hPa, r=%s %", moment(data.timestamp * 1000).format('YYYY-MM-DD h:mm:ss'), data.timestamp, alias, data.beacon, data.temperature, data.pressure, data.humidity);

/* Save to list of devices the configured alias. */
 if (hasAlias)
{ 
database.ref().child('devices').child(data.beacon).set({
	alias : ruuvitags[data.beacon].alias
	});
}
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

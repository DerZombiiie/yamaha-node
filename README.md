# Yamaha-node

A implementation of some obscure-ish YAMAHA protocol, found in the "AV Controller" App for Android

## How to use

```js
// import the library
const {Host} = require("./yamaha-node.js")

// create a Host object
var MyHost = new Host("<ip>")

// list of all available "features" or functions
MyHost.features

// get a specific feature by its name
MyHost.features.find("<feature name>")

// get the state of a feature
let feature = MyHost.features.find("<feature name>")
// do the request
MyHost.getFeature(feature).then(data => {
	// you can (for all features) just use the default .toString() method to get a human friendly name for the feature
	console.log(data.toString())
})

// set the state of a feature
feature = MyHost.features.find("<feature name>")
// do the request
MyHost.setFeature(feature, "<state>").then(res => { // state can be a string or number depending on what the feature is
	console.log(res) // if res === "0", then success all other values are unknown errors
})
```

working examples can be found in `test.js`

## Documentation of the Definition format: (definition.json)

```json
{
	"endpoint": "<relative path>", // endpoint for all port requests
	"features": [
		{
			"name": "<name>", // the name of your feature
			"type": "<type>", // type of input see "types" part of documentation
			"values": {},     // see "types"
			"mult": aN,       // see "types"
			"setRequest": {
				"data": "<request body>" // the raw string send to the reciver, ${data} gets replaced with value
			},
			"locationGet": {
				"location": [],          // see "location"
				"sReqId": "<request id>" // Request ID
			}
		}, <etc>
	]

	"requests": {
		"<request id>": {
			"cacheTime": aN,         // time in ms a cache is valid
			"data": "<request body>" // raw string send to the reciver
		}
	}
}
```

### types

Possible types are: 

- toggle
  ```json
  "type": "toggle",
  "values": {
  	"tName": "<name when true>"
      "fName": "<name when false>"
  },
  "mult": null
  ```

- range
  ```json
  "type": "range",
  "values": {
  	"max": <maximal value>,
  	"min": <minimal value>,
  	"step": <least significant unit,
  	"avg": <default value>
   }
  "mult": <multiplier>
  ```

- input
  ```json
  "type": "input",
  "values": [
  	{
  		"tName": "<technical name>",
  		"fName": "<friendly name>",
  		"desc":  "Description of input"
  	}
  ],
  "mult": null
  ```

### location

A array of elements usually separated by 0s

for example the power location looks like:

```json
["YAMAHA_AV", "Main_Zone", 0, "Basic_Status", 0, "Power_Control", 0 "Power", 0]
```

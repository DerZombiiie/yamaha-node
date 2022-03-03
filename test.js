// testing
const {Host, Definition, FileResource} = require("./yamaha-node.js")

async function main() {
	let file = new FileResource("./Definitions/RX-V475.json")
	file.read()
	await file.ready()

	let def = new Definition( file )

	var MyHost = new Host("192.168.1.75", def)

	let data = await MyHost.getFeature(MyHost.features.find("power"))
	console.log("powaa!", data, data.toString())

	data = await MyHost.getFeature(MyHost.features.find("sleep"))
	console.log("sleeep", data, data.toString())

	data = await MyHost.getFeature(MyHost.features.find("volume"))
	console.log("volume", data, data.toString())

	data = await MyHost.getFeature(MyHost.features.find("bass"))
	console.log("bassss", data, data.toString())

	let res = await MyHost.setFeature(MyHost.features.find("treble"), 25)
	console.log(res)
	
	data = await MyHost.getFeature(MyHost.features.find("treble"))
	console.log("treble", data, data.toString())
	

	data = await MyHost.getFeature(MyHost.features.find("direct"))
	console.log("direc", data, data.toString())

	data = await MyHost.getFeature(MyHost.features.find("standby_through_info"))
	console.log("stinf", data, data.toString())

	data = await MyHost.getFeature(MyHost.features.find("adaptive_DRC"))
	console.log("a_DRC", data, data.toString())

	data = await MyHost.getFeature(MyHost.features.find("OUT_1"))
	console.log("OUT_1", data, data.toString())

//	data = MyHost.features.find("input").values
//    console.log("ilist", data)

	data = await MyHost.getFeature(MyHost.features.find("input"))
	console.log("input", data.toString()) // yes .toString on a string lol cuz its a String not a string <- difference

//	res = await MyHost.setFeature(MyHost.features.find("input"), "AV6")
//	console.log(res)

//	res = await MyHost.setFeature(MyHost.features.find("volume"), -300)
//	console.log(res)

}

main()

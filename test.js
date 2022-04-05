// testing
const {Host} = require("./yamaha-node.js")

async function main() {
	var MyHost = new Host("192.168.1.75")

	//let res = await MyHost.setFeature(MyHost.features.find("power"), "On")
	let data = await MyHost.getFeature(MyHost.features.find("power"))
	console.log("powaa!", data, data.toString())

	let res = await MyHost.getFeature(MyHost.features.find("SERVER_cursor"))
	console.log(res.toString())
}

main()

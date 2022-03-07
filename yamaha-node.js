// yamaha-js.js libary by derz
// implementation of the Yamaha Android audio controller Streo whatever XML interface
const fetch = require("node-fetch")
const xml   = require("xml2js")
const fs    = require("fs").promises
const { Value, Cache, Range, Toggle, Type, TypeList, Input, InputList, Location, Feature, FeatureList, Resource, FileResource, StringResource, RequestCont, Request, } = require("./yamaha-utils.js")

// re exporting some stuff:
module.exports = {Resource, FileResource, StringResource }

class Definition {
	constructor( data ) {
		this.update( data )
	}

	update( data ) {
		this.endpoint = data.endpoint
		this.features = new FeatureList( data.features )
		this.requests = new RequestCont( data.requests )
	}
}
module.exports.Definition = Definition

class Host {
	constructor( host, definition ) {
		this.host = host
		this.d = definition
		this.endpoint = `http://${this.host}${definition.endpoint}`
		this.features = definition.features
		this.requests = definition.requests
	}

	getFeature( feature ) {
		return this.getRequest( this.requests.byName(feature.locationGet.sReqId) )
			.then( res => feature.locationGet.location.apply( res ) )
			.then( val => feature.parse(val))
	}

	setFeature( feature, value ) {
		// invalidate cache of request type:
		this.requests.byName(feature.locationGet.sReqId).cache.clear()
		return this.setRequest( feature.setRequest, value.raw ? value.raw : value ).then(
			res => res.YAMAHA_AV.$.RC
		)
	}

	async getRequest( request ) {
		
		if( request.cacheValid ) // if still has validcache
			return request.getCache()

		let res = await fetch( this.endpoint, {
			method: "post",
			body: request.data,
			headers: {
				"Content-Type": "application/xml",
			}
		})
		let text =  await res.text()
		let parsed = await xml.parseStringPromise( text )
		request.updateCache( parsed );
		return parsed		
	}

	async setRequest( request, data ) {
		const res = await fetch( this.endpoint, {
			method: "post",
			body: request.data.replace("${data}",data),
			headers: {
				"Content-Type": "application/xml",
			}
		}).then(res => res.text())
		const parsed = xml.parseStringPromise(res)
		return parsed
	}
}

module.exports.Host = Host

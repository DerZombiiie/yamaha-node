// yamaha-utils.js helper file by derz
// "a fuck ton of simple classes" ~ derz
const fs = require("fs").promises

class Range {
	constructor( data, min, avg, step ) {
		if( data & !min &! avg ) {
			this.max  = data.max  // maximal value
			this.min  = data.min  // minimal value
			this.avg  = data.avg  // average / default value
			this.step = data.step // how fine controll
		} 
	}
	
	round( x ) {
		return Math.round(x*(1/this.step))/(1/this.step)
	}

	inRange( x ) {
		return this.min <= x & this.max <= x
	}
}
module.exports.Range = Range

class TypeList extends Array {
	push( thing ) {
		if( this.includes(thing) ) return
		else super.push(thing)
	}
}
module.exports.TypeList = TypeList

class Input extends String {
	constructor( data, feature ) {
		console.log(data.Input_Sel_Item_Info[0])
		super(data.Input_Sel[0]) // technical name
		this.fName = Input.format( data.Input_Sel_Item_Info[0].Title[0] ) // friendly Name (without padding whitespace)
		this.icon = data.Input_Sel_Item_Info[0].Icon[0].On[0]            // icon
		this.RW = data.Input_Sel_Item_Info[0].RW[0]                      // TODOidk (jet)
		this.Src_Name = data.Input_Sel_Item_Info[0].Src_Name[0]          // TODO used by server to tell what dirname of ur dir is
		this.Src_Number = data.Input_Sel_Item_Info[0].Src_Number[0]      // TODO probably like Name but haven't checked yet
	}

	static format( str ) {
		return str.replaceAll(/(^\s*)|(\s*$)/gm, "")
	}

	get raw() {
		return super.toString()
	}

	toString() {
		return super.toString() + (super.toString() !== this.fName ? ` (${this.fName})` : "")
	}
}
module.exports.Input = Input

class Location extends Array {
	constructor( data ) {
		super()
		data.forEach((elem,i) => this[i] = elem)
	}

	apply( pntr ) { // get location with t´some the data thing you know what is meant
		this.forEach(entry => {
			//console.log(entry, "@", Object.keys(pntr))
			pntr = pntr[entry]
		})
		//console.log(Object.keys(pntr))
		return pntr
	}
}

class Feature {
	constructor( data ) {
		debugger
		this.name = data.name // name of feature (abitory <- more spell)
		this.type = data.type // type, e.g. toggle / range
		this.values = data.values
		this.mult = data.mult // multiplier when talking to the AV (if applicable)
		this.setRequest = data.setRequest
		this.locationGet = {
			"sReqId": data.locationGet.sReqId,
			"location": new Location( data.locationGet.location ),
		}
	}

	parse( val ) {
		switch( this.type ) {
			case "range": return new Value(val, this.mult)
			case "toggle": return new Toggle(val, this)
			case "string": return new StringVal(val, this)
			case "input": return new Input(val, this)
			case "raw": return {data: val, feature: this}
		}
	}
}
module.exports.Feature = Feature

class FeatureList extends Array {
	constructor( data ) {
		super(data.length)
		data.forEach((data, i) => this[i] = data)

		for( let i = 0 ; i < this.length ; i++ ) {

			this[i] = new Feature( this[i] )
		}
	}

	find( featureName ) {
		let ret = null
		this.forEach( feature => {
			if (  feature.name === featureName )
				ret = feature
		} )
		return ret
	}

	get features() { // (very useful)
		return this
	}
}
module.exports.FeatureList = FeatureList

class Cache extends Date {
	constructor( dateTime, duration, data ) {
		super( dateTime !== undefined ? dateTime : Date.now() )  // initialize Date thing
		this.duration = duration ? duration : 1000 // time Cache is valid after refresh (in ms)
		this.data = data ? data : false            // set data (if applicble)
	}

	getData() {
		return Object.assign({}, this.data)
	}

	refresh( data ) { // refresh data
		this.data = data
		this.setTime( Date.now() )
	}

	clear() { // clear cache
		this.data = null
		this.setTime(0)
	}
	
	get valid() {
		return !(( Date.now() - this.duration ) > this.getTime()) 
	}
}

class Request {
	constructor( data ) {
		this.cache = new Cache(0, data.cacheTime) // create cache for when new data arrives
		this.data = data.data // data for request
		                      // contains ${data} if set-request
	}

	get cacheValid() {
		return this.cache.valid
	}

	getCache() {
		return this.cache.getData()
	}

	updateCache( data ) {
		this.cache.refresh( data )
	}
}

class RequestCont {
	constructor( data ) {
		this.data = data
		Object.keys(this.data).forEach(key => {
			this.data[key] = new Request( this.data[key] )
		})
	}

	byName( name ) {
		return this.data[name]
	}
}
module.exports.RequestCont = RequestCont
 
class Value extends Number {
	constructor( val, mult ) {
		super(Number(val.Val))

		mult = mult ? mult : .1
		this.mult = mult * val.Exp
		this.unit = val.Unit
	}

	get raw() {
		return super.toString()
	}

	toString() {
		return this * this.mult + this.unit
	}
}
module.exports.Value = Value

class Toggle extends String {
	constructor( data, feature ) {
		super(data)
		this.bool = data === feature.values.tName
		this.tName = feature.values.tName // name when true
		this.fName = feature.values.fName // name when false
	}

	get raw() {
		return super.toString()
	}
	
	toString() {
		return this.bool ? this.tName : this.fName
	}
}
module.exports.Toggle = Toggle

class StringVal extends String {
	constructor( data, feature ) {
		super( data )
		this.values = feature.values
	}

	get raw() {
		return super.toString()
	}

	toString() {
		return super.toString()
	}
}

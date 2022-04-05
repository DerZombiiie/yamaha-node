	// available in SERVER mode
	async SERVER_setPlaying(enabled) {
		return this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><Play_Control><Playback>${enabled ? "Play" : "Pause"}</Playback></Play_Control></SERVER></YAMAHA_AV>`)
	}

	async SERVER_setShuffle(enabled) {
		return this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><Play_Control><Play_Mode><Shuffle>${enabled ? "On" : "Off"}</Shuffle></Play_Mode></Play_Control></SERVER></YAMAHA_AV>`)
	}

	async SERVER_skipForward() {
		return this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><Play_Control><Playback>Skip Fwd</Playback></Play_Control></SERVER></YAMAHA_AV>`)
	}

	async SERVER_skipBackward() {
		return new Promise(async r => {
			this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><Play_Control><Playback>Skip Rev</Playback></Play_Control></SERVER></YAMAHA_AV>`)
			r(this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><Play_Control><Playback>Skip Rev</Playback></Play_Control></SERVER></YAMAHA_AV>`))
		})
	}

	// folder navigation

	SERVER_updatePath(name, layer) {
		if(layer-1 <= this.SERVER_pathLayer) {
			// remove all newer layers and replace the top one
			this.SERVER_path = this.SERVER_path.slice(0,layer-1)
		}

		this.SERVER_path[layer-1] = name
	}

	async SERVER_jumpLine(line) {
		return this.apiRequest(`<?xml version="1.0" encoding="utf-8"?><YAMAHA_AV cmd="PUT"><SERVER><List_Control><Jump_Line>${line}</Jump_Line></List_Control></SERVER></YAMAHA_AV>`)
			.then(d => {this.SERVER_FullLine = line; return d})
	}

	async SERVER_getList(delay = 750) {
		return new Promise(async res => {
			let [last,i,busy] = [null,0,true];
			while(busy) {
				if( i > 0 ) // minimize requests sent to AV from 7-8 to 2
					await sleep(delay)
				last = await this.apiRequest(`<YAMAHA_AV cmd="GET"><SERVER><List_Info>GetParam</List_Info></SERVER></YAMAHA_AV>`)
				last = last.YAMAHA_AV.SERVER.List_Info
				busy = last.Menu_Status === "Ready" ? false : true
				i++
			}
			last.rounds = i

			// path variables
			await this.SERVER_updatePath(last.Menu_Name, last.Menu_Layer)						
			res(last)
		})
	}

	async SERVER_ls(name = false) { // if name is specified stop at filename = name
		return new Promise(async res => {
			// jump to first Line
			await this.SERVER_jumpLine(1)

			let firstLs = await this.SERVER_getList()
			
			// get all entries
			let buffer = [];
			for( let i = 1 ; i <= firstLs.Cursor_Position.Max_Line ; i += 7 ) {
				// jump to line
				await this.SERVER_jumpLine(i)
				// get list & wait for READY state
				let current_list = await this.SERVER_getList()
				current_list.FullLine = i
				if(name) { // if name is set this is a search
					// check if result contains name
					Object.keys(current_list.Current_List).forEach((l) => {
						if(current_list.Current_List[l].Txt === name) {
							current_list.Current_List[l].Location = {FullLine: i, Line: l}

							// return entry
							res(current_list.Current_List[l])
						}
					})
				}
				buffer.push(current_list)
			}

			// if name is set and not returned yet, return false for not found in search
			if(name) res(false)

			// convert entries to better format
			let files = []
			for( let i = 0 ; i < buffer.length ; i++ ) {
				Object.keys(buffer[i].Current_List).forEach((l) => {
					if(buffer[i].Current_List[l].Attribute !== "Unselectable") {
						buffer[i].Current_List[l].Location = {FullLine: buffer[i].FullLine, Line: l}
						files.push(buffer[i].Current_List[l])
					}
				})
			}

			res(files)
		})
	}

	async SERVER_search(name) {
		return this.SERVER_ls(name)
	}

	async SERVER_cd(line, FullLine = this.SERVER_FullLine) { // line has to be "Line_x" x being the line 
		return new Promise(async res => {
			// if line is a not type "Line_x" cd into string
			let path;
			if(/^Line_[0-8]$/.exec(line))
				path = {FullLine: FullLine, Line: line}
			else {
				path = await this.SERVER_search(line).Location
				FullLine = this.SERVER_FullLine
			}

			console.log("path",path)
		
			// check if FullLine isn't current FullLine & goto right Line if not
			if(FullLine !== this.SERVER_Line)
				await this.SERVER_jumpLine(FullLine)
				
				// cd into dir
				await this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><List_Control><Direct_Sel>${line}</Direct_Sel></List_Control></SERVER></YAMAHA_AV>`)

			// wait for non BUSY state # getList does less requests
			let list = await this.SERVER_getList()
			res(list)
		})
	}

	async SERVER_cdPath(path) {
		return new Promise(async res => {
			await this.SERVER_resetPath()
			let buffer = []
			for( let i = 0 ; i < path.length; i++ )
				// SERVER_cd returns getList
				buffer.push(await this.SERVER_cd.apply(this, path[i]))
				
			res(buffer)
		})
	}

	async SERVER_return(levels = 1) {
		if( levels < 0) levels = 10 // just to initialize when -1 gets set to correct value later
		return new Promise(async res => {
			for( let i = 0 ; i < levels ; i++ ) {
				// go up a dir
				await this.apiRequest(`<YAMAHA_AV cmd="PUT"><SERVER><List_Control><Cursor>Return</Cursor></List_Control></SERVER></YAMAHA_AV>`)
				// sleep for 50ms to give the AV time to process the request for real
				await sleep(25)

				// wait for not "BUSY" state
				let ls = await this.SERVER_ls()
				
				// if levels = -1 thats "cd /"
				if( levels < 0 )
					levels = ls.Menu_Layer
			}
			this.SERVER_FullLine = 1
			res()
		})
	}

	async SERVER_resetPath() {
		await this.SERVER_return(-1)
		this.SERVER_path = []
		this.SERVER_pathLevel = 0
	}
}

module.exports = {YamahaAVHost}

'use strict'

const fs = require('fs')
const dataDirectory = process.env.DATA_DIRECTORY || 'data'

const db = {
	listInstalledApps() {
		return fs.readdirSync(dataDirectory).map(it => it.substring(0, it.length - 5))
	},

	dataDirectory: dataDirectory
}

module.exports = db;

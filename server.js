'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path')
const smartApp = require('./lib/smartapp');
const db = require('./lib/db');
const sse = require('./lib/sse')
const server = express();
const PORT = process.env.PORT || 3001;

server.use(express.json());
server.use(express.static(path.join(__dirname, 'public')));
server.set('views', path.join(__dirname, 'views'))
server.set('view engine', 'ejs')

/* Handle lifecycle event calls from SmartThings */
server.post('/smartapp', (req, res, next) => {
    smartApp.handleHttpCallback(req, res);
});

/**
 * Render the home page listing installed app instances
 */
server.get('/', (req, res) => {
    const installedAppIds = db.listInstalledApps()
    res.render('index', {installedAppIds})
})

/**
 * Render the installed app instance control page
 */
server.get('/isa/:id', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)

    const options = {
        installedAppId: req.params.id,
        scenes: [],
        switches: [],
        locks: []
    }

    if (context.configBooleanValue('scenes')) {
        options.scenes = await context.api.scenes.list()
    }

    if (context.configBooleanValue('switches')) {
        options.switches = await Promise.all((await context.api.devices.list({capability: 'switch'})).map(it => {
            return context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'switch').then(state => {
                return {
                    deviceId: it.deviceId,
                    label: it.label,
                    value: state.switch.value
                }
            })
        }))
    }

    if (context.configBooleanValue('locks')) {
        options.locks = await Promise.all((await context.api.devices.list({capability: 'lock'})).map(it => {
            return context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'lock').then(state => {
                return {
                    deviceId: it.deviceId,
                    label: it.label,
                    value: state.lock.value
                }
            })
        }))
    }

    res.render('isa', options)
})

/* Execute a scene */
server.post('/isa/:id/scenes/:sceneId', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)
    const result = await context.api.scenes.execute(req.params.sceneId)
    res.send(result)
});

/* Execute a device command */
server.post('/isa/:id/devices/:deviceId', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)
    const result = await context.api.devices.executeCommand(req.params.deviceId, req.body)
    res.send(result)
});

/**
 * Handle SSE connection from the web page
 */
server.get('/events', sse.init)

/* Start listening at your defined PORT */
server.listen(PORT, () => {
    console.log(`Server is up and running at http://localhost:${PORT}`)
});


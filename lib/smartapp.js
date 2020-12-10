'use strict'

const FileContextStore = require('@smartthings/file-context-store')
const SmartApp = require('@smartthings/smartapp');
const db = require('./db')
const sse = require('./sse')

/*
 * Persistent storage of SmartApp tokens and configuration data in local files
 */
const contextStore = new FileContextStore(db.dataDirectory)

/* Define the SmartApp */
module.exports = new SmartApp()
    .enableEventLogging()
    .configureI18n()
    .permissions(['r:devices:*', 'x:devices:*', 'r:scenes:*', 'x:scenes:*'])
    .appId(process.env.APP_ID)
    .clientId(process.env.CLIENT_ID)
    .clientSecret(process.env.CLIENT_SECRET)
    .contextStore(contextStore)

    // Configuration page definition
    .page('mainPage', (context, page, configData) => {

        // prompts user to select a contact sensor
        page.section('types', section => {
            section.booleanSetting('scenes')
            section.booleanSetting('switches')
            section.booleanSetting('locks')
        });
    })

    // Handler called whenever app is installed or updated
    // Called for both INSTALLED and UPDATED lifecycle events if there is
    // no separate installed() handler
    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        if (context.configBooleanValue('switches')) {
            await context.api.subscriptions.subscribeToCapability('switch', 'switch', 'switchHandler')
        }
        if (context.configBooleanValue('locks')) {
            await context.api.subscriptions.subscribeToCapability('lock', 'lock', 'lockHandler')
        }
    })

    // Handler called when the status of a switch changes
    .subscribedEventHandler('switchHandler', (context, event) => {
        if (event.componentId === 'main') {
            sse.send({
                deviceId: event.deviceId,
                value: event.value
            })
        }
    })

    // Handler called when the status of a lock changes
    .subscribedEventHandler('lockHandler', (context, event) => {
        if (event.componentId === 'main') {
            sse.send({
                deviceId: event.deviceId,
                value: event.value
            })
        }
    });

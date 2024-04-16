/*
 *  Outbound connector to a SignalR hub
 * 
 */

"use strict";

//const { HubConnectionBuilder } = require('@microsoft/signalr');
import signalr from 'node-signalr'

module.exports.connector = function (parent) {
    var obj = {};

    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;


    var pluginName = "connector";

    obj.exports = [
        'getConnectorStatus',
        'onDeviceRefreshEnd',
    ]

    obj.getConnectorStatus = function () {

        //TODO: Check the status of the SignalR connection

        return "Connector is running";    
    }

    obj.onDeviceRefreshEnd = function() {
        obj.debug('PLUGIN', pluginName, 'Plugin connector is active');
        console.log('Plugin connector is active');

    };

    obj.server_startup = function() {
        obj.debug('PLUGIN', pluginName, 'Plugin connector is starting');
        console.log('Plugin connector is starting');
    };


    return obj;
}
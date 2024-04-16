/*
 *  Outbound connector to a SignalR hub
 * 
 */

"use strict";


const { HubConnectionBuilder } = require('node-signalr');
const { Session } = require('libmeshctrl');

module.exports.connector = function (parent) {
    var obj = {};

    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;

    obj.exports = [
        'getConnectorStatus',
    ]

    obj.getConnectorStatus = function () {

        //TODO: Check the status of the SignalR connection
        return "Connector is running";    
    }

    obj.getConfig = function () {
        var fs = require('fs');
        var path = require('path');
        var configFile = 'appsettings.json';

        var config = null;
        try {
            var configPath = path.join(__dirname, configFile);
            var configData = fs.readFileSync(configPath);
            config = JSON.parse(configData);
        }
        catch (err) {
            console.log('Error reading config file: ' + err);
        }
        console.log('Config: ' + config);
    }

    obj.timerTick = function() {
        console.log('Timer tick');
    }

    obj.setupTimer = function() {        
        obj.intervalTimer = setInterval(obj.timerTick, 1 * 60 * 1000);
    }

    obj.server_startup = function() {
        console.log('Plugin connector is starting');

        obj.getConfig();
        obj.setupTimer();
    };




    return obj;
}
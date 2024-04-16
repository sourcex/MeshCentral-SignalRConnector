/*
 *  Outbound connector to a SignalR hub
 * 
 */

"use strict";

//const { HubConnectionBuilder } = require('@microsoft/signalr');
//import signalr from 'node-signalr'

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

    obj.timerTick = function() {
        console.log('Timer tick');
        obj.meshServer.meshCtrl.getSession().then(function(session) {
            console.log('Session: ' + session);
        });
    }

    obj.setupTimer = function() {        
        obj.intervalTimer = setInterval(obj.timerTick, 1 * 60 * 1000);

    }

    obj.server_startup = function() {
        console.log('Plugin connector is starting');

        obj.setupTimer();
    };




    return obj;
}
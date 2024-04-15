/*
 *  Outbound connector to a SignalR hub
 * 
 */

"use strict";

const { HubConnectionBuilder } = require('@microsoft/signalr');


module.exports.connector = function (parent) {
    var obj = {};

    obj.parent = parent;
    obj.meshServer = parent.parent;

    obj.exports = [
        "getConnectorStatus"
    ]

    obj.getConnectorStatus = function () {

        //TODO: Check the status of the SignalR connection

        return "Connector is running";    
    }


    return obj;
}
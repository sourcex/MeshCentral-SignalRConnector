/*
 *  Outbound connector to a SignalR hub
 *
 */

"use strict";

const { HubConnectionBuilder } = require("node-signalr");
const { Session } = require("libmeshctrl");

module.exports.connector = function (parent) {
  var obj = {};

  obj.parent = parent;
  obj.meshServer = parent.parent;
  obj.debug = obj.meshServer.debug;

  obj.exports = ["getConnectorStatus"];

  obj.getConnectorStatus = function () {
    //TODO: Check the status of the SignalR connection
    return "Connector is running";
  };

  obj.getConfig = function () {
    var fs = require("fs");
    var path = require("path");
    var configFile = "appsettings.json";

    var config = null;
    try {
      var configPath = path.join(__dirname, configFile);
      var configData = fs.readFileSync(configPath);
      config = JSON.parse(configData);
    } catch (err) {
      console.log("Error reading config file: " + err);
    }

    console.log("WS Url: " + config.url);
    console.log("User: " + config.user);
    console.log("Login Key length:" + config.loginkey.length);
    console.log("Hub Url: " + config.hubUrl);

    obj.url = config.url;
    obj.user = config.user;
    obj.loginkey = config.loginkey;
    obj.password = config.password;

    obj.hubUrl = config.hubUrl;
    obj.hubToken = config.hubToken;
  };

  obj.localConnect = async function () {
    console.log("Connecting to local instance");

    var url = obj.url;
    var options = {
      user: obj.user,
      password: obj.password,
      //loginkey: obj.loginkey,
    };

    try {
      let session = await Session.create(url, options);

      var users = await session.list_users();
      console.log("Users: " + JSON.stringify(users));
    } catch (err) {
      console.log("Error connecting to local instance: " + err);
    }
  };

  obj.timerTick = function () {
    console.log("Timer tick");
  };

  obj.setupTimer = function () {
    obj.intervalTimer = setInterval(obj.timerTick, 1 * 60 * 1000);
  };

  obj.server_startup = function () {
    console.log("Plugin connector is starting");

    obj.getConfig();
    obj.localConnect();

    obj.setupTimer();
  };

  return obj;
};

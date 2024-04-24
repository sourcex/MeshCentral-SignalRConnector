/*
 *  Outbound connector to a SignalR hub
 *
 */

"use strict";

//https://www.npmjs.com/package/@microsoft/signalr
const { Session } = require("libmeshctrl");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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

      const os = require('os'); 
      var hostname = os.hostname();
    } catch (err) {
      console.log("Error reading config file: " + err);
    }

    console.log("Hostname: " + hostname);
    console.log("WS Url: " + config.url);
    console.log("User: " + config.user);
    console.log("Login Key length:" + config.loginkey.length);
    console.log("Password length:" + config.password.length);
    console.log("Hub Url: " + config.hubUrl);

    obj.hostname = hostname;

    obj.url = config.url;
    obj.user = config.user;
    obj.loginkey = config.loginkey;
    obj.password = config.password;

    obj.hubUrl = config.hubUrl;
    obj.hubUser = config.hubUser;
    obj.hubToken = config.hubToken;
  };

  obj.hubConnect = async function () {
    console.log("Connecting to SignalR hub");

    //Get a token from the authentication REST endpoint
    try {
      var tokenUrl = obj.hubUrl + "/api/mesh";
      var tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: obj.hubUser,
          password: obj.hubToken,
        }),
      });

      if (!tokenResponse.ok) {
        console.log("Error getting token");
        return;
      }

      var tokenData = await tokenResponse.json();
      const token = tokenData.token;

      //Connect to the SignalR hub with the token
      //https://learn.microsoft.com/en-us/aspnet/core/signalr/configuration?view=aspnetcore-8.0&tabs=dotnet#configure-bearer-authentication
      const signalR = require("@microsoft/signalr");

      let connection = new signalR.HubConnectionBuilder()
        .withUrl(obj.hubUrl + "/meshhub", {
          accessTokenFactory: () => token,
        })
        .configureLogging(signalR.LogLevel.Trace)
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", (message) => {
        console.log("ReceiveMessage: " + message);
      });

      connection.on("ReceiveCommand", (command) => {
        console.log("ReceiveCommand: " + command);

        var commandData = JSON.parse(command);

        if (commandData.command === "list_users") {
          console.log("Received list_users command");

          obj.session.list_users().then(users => {
            console.log("List users response: " + users.length);

            var response = {
              id: commandData.id,
              command: commandData.command,
              data: users,
            };

            obj.connection.invoke("SendCommandResponse", JSON.stringify(response));
          });
        }

        if (commandData.command === "list_events") {
          console.log("Received list_events command");

          obj.session.list_events().then(events => {
            console.log("List events response: " + events.length);

            var response = {
              id: commandData.id,
              command: commandData.command,
              data: events,
            };

            obj.connection.invoke("SendCommandResponse", JSON.stringify(response));
          });
        }
      });

      connection.onclose((error) => {
        console.log("Connection closed: " + error);
        obj.hubConnect().then(() => {
          console.log("Attempted reconnection to hub");
        });
      });

      await connection.start();
      console.log("Connected to hub");
      obj.connection = connection;

      obj.UpdateServerName();
      obj.SendEvents();

    } catch (err) {
      console.log("Error connecting to hub: " + err);
      setTimeout(obj.hubConnect, 500);
    }
  };

  obj.localConnect = async function () {
    console.log("Connecting to local instance");

    var url = obj.url;
    var options = {
      user: obj.user,
      password: obj.password,
      ignoreSSL: true,
    };

    try {
      if (obj.session !== undefined) {
        console.log("Session is defined");
        return;
      }

      obj.session = await Session.create(url, options);
      console.log("Connected to local instance");

    } catch (err) {
      console.log("Error connecting to local instance: " + err);
      console.trace();
    }
  };

  obj.SendDeviceGroupList = async function () {
    //Send a device group list to the hub

    console.log("Sending device group list");
    var groups = await obj.session.list_device_groups();

    var response = {
      //We aren't tracking anything with this on the server side
      id: "00000000-0000-0000-0000-000000000000",
      command: "list_device_groups",
      data: groups,
    };

    obj.connection.invoke("SendCommandResponse", JSON.stringify(response));
  };

  obj.SendEvents = async function () {

    obj.session.listen_to_events((event) => {
      console.log("Event: " + event);

      var response = {
        id: "00000000-0000-0000-0000-000000000000",
        command: "event",
        data: event,
      };

      obj.connection.invoke("SendEvent", JSON.stringify(response));

    });
  }

  obj.UpdateServerName = async function () {
    //Send the hostname to UpdateServerName
    console.log("Sending server name");

    var response = {
      id: "00000000-0000-0000-0000-000000000000",
      command: "server_name",
      data: obj.hostname,
    };

    obj.connection.invoke("UpdateServerName", JSON.stringify(response));
  }

  obj.timerTick = async function () {
    console.log("Timer tick");
    if (obj.session === undefined) {
      console.log("Session is undefined");
    } else {
      //console.log("Session is defined");
    }

    if (obj.connection === undefined) {
      console.log("Connection is undefined");
    } else {
      //console.log("Connection status: " + obj.connection.state);
    }

    obj.SendDeviceGroupList();
  };

  obj.setupTimer = function () {
    obj.intervalTimer = setInterval(obj.timerTick, 1 * 60 * 1000);
  };

  obj.server_startup = function () {
    console.log("Plugin connector is starting");

    obj.getConfig();

    setTimeout(() => {
      obj.localConnect();
      obj.hubConnect();
      obj.setupTimer();
    }, 3000);
  };

  return obj;
};

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
    console.log("Password length:" + config.password.length);

    console.log("Hub Url: " + config.hubUrl);

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
    const { fetch } = require("node-fetch");

    //Get a token from the authentication REST endpoint
    var token = null;
    try {
      var tokenUrl = obj.hubUrl + "/api/mesh";
      var tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        body: JSON.stringify({
          username: obj.hubUser,
          password: obj.hubToken,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if(!tokenResponse.ok) {
        console.log("Error getting token");
        return;
      }

      var tokenData = await tokenResponse.json();
      token = tokenData.token;
    } catch (err) {
      console.log("Error getting token: " + err);
    }

    //Connect to the SignalR hub with the token
    //https://learn.microsoft.com/en-us/aspnet/core/signalr/configuration?view=aspnetcore-8.0&tabs=dotnet#configure-bearer-authentication
    try {
      var connection = new HubConnectionBuilder()
        .withUrl(obj.hubUrl + "/hub", {
          accessTokenFactory: () => token,
        })
        .configureLogging("debug")
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", (user, message) => {
        console.log("Received message: " + message);
      });


      /* 
        Process commands

            list_devices
            list_users
            list_user_groups
            listen_to_events

            device_info

            add_user
            add_user_to_device_group
            add_users_to_device


            add_user_group
            add_users_to_user_group

            move_to_device_group
            edit_device_group

            wake_devices
            run_command
        */


        connection.on("ReceiveCommand", (command) => {
            console.log("Received command: " + command);
            var commandData = JSON.parse(command);
            var commandName = commandData.name;
            var commandParams = commandData.params;

            if (commandName === "restart") {
                console.log("Restarting connector");
                obj.parent.restart();
            }

            if (commandName === "stop") {
                console.log("Stopping connector");
                obj.parent.stop();
            }

        });     

      connection.onclose((error) => {
        console.log("Connection closed: " + error);
      });

      await connection.start();
      console.log("Connected to hub");

      //Send a message to the hub
      await connection.invoke("SendMessage", "Connector", "Hello from connector");
    } catch (err) {
      console.log("Error connecting to hub: " + err);
    }


  };

  obj.localConnect = async function () {
    console.log("Connecting to local instance");

    var url = obj.url;
    var options = {
      user: obj.user,
      password: obj.password,
      //loginkey: obj.loginkey,
      ignoreSSL: true,
    };

    try {
      if (obj.session !== undefined) {
        console.log("Session is defined");
        return;
      }

      obj.session = await Session.create(url, options);
      console.log("Session created");

      var users = await session.list_users();
      console.log("Users: " + JSON.stringify(users));
    } catch (err) {
      console.log("Error connecting to local instance: " + err);
      console.trace();
    }
  };

  obj.timerTick = async function () {
    console.log("Timer tick");

    await obj.localConnect();

    var groups = await obj.session.list_device_groups();
    console.log("Device Groups: " + JSON.stringify(groups));

    //var devices = await obj.session.list_devices();
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

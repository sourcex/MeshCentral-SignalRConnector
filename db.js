"use strict";

module.exports.CreateDB = function (meshserver) {
  var obj = {};
  obj.dbVersion = 1;

  obj.initFunctions = function () {
    obj.updateDBVersion = function (new_version) {
      return obj.fdFile.updateOne(
        { type: "db_version" },
        { $set: { version: new_version } },
        { upsert: true }
      );
    };

    obj.getDBVersion = function () {
      return new Promise(function (resolve, reject) {
        obj.fdFile
          .find({ type: "db_version" })
          .project({ _id: 0, version: 1 })
          .toArray(function (err, vers) {
            if (vers.length == 0) resolve(1);
            else resolve(vers[0]["version"]);
          });
      });
    };

    obj.update = function(id, args) {
        id = formatId(id);
        return obj.file.updateOne( { _id: id }, { $set: args } );
    };
    obj.delete = function(id) {
        id = formatId(id);
        return obj.file.deleteOne( { _id: id } );
    };
    obj.get = function(id) {
        if (id == null || id == 'null') return new Promise(function(resolve, reject) { resolve([]); });
        id = formatId(id);
        return obj.file.find( { _id: id } ).toArray();
    };
  };

  if (meshserver.args.mongodb) {
    require("mongodb").MongoClient.connect(
      meshserver.args.mongodb,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (err, client) {
        if (err != null) {
          console.log("Unable to connect to database: " + err);
          process.exit();
          return;
        }

        var dbname = "meshcentral";
        if (meshserver.args.mongodbname) {
          dbname = meshserver.args.mongodbname;
        }

        const db = client.db(dbname);

        obj.file = db.collection("plugin_connector");

        obj.initFunctions();
      }
    );
  }
};

const { program } = require('commander');
const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const projectSettings = require('./projectsettings');
const validation = require('./validation');
const chalk = require('chalk');
const Table = require('cli-table');

module.exports = {
  listCommand: async function (path) {
    progress.spinner().start('Listing directory');
    await module.exports.list({
      path: path,
      listFilesInSubDirectories: false,
      supressErrors: false,
      cb: function(status, files) {
        if (status) {
          progress.spinner().stop();
          console.log('List of files at: ' + path);
          const table = new Table({
              head: ['Filename', 'Size'],
              colWidths: [50, 10]
          });
          files.forEach(function (item) {
            table.push(
              [item.filename, item.size]
            );
          });
          console.log(table.toString());
        }
      }
    });
  },
  list: async function (args) {
    args.cb = args.cb || function(){};

    validation.requireApiKey();
    validation.requireDomain(program.domain);

    let thisProjectSettings = projectSettings.get();

    let domain = program.domain || thisProjectSettings.domain;
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    requestArgs = "";
    if (args.listFilesInSubDirectories) {
      requestArgs = "?listfilesinsubdirectories=true";
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'lfs/' + domain + '/' + args.path + requestArgs, init)
    let responseJson = await validation.safelyParseJson(response)

    switch(response.status) {
      case 200:
        args.cb(true, responseJson.files);
        break;
      default:
        if (!args.suppressErrors) {
          errors.returnServerError(response.status, responseJson);
        }
        args.cb(false);
    }
  }
};
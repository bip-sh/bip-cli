const fs = require("fs");
const path = require("path");
const util = require("util");
const { program } = require('commander');
const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const validation = require('./validation');
const projectSettings = require('./projectsettings')
const chalk = require('chalk');
const emoji = require('node-emoji');
const Table = require('cli-table');
const got = require('got');
module.exports = {
  uploadCommand: async function (filepath, destination) {
    await module.exports.upload(filepath, destination, function (status) {
      if (status) {
        console.log(
          chalk.green(emoji.get('white_check_mark') + ' File uploaded successfully!')
        );
      }
    });
  },
  deleteCommand: async function (filepath) {
    await module.exports.delete(filepath, function (status) {
      if (status) {
        console.log(
          chalk.green(emoji.get('white_check_mark') + ' File deleted successfully!')
        );
      }
    });
  },
  delete: async function (filepath, cb) {
    cb = cb || function () { };
    validation.requireApiKey();
    validation.requireDomain(program.domain);
    let thisProjectSettings = projectSettings.get();
    let domain = program.domain || thisProjectSettings.domain;
    progress.spinner().start('Deleting file from LFS');
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'DELETE'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'lfs/' + domain + filepath, init)
    let responseJson = await validation.safelyParseJson(response)
    progress.spinner().stop();
    switch (response.status) {
      case 200:
        cb(true);
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  },
  upload: async function (filepath, destination) {
    validation.requireApiKey();
    validation.requireDomain(program.domain);
    let thisProjectSettings = projectSettings.get();
    let domain = program.domain || thisProjectSettings.domain;
    // Read the file
    try {
      var data = fs.createReadStream(filepath);
    } catch (err) {
      errors.returnError('An error occurred when reading the file. ' + err.message);
    }
    let relativePath = filepath.replace(process.cwd() + path.sep + '_lfs' + path.sep, '');
    progress.spinner().start('Uploading file to LFS: ' + relativePath + ' (0%)');
    try {
      let headers = {
        'X-Api-Key': config.userpref.get('apiKey')
      }
      const response = await got.put(config.api.uploadbaseurl + 'lfs/' + domain + destination, {
        headers: headers,
        body: data,
        responseType: 'json'
      })
      .on('uploadProgress', prog => {
        //console.log(prog.percent);
        let value = parseInt(prog.percent * 100);
        if (value !== 100) {
          progress.spinner().text = 'Uploading file to LFS: ' + relativePath + ' (' + parseInt(prog.percent * 100) + '%)';
        } else {
          progress.spinner().text = 'Uploading file to LFS: ' + relativePath + ' (Processing)';
        }
      });
  
      progress.spinner().stop();
  
      return true;
    } catch (error) {
      progress.spinner().stop();
      errors.returnServerError(error.response.statusCode, error.response.body, false);
    }
  }
};
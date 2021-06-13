const account = require('./account');
const config = require('./config');
const errors = require('./errors');
const projectSettings = require('./projectsettings');
const prices = require('./prices');
const domainavailability = require('./domainavailability');
const progress = require('./progress');
const validation = require('./validation');
const tasks = require('./tasks');
const chalk = require('chalk');
const Table = require('cli-table');
const emoji = require('node-emoji');
const fs = require("fs");
const os = require("os");
const prompts = require('prompts');
const webpack = require('webpack');
const { program } = require('commander');
const path = require('path');
const got = require('got');
const rimraf = require('rimraf');

module.exports.listCommand = async function (domain) {
  validation.requireApiKey();

  progress.spinner().start('Listing functions');
  await module.exports.list(domain, function(status, functions) {
    if (status) {
      progress.spinner().stop();
      console.log('List of functions:');
      const table = new Table({
          head: ['Function'],
          colWidths: [50]
      });
      functions.forEach(function (item) {
        table.push(
          [item.name]
        );
      });
      console.log(table.toString());
    }
  });
}
module.exports.createCommand = async function () {
  validation.requireApiKey();

  const promptRes = await prompts({
    type: 'text',
    name: 'domain',
    message: `Enter the domain that you'd like to create a function on`
  });

  if (promptRes.domain) {
    let domain = promptRes.domain

    const functionPromptRes = await prompts({
      type: 'text',
      name: 'function',
      message: `Enter the name of your new function`
    });

    if (functionPromptRes.function) {
      progress.spinner().start('Creating function');

      let headers = {
        'X-Api-Key': config.userpref.get('apiKey'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      let init = {
        headers: headers,
        method: 'POST',
        body: 'domain=' + domain + '&function=' + functionPromptRes.function
      }
      let response = await validation.safelyFetch(config.api.baseurl + 'functions/create', init)
      let responseJson = await validation.safelyParseJson(response)
  
      progress.spinner().stop();

      switch(response.status) {
        case 200:
          console.log(
            chalk.green(emoji.get('white_check_mark') + ' Function created successfully!')
          );
          break;
        default:
          errors.returnServerError(response.status, responseJson);
      }
    }
  }
}
module.exports.deleteCommand = async function () {
  validation.requireApiKey();

  const promptRes = await prompts({
    type: 'text',
    name: 'domain',
    message: `Enter the domain the function belongs to`
  });

  if (promptRes.domain) {
    domain = promptRes.domain

    const functionPromptRes = await prompts({
      type: 'text',
      name: 'function',
      message: `Enter the name of the function you'd like to delete`
    });

    if (functionPromptRes.function) {
      progress.spinner().start('Deleting function');

      let headers = {
        'X-Api-Key': config.userpref.get('apiKey')
      }
      let init = {
        headers: headers,
        method: 'DELETE',
        body: 'domain=' + domain + '&function=' + functionPromptRes.function
      }
      let response = await validation.safelyFetch(config.api.baseurl + 'functions', init)
      let responseJson = await validation.safelyParseJson(response)

      progress.spinner().stop();

      switch(response.status) {
        case 200:
          console.log(
            chalk.green(emoji.get('white_check_mark') + ' Function deleted successfully!')
          );
          break;
        default:
          errors.returnServerError(response.status, responseJson);
      }
    }
  }
}
module.exports.deployCommand = async function () {
  validation.requireApiKey();
  if (await validation.requireFunctionProject()) {
    if (await validation.requireDomain(program.domain)) {
      if (await validation.requireFunction(program.function)) {
        let thisProjectSettings = projectSettings.get();

        let domain = program.domain || thisProjectSettings.domain;
        let functionName = program.function || thisProjectSettings.function;

        progress.spinner().start('Preparing function');

        let tmpLocation = os.tmpdir() + path.sep + 'functiondeployment-' + Date.now();

        if (!fs.existsSync('./index.js')) {
          errors.returnError('Your function directory must contain an index.js file.');
        }

        webpack({
          mode: 'production',
          entry: './index.js',
          target: 'node',
          output: {
            path: tmpLocation,
            filename: 'index.js',
            libraryTarget: 'commonjs'
          }
        }, (err, stats) => { // [Stats Object](#stats-object)
          if (err || stats.hasErrors()) {
            progress.spinner().stop();
            // [Handle errors here](#error-handling)
            console.log(
              chalk.red('An unknown error occurred while packaging the deployment')
            );
            const info = stats.toJson();
            console.error(info.errors);
          } else {
            // Done processing
            uploadDeployment(domain, functionName, tmpLocation, function() {
              console.log(
                chalk.green(emoji.get('tada') + ' Function deployed!')
              );
            });
          }
        });
      }
    }
  }
}
module.exports.useCommand = async function (functionName) {
  return module.exports.use(functionName, false);
}
module.exports.use = async function (functionName, silent) {
  functionName = functionName || "";
  silent = silent || false;

  validation.requireApiKey();

  if (functionName == "") {
    const promptRes = await prompts({
      type: 'text',
      name: 'functionName',
      message: `Enter the function that you'd like to deploy this project to`
    });
  
    if (promptRes.functionName) {
      functionName = promptRes.functionName
    }
  }

  if (functionName != "") {
    projectSettings.set('function', functionName);
    if (!silent) {
      console.log(
        chalk.green(emoji.get('white_check_mark') + ' Function set')
      );
    }
  }
}
module.exports.list = async function (domain, cb) {
  cb = cb || function(){};

  validation.requireApiKey();
  
  let headers = {
    'X-Api-Key': config.userpref.get('apiKey')
  }
  let init = {
    headers: headers,
    method: 'GET'
  }
  let response = await validation.safelyFetch(config.api.baseurl + 'functions/' + domain, init)
  let responseJson = await validation.safelyParseJson(response)

  switch(response.status) {
    case 200:
      cb(true, responseJson.functions);
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}
async function uploadDeployment(domain, functionName, filepath, cb) {
  cb = cb || function(){};

  let scriptPath = filepath + path.sep + 'index.js'

  // Read the file
  var data = fs.createReadStream(scriptPath);
  data.on('error', function(err) {
    errors.returnError('An error occurred when reading the deployment for upload. ' + err.message);
  });

  progress.spinner().text = 'Deploying function';
  let headers = {
    'X-Api-Key': config.userpref.get('apiKey')
  }

  try {
    const response = await got.put(config.api.baseurl + 'functions?domain=' + domain + '&function=' + functionName, {
      headers: headers,
      body: data,
      responseType: 'json'
    })

    progress.spinner().stop();
    rimraf.sync(filepath);

    cb();
  } catch (error) {
    progress.spinner().stop();

    rimraf.sync(filepath);
    
    errors.returnServerError(error.response.statusCode, error.response.body);
	}
}
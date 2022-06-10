const config = require('./config');
const errors = require('./errors');
const domain = require('./domain');
const projectSettings = require('./projectsettings');
const progress = require('./progress');
const validation = require('./validation');
const chalk = require('chalk');
const Table = require('cli-table');
const emoji = require('node-emoji');
const fs = require("fs");
const os = require("os");
const process = require("process");
const prompts = require('prompts');
const webpack = require('webpack');
const { program } = require('commander');
const path = require('path');
const got = require('got');
const rimraf = require('rimraf');
const { resolve } = require('path');

module.exports.listCommand = async function (thisDomain) {
  thisDomain = thisDomain || null;

  validation.requireApiKey();

  if (thisDomain == null) {
    progress.spinner().start('Requesting data');

    thisDomain = await domain.listChoose({ 
      message: `Select the domain that you'd like list functions for` 
    });
  }

  if (thisDomain != null) {
    progress.spinner().start('Listing functions');
    let functionsResponse =  await module.exports.list(thisDomain, false);
    if (functionsResponse && functionsResponse.status) {
      progress.spinner().stop();
      console.log('List of functions:');
      const table = new Table({
          head: ['Function'],
          colWidths: [50]
      });
      functionsResponse.functions.forEach(function (item) {
        table.push(
          [item.name]
        );
      });
      console.log(table.toString());
    }
  }
}
module.exports.createCommand = async function () {
  validation.requireApiKey();

  let thisDomain = await domain.listChoose({ 
    message: `Select the domain that you'd like to create a function on` 
  });

  if (thisDomain != null) {
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
        body: 'domain=' + thisDomain + '&function=' + functionPromptRes.function
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

  let thisDomain = await domain.listChoose({ 
    message: `Select the domain the function belongs to` 
  });

  if (thisDomain != null) {
    let thisFunction = await module.exports.listChoose({
      domain: thisDomain,
      message: `Confirm the function you'd like to delete` 
    });

    if (thisFunction != null) {
      progress.spinner().start('Deleting function');

      let headers = {
        'X-Api-Key': config.userpref.get('apiKey')
      }
      let init = {
        headers: headers,
        method: 'DELETE',
        body: 'domain=' + thisDomain + '&function=' + thisFunction
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
        
        let webpackConfig = {
          mode: 'production',
          entry: './index.js',
          target: 'webworker',
          output: {
            path: tmpLocation,
            filename: 'index.js'
          }
        };

        if (fs.existsSync('./webpack.config.js')) {
          webpackConfig = require(path.join(process.cwd(), './webpack.config.js'));
          webpackConfig = await (typeof webpackConfig === "function" ? webpackConfig({}) : webpackConfig);
        }

        if (webpackConfig.target !== undefined && webpackConfig.target !== "webworker") {
          errors.returnError(`Building a function with target ${JSON.stringify(config.target)} isn't supported`);
        }
        webpackConfig.target = "webworker";

        if (webpackConfig.output === undefined) {
          webpackConfig.output = {};
        }

        webpackConfig.output.path = tmpLocation;
        webpackConfig.output.filename = 'index.js';

        webpack(webpackConfig, (err, stats) => { // [Stats Object](#stats-object)
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
  let thisDomain = await domain.listChoose({ 
    message: `Select the domain the function belongs to` 
  });

  if (thisDomain != null) {
    return module.exports.use(promptRes.domain, functionName, false);
  }
}
module.exports.use = async function (domain, functionName, silent) {
  functionName = functionName || null;
  silent = silent || false;

  validation.requireApiKey();

  if (functionName == null) { 
    functionName = await module.exports.listChoose({
      domain: domain,
      message: `Enter the name of the function that you'd like to deploy to` 
    });
  }

  if (functionName != null) {
    projectSettings.set('function', functionName);
    if (!silent) {
      console.log(
        chalk.green(emoji.get('white_check_mark') + ' Function set')
      );
    }
    return true;
  }
}
module.exports.listChoose = async function(opts) {
  thisDomain = opts.domain || null;
  message = opts.message || "";

  return new Promise(async function (resolve, reject) {
    if (thisDomain == null) {
      // A domain must be specified
      resolve(null)
    } else {
      let functionsResponse =  await module.exports.list(thisDomain, false);
      if (functionsResponse && functionsResponse.status) {

        let functionChoices = []
        functionsResponse.functions.forEach(function (item) {
          functionChoices.push({ title: item.name });
        });

        const functionPromptRes = await prompts({
          type: 'autocomplete',
          name: 'function',
          message: message,
          choices: functionChoices
        });

        if (functionPromptRes.function) {
          resolve(functionPromptRes.function)
        }
      }
    }
  });
}
module.exports.list = async function (domain, throwErrors) {
  throwErrors = throwErrors || false;

  validation.requireApiKey();

  return new Promise(async function (resolve, reject) {
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
        resolve({status: true, functions: responseJson.functions});
        break;
      default:
        if (throwErrors) {
          reject(errors.formattedServerError(response.status, responseJson))
        } else {
          errors.returnServerError(response.status, responseJson);
          resolve({status: false});
        }
    }
  });
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
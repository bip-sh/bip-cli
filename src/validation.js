const chalk = require('chalk');
const config = require('./config');
const domain = require('./domain');
const functions = require('./functions');
const progress = require('./progress');
const projectSettings = require('./projectsettings');
const fetch = require('node-fetch');

module.exports.requireApiKey = function () {
  if (!config.userpref.has('apiKey')) {
    progress.spinner().stop();
    console.log(
      chalk.red('You must login before using this command')
    );
    process.exit(1);
  }
}
module.exports.requireDomain = async function (argDomain) {
  thisProjectSettings = projectSettings.get();
  if (!thisProjectSettings.domain && !argDomain) {
    progress.spinner().stop();
    console.log(
      "You need to specify the domain you'd like to deploy to"
    );
    if (await domain.useCommand()) {
      return true;
    }
  } else {
    return true;
  }

}
module.exports.requireFunction = async function (argFunction) {
  thisProjectSettings = projectSettings.get();
  if (!thisProjectSettings.function && !argFunction) {
    progress.spinner().stop();
    console.log(
      "You need to specify the function you'd like to deploy to"
    );
    if (await functions.useCommand()) {
      return true;
    }
  } else {
    return true;
  }

}
module.exports.requireProject = async function () {
  thisProjectSettings = projectSettings.get();
  if (!thisProjectSettings) {
    progress.spinner().stop();
    console.log(
      "As this is the first time you're deploying this project, we're going to initialise it (you can also do this via 'bip init')"
    );
    if (await projectSettings.init(false)) {
      return true;
    }
  } else {
    return true;
  }
}
module.exports.requireFunctionProject = async function () {
  thisProjectSettings = projectSettings.get();
  if (!thisProjectSettings) {
    progress.spinner().stop();
    console.log(
      "As this is the first time you're deploying this function, we're going to initialise it (you can also do this via 'bip fn init')"
    );
    if (await projectSettings.initFunction(false)) {
      return true;
    }
  } else {
    return true;
  }
}
module.exports.safelyParseJson = function (response) {
  let responseJson = response.json().catch(function(err) {
    progress.spinner().stop();
    switch(response.status) {
      case 413:
        console.log(
          chalk.red('The deployment was too big to be uploaded')
        );
        break;
      case 429:
        console.log(
          chalk.red('Too many requests. Please try again in a few minutes')
        );
        break;
      default:
        console.log(
          chalk.red('An error occurred while parsing the server response')
        );
    }
    process.exit(1);
  })
  return responseJson;
}
module.exports.safelyFetch = async function (url, init) {
  try {
    return await fetch(url, init)
  } catch (err) {
    progress.spinner().stop();
    switch(err.code) {
      case 'ENOTFOUND':
        console.log(
          chalk.red('An error occurred while connecting to the server. Please check that you have an internet connection and try again.')
        );
        break;
      default:
        console.log(
          chalk.red('An error occurred while connecting to the server. Please try again.')
        );
    }
    process.exit(1);
  }
}
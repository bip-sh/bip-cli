const chalk = require('chalk');
const config = require('./config');
const progress = require('./progress');
const projectSettings = require('./projectsettings');
const fetch = require('node-fetch');

module.exports = {
  requireApiKey: function () {
    if (!config.userpref.has('apiKey')) {
      progress.spinner().stop();
      console.log(
        chalk.red('You must login before using this command')
      );
      process.exit(1);
    }
  },
  requireDomain: function (argDomain) {
    thisProjectSettings = projectSettings.get();
    if (!thisProjectSettings.domain && !argDomain) {
      progress.spinner().stop();
      console.log(
        chalk.red('You must specify a domain before using this command')
      );
      process.exit(1);
    }
  },
  safelyParseJson: function (response) {
    let responseJson = response.json().catch(function(err) {
      progress.spinner().stop();
      console.log(
        chalk.red('An error occurred while parsing the server response')
      );
      process.exit(1);
    })
    return responseJson;
  },
  safelyFetch: async function (url, init) {
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
};
const config = require('./config');
const errors = require('./errors');
const projectSettings = require('./projectsettings');
const progress = require('./progress');
const validation = require('./validation');
const chalk = require('chalk');
const open = require('open');

module.exports = {
  balanceCommand: async function () {
    validation.requireApiKey();

    progress.spinner().start('Getting account balance');
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'account/balance', init)
    let responseJson = await validation.safelyParseJson(response)

    progress.spinner().stop();

    switch(response.status) {
      case 200:
        console.log('Your account balance is: ' + responseJson.symbol + responseJson.balance);
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  },
  topupCommand: async function (amount) {
    validation.requireApiKey();

    progress.spinner().start('Requesting topup');
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let init = {
      headers: headers,
      method: 'POST',
      body: 'amount=' + amount
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'account/topup', init)
    let responseJson = await validation.safelyParseJson(response)

    progress.spinner().stop();

    switch(response.status) {
      case 200:
        await open(responseJson.url);
        console.log('Please follow the instructions in the newly opened browser window to topup your account.');
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
};
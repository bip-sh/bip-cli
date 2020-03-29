const chalk = require('chalk');
const config = require('./config');
const progress = require('./progress');
const errors = require('./errors');
const validation = require('./validation');

module.exports = {
  getStatus: async function (currentVersion, cb) {
    cb = cb || function(){};

    let init = {
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'status?version=' + currentVersion, init)
    let responseJson = await validation.safelyParseJson(response)
    switch(response.status) {
      case 200:
        if (responseJson.hasOwnProperty('message')) {
          console.log(
            chalk.yellow(responseJson.message)
          );
          console.log('')
        }
        cb();
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  },
};
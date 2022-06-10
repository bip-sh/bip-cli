const chalk = require('chalk');
const emoji = require('node-emoji');
const progress = require('./progress');

module.exports = {
  returnError: function(errorMessage) {
    progress.spinner().stop();
    console.log(
      chalk.red(errorMessage)
    );
    process.exit(1);
  },
  returnServerError: function (responseStatus, responseJson, exit) {
    exit = (typeof exit !== 'undefined') ? exit : true;

    progress.spinner().stop();
    if (responseJson.status === "error") {
      console.log(
        chalk.red(emoji.emojify(responseJson.message))
      );
    } else {
      console.log(
        chalk.red('An unknown error occurred. Status code: ' + responseStatus)
      );
    }
    if (exit) {
      process.exit(1);
    }
  },
  formattedServerError: function (responseStatus, responseJson) {
    progress.spinner().stop();
    if (responseJson.status === "error") {
      return { code: responseStatus, message: responseJson.message}
    } else {
      return { code: 0, message: `An unknown error occurred. Status code: ${responseStatus}`}
    }
  }
};
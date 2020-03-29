const chalk = require('chalk');
const progress = require('./progress')

module.exports = {
  returnError: function(errorMessage) {
    progress.spinner().stop();
    console.log(
      chalk.red(errorMessage)
    );
    process.exit(1);
  },
  returnServerError: function (responseStatus, responseJson) {
    progress.spinner().stop();
    if (responseJson.status === "error") {
      console.log(
        chalk.red(responseJson.message)
      );
    } else {
      console.log(
        chalk.red('An unknown error occurred. Status code: ' + responseStatus)
      );
    }
    process.exit(1);
  }
};
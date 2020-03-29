const ora = require('ora');
const spinner = ora();

module.exports = {
  spinner: function () {
    return spinner;
  }
};
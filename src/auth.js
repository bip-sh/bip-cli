const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const validation = require('./validation');
const chalk = require('chalk');
const emoji = require('node-emoji');
const prompts = require('prompts');

module.exports = {
  loginCommand: async function () {

    const promptRes = await prompts({
      type: 'text',
      name: 'email',
      message: `Please enter your email address`
    });

    if (promptRes.email) {
      let email = promptRes.email
      progress.spinner().start('Logging in');
      let headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      let init = {
        headers: headers,
        method: 'POST',
        body: 'email=' + email
      }
      let response = await validation.safelyFetch(config.api.baseurl + 'login', init)
      let responseJson = await validation.safelyParseJson(response)

      progress.spinner().stop();

      switch(response.status) {
        case 200:
          console.log(
            emoji.emojify(responseJson.message)
          );
          console.log('');
          await verifyCode(email);
          break;
        default:
          errors.returnServerError(response.status, responseJson);
      }
    }
  },
  logoutCommand: async function () {
    config.userpref.delete('apiKey');
    console.log(
      chalk.green(emoji.get('door') + ' Logged out successfully')
    );
  },
  whoamiCommand: async function () {
    validation.requireApiKey();

    progress.spinner().start('Fetching data');

    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'account/whoami', init)
    let responseJson = await validation.safelyParseJson(response)

    switch(response.status) {
      case 200:
        progress.spinner().stop();
        console.log(emoji.get('wave') + ' You are logged in as ' + responseJson.account.email);
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
};

async function verifyCode(email) {
  const promptRes = await prompts({
    type: 'text',
    name: 'code',
    message: `Enter your login code`
  });
  if (promptRes.code) {
    progress.spinner().start('Logging in');
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let init = {
      headers: headers,
      method: 'POST',
      body: 'email=' + email + '&code=' + promptRes.code
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'login/verify', init)
    let responseJson = await validation.safelyParseJson(response)

    progress.spinner().stop();

    switch(response.status) {
      case 200:
        config.userpref.set('apiKey', responseJson.apiKey);
        console.log(
          chalk.green(emoji.emojify(responseJson.message))
        );
        break;
      case 401:
        console.log(
          chalk.red(responseJson.message)
        );
        console.log('');
        await verifyCode(email);
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
}
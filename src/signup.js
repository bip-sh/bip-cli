const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const validation = require('./validation');
const chalk = require('chalk');
const emoji = require('node-emoji');
const prompts = require('prompts');

module.exports = {
  signupCommand: async function () {

    console.log(`Creating an account with bip.sh is quick and easy. We'll ask you a few questions, then send an API key to your email address.`)

    const questions = [
      {
        type: 'text',
        name: 'email',
        message: 'Please enter your email address',
        validate: value => value ? true : `This field is required`
      },
      {
        type: 'text',
        name: 'firstName',
        message: 'Please enter your first name',
        validate: value => value ? true : `This field is required`
      },
      {
        type: 'text',
        name: 'surname',
        message: 'Please enter your surname',
        validate: value => value ? true : `This field is required`
      },
      {
        type: 'select',
        name: 'currency',
        message: 'Which currency would you like your account to be set to? Once this has been set, it cannot be changed',
        choices: [
          { title: 'GBP', description: 'Pound Sterling', value: 'gbp' },
          { title: 'EUR', description: 'Euro', value: 'eur' },
          { title: 'USD', description: 'United States Dollar', value: 'usd' }
        ],
        initial: 0
      },
      {
        type: 'confirm',
        name: 'terms',
        message: 'Do you accept our Terms & Conditions, available at https://www.bip.sh/terms?',
        initial: false
      }
    ];

    const inputResponse = await prompts(questions);

    if (!inputResponse.terms) {
      console.log(
        chalk.red('You must accept our Terms & Conditions to continue.')
      );
    } else {
      if (inputResponse.email && inputResponse.firstName && inputResponse.surname && inputResponse.currency) {
        console.log(
          chalk.yellow('Email: ' + inputResponse.email + ' | First Name: ' + inputResponse.firstName + ' | Surname: ' + inputResponse.surname + ' | Currency: ' + inputResponse.currency)
        );

        const confirmRes = await prompts({
          type: 'confirm',
          name: 'value',
          message: 'Would you like to create your account using the above details?',
          initial: true
        });

        if (confirmRes.value) {
          progress.spinner().start('Creating your account');

          let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
          let init = {
            headers: headers,
            method: 'POST',
            body: 'email=' + inputResponse.email + '&firstName=' + inputResponse.firstName + '&surname=' + inputResponse.surname + '&currency=' + inputResponse.currency
          }
          let response = await validation.safelyFetch(config.api.baseurl + 'account/signup', init)
          let responseJson = await validation.safelyParseJson(response)

          progress.spinner().stop();

          switch(response.status) {
            case 200:
              console.log(
                chalk.green(emoji.emojify(responseJson.message))
              );
              break;
            default:
              errors.returnServerError(response.status, responseJson);
          }
        }
      }
    }
  }
};
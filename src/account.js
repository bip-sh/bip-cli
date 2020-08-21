const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const validation = require('./validation');
const chalk = require('chalk')
const emoji = require('node-emoji')
const open = require('open');
const prompts = require('prompts')

module.exports.balanceCommand = async function () {
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
      console.log(emoji.get('pound') + ' Your account balance is: ' + responseJson.symbol + responseJson.balance);
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}
module.exports.setupPaymentCommand = async function () {
  validation.requireApiKey();

  const promptRes = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Press Y to open a new browser window and attach a payment card to your account',
    initial: true
  });

  // Continue if user confirms
  if (promptRes.value) {
    progress.spinner().start('Requesting data');
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'account/setuppayment', init)
    let responseJson = await validation.safelyParseJson(response)

    progress.spinner().stop();

    switch(response.status) {
      case 200:
        await open(responseJson.url);
        console.log(emoji.get('link') + ' Please follow the instructions in the newly opened browser window to attach a payment card to your account.');
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
}
module.exports.billingCommand = async function () {
  validation.requireApiKey();

  progress.spinner().start('Requesting data');
  let headers = {
    'X-Api-Key': config.userpref.get('apiKey'),
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  let init = {
    headers: headers,
    method: 'GET'
  }
  let response = await validation.safelyFetch(config.api.baseurl + 'account/billingportal', init)
  let responseJson = await validation.safelyParseJson(response)

  progress.spinner().stop();

  switch(response.status) {
    case 200:
      await open(responseJson.url);
      console.log(emoji.get('link') + ' The billing portal has opened in a new window.');
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}

module.exports.changePlanCommand = async function (domain) {
  domain = domain || "";

  validation.requireApiKey();

  if (domain == "") {
    const promptRes = await prompts({
      type: 'text',
      name: 'domain',
      message: `Enter the domain that you'd like to change the plan for`
    });
  
    if (promptRes.domain) {
      domain = promptRes.domain
    }
  }

  if (domain != "") {

    progress.spinner().start('Requesting data');
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'account/changeplan/' + domain, init)
    let responseJson = await validation.safelyParseJson(response)

    progress.spinner().stop();

    switch(response.status) {
      case 200:
        console.log("You're changing the plan for the domain " + domain);

        if (responseJson.plans.length == 0) {
          console.log(
            'No plans found'
          );
          process.exit(1);
        }

        let returnPlans = [];
        responseJson.plans.forEach(function(plan) {
          returnPlans.push({
            title: plan.plan_name,
            description: plan.description,
            value: plan.plan_id
          })
        });

        const promptRes = await prompts({
          type: 'select',
          name: 'planID',
          message: "Please select the plan you'd like to move this domain to",
          choices: returnPlans,
          initial: 0
        });

        // Continue if user confirms
        if (promptRes.planID) {
          const confirmRes = await prompts({
            type: 'confirm',
            name: 'value',
            message: 'Are you sure you want to move this domain to the selected plan?',
            initial: false
          });
    
          // Continue if user confirms
          if (confirmRes.value) {
            progress.spinner().start('Changing plan');
            let headers = {
              'X-Api-Key': config.userpref.get('apiKey'),
              'Content-Type': 'application/x-www-form-urlencoded'
            }
            let init = {
              headers: headers,
              method: 'POST',
              body: 'domain=' + domain + '&planID=' + promptRes.planID
            }
            let response = await validation.safelyFetch(config.api.baseurl + 'account/changeplan/confirm', init)
            let responseJson = await validation.safelyParseJson(response)
        
            switch(response.status) {
              case 200:
                progress.spinner().stop();
                console.log(
                  chalk.green(emoji.emojify(responseJson.message))
                );
                break;
              default:
                errors.returnServerError(response.status, responseJson);
            }
          }
        }
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
}
const account = require('./account');
const config = require('./config');
const errors = require('./errors');
const projectSettings = require('./projectsettings');
const prices = require('./prices');
const domainavailability = require('./domainavailability');
const progress = require('./progress');
const validation = require('./validation');
const tasks = require('./tasks');
const chalk = require('chalk');
const Table = require('cli-table');
const emoji = require('node-emoji');
const prompts = require('prompts');

module.exports.listCommand = async function (path) {
  progress.spinner().start('Listing domains');
  await module.exports.list(function(status, domains) {
    if (status) {
      progress.spinner().stop();
      console.log('List of domains:');
      const table = new Table({
          head: ['Domain'],
          colWidths: [50]
      });
      domains.forEach(function (item) {
        table.push(
          [item.domain_name]
        );
      });
      console.log(table.toString());
    }
  });
}
module.exports.createCommand = async function () {
  validation.requireApiKey();

  const promptRes = await prompts({
    type: 'text',
    name: 'domain',
    message: `Please enter the domain that you'd like to create`
  });

  if (promptRes.domain) {
    let domain = promptRes.domain

    progress.spinner().start('Checking availability');

    await domainavailability.get(domain, async function(response) {
      progress.spinner().stop();

      const promptRes = await prompts( {
        type: 'confirm',
        name: 'value',
        message: response.message,
        initial: false
      });

      // Continue if user confirms
      if (promptRes.value) {
        progress.spinner().start('Creating domain');
        let headers = {
          'X-Api-Key': config.userpref.get('apiKey')
        }
        let init = {
          headers: headers,
          method: 'POST'
        }
        let response = await validation.safelyFetch(config.api.baseurl + 'domains/' + domain, init)
        let responseJson = await validation.safelyParseJson(response)
    
        switch(response.status) {
          case 200:
            // Track status of remote task
            tasks.getStatus(responseJson.taskID, function(status, statusText) {
              statusText = statusText || "";

              progress.spinner().stop();
          
              if (status == 3) {
                if (statusText != "") {
                  console.log(
                    chalk.green(emoji.get('white_check_mark') + ' ' + statusText)
                  );
                } else {
                  console.log(
                    chalk.green(emoji.get('white_check_mark') + ' Domain created successfully!')
                  );
                }
              } else {
                if (status == 4) {
                  if (statusText != "") {
                    console.log(
                      chalk.red(statusText)
                    );
                  } else {
                    console.log(
                      chalk.red('An unknown error occurred during domain creation')
                    );
                  }
                }
              }
            });
            break;
          default:
            errors.returnServerError(response.status, responseJson);
        }
      }
    });
  }
}
module.exports.deleteCommand = async function (domain) {
  validation.requireApiKey();

  const promptRes = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Are you sure you want to delete the domain ' + domain + '?',
    initial: false
  });

  // Continue if user confirms
  if (promptRes.value) {
    progress.spinner().start('Deleting domain');
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'DELETE'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'domains/' + domain, init)
    let responseJson = await validation.safelyParseJson(response)

    switch(response.status) {
      case 200:
        tasks.getStatus(responseJson.taskID, function(status, statusText) {
          statusText = statusText || "";

          progress.spinner().stop();
      
          if (status == 3) {
            if (statusText != "") {
              console.log(
                chalk.green(emoji.get('white_check_mark') + ' ' + statusText)
              );
            } else {
              console.log(
                chalk.green(emoji.get('white_check_mark') + ' Domain deleted successfully!')
              );
            }
          } else {
            if (status == 4) {
              if (statusText != "") {
                console.log(
                  chalk.red(statusText)
                );
              } else {
                console.log(
                  chalk.red('An unknown error occurred during domain deletion')
                );
              }
            }
          }
        });
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
}
module.exports.useCommand = async function (domain) {
  projectSettings.set('domain', domain);

  console.log(
    chalk.green(emoji.get('white_check_mark') + ' Domain set')
  );
}
module.exports.list = async function (cb) {
  cb = cb || function(){};

  validation.requireApiKey();
  
  let headers = {
    'X-Api-Key': config.userpref.get('apiKey')
  }
  let init = {
    headers: headers,
    method: 'GET'
  }
  let response = await validation.safelyFetch(config.api.baseurl + 'domains', init)
  let responseJson = await validation.safelyParseJson(response)

  switch(response.status) {
    case 200:
      cb(true, responseJson.domains);
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}
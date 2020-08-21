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
  progress.spinner().start('Listing aliases');
  await module.exports.list(function(status, aliases) {
    if (status) {
      progress.spinner().stop();
      console.log('List of aliases:');
      const table = new Table({
          head: ['Alias', 'Domain'],
          colWidths: [40, 40]
      });
      aliases.forEach(function (item) {
        table.push(
          [item.alias_name, item.domain_name]
        );
      });
      console.log(table.toString());
    }
  });
}
module.exports.createCommand = async function () {
  validation.requireApiKey();

  const questions = [
    {
      type: 'text',
      name: 'domain',
      message: "Please enter the Bip domain that you'd like to link your alias to, including the extension (e.g. example.bip.sh)",
      validate: value => value ? true : `This field is required`
    },
    {
      type: 'text',
      name: 'alias',
      message: 'Please enter your new alias. This must be an existing domain name',
      validate: value => value ? true : `This field is required`
    }
  ];

  const inputResponse = await prompts(questions);

  if (inputResponse.domain && inputResponse.alias) {
    let domain = inputResponse.domain
    let alias = inputResponse.alias

    progress.spinner().start('Creating alias');

    let headers = {
      'X-Api-Key': config.userpref.get('apiKey'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let init = {
      headers: headers,
      method: 'POST',
      body: 'domain=' + domain + '&alias=' + alias
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'aliases', init)
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
                chalk.green(emoji.get('white_check_mark') + ' Alias created successfully!')
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
                  chalk.red('An unknown error occurred during alias creation')
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
module.exports.deleteCommand = async function (alias) {
  alias = alias || "";

  validation.requireApiKey();

  if (alias == "") {
    const promptRes = await prompts({
      type: 'text',
      name: 'alias',
      message: `Enter the alias that you'd like to delete`
    });
  
    if (promptRes.alias) {
      alias = promptRes.alias
    }
  }

  if (alias != "") {
    const promptRes = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Are you sure you want to delete the alias ' + alias + '?',
      initial: false
    });

    // Continue if user confirms
    if (promptRes.value) {
      progress.spinner().start('Deleting alias');
      let headers = {
        'X-Api-Key': config.userpref.get('apiKey')
      }
      let init = {
        headers: headers,
        method: 'DELETE'
      }
      let response = await validation.safelyFetch(config.api.baseurl + 'aliases/' + alias, init)
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
                  chalk.green(emoji.get('white_check_mark') + ' Alias deleted successfully!')
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
                    chalk.red('An unknown error occurred during alias deletion')
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
  let response = await validation.safelyFetch(config.api.baseurl + 'aliases', init)
  let responseJson = await validation.safelyParseJson(response)

  switch(response.status) {
    case 200:
      cb(true, responseJson.aliases);
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}
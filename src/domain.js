const config = require('./config');
const domainLib = require('./domain');
const errors = require('./errors');
const projectSettings = require('./projectsettings');
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
  let domainsResponse = await module.exports.list();

  if (domainsResponse.status) {
    progress.spinner().stop();
    console.log('List of domains:');
    const table = new Table({
        head: ['Domain', 'Plan'],
        colWidths: [50, 30]
    });
    domainsResponse.domains.forEach(function (item) {
      table.push(
        [item.domain_name, item.plan_name]
      );
    });
    console.log(table.toString());
  }
}
module.exports.createCommand = async function () {
  validation.requireApiKey();

  const promptRes = await prompts({
    type: 'text',
    name: 'domain',
    message: `Please enter the domain that you'd like to create, including the extension (e.g. example.bip.sh)`
  });

  if (promptRes.domain) {
    let domain = promptRes.domain

    progress.spinner().start('Checking availability');

    await domainavailability.get(domain, async function(response) {
      progress.spinner().stop();

      console.log(
        'This domain is available'
      );

      if (response.plans.length == 0) {
        console.log(
          'No plans found'
        );
        process.exit(1);
      }

      let returnPlans = [];
      response.plans.forEach(function(plan) {
        returnPlans.push({
          title: plan.plan_name,
          description: plan.description,
          value: plan.plan_id
        })
      });

      const promptRes = await prompts({
        type: 'select',
        name: 'planID',
        message: 'Please select a plan for this new domain',
        choices: returnPlans,
        initial: 0
      });

      // Continue if user confirms
      if (promptRes.planID) {
        const confirmRes = await prompts({
          type: 'confirm',
          name: 'value',
          message: 'Are you sure you want to create the domain ' + domain + ' with the selected plan?',
          initial: false
        });
  
        // Continue if user confirms
        if (confirmRes.value) {
          progress.spinner().start('Creating domain');
          let headers = {
            'X-Api-Key': config.userpref.get('apiKey'),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
          let init = {
            headers: headers,
            method: 'POST',
            body: 'domain=' + domain + '&planID=' + promptRes.planID
          }
          let response = await validation.safelyFetch(config.api.baseurl + 'domains', init)
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
      }
    });
  }
}
module.exports.deleteCommand = async function (domain) {
  domain = domain || null;

  validation.requireApiKey();

  if (domain == null) {
    domain = await module.exports.listChoose({ 
      message: `Select the domain that you'd like to delete` 
    });
  }

  if (domain != null) {
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
}
module.exports.useCommand = async function (domain) {
  return module.exports.use(domain, "site", false);
}
module.exports.use = async function (domain, type, silent) {
  domain = domain || null;
  type = type || "site";
  silent = silent || false;

  validation.requireApiKey();

  if (domain == null) {
    let string = `Select the domain that you'd like to deploy this project to`
    if (type == "function") {
      string = `Select the domain that you'd like to deploy this function to`
    }
    
    domain = await module.exports.listChoose({ message: string });
  }

  if (domain != null) {
    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'domains/' + domain, init)
    let responseJson = await validation.safelyParseJson(response)

    switch(response.status) {
      case 200:
        projectSettings.set('domain', domain);
        if (!silent) {
          console.log(
            chalk.green(emoji.get('white_check_mark') + ' Domain set')
          );
        }
        return domain;
        break;
      case 404:
        console.log(
          chalk.red(emoji.emojify('The domain was not found on your account. Please ensure that you use the full domain, such as example.bip.sh'))
        );
        await module.exports.use(null, type, silent);
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
}
module.exports.listChoose = async function(opts) {
  message = opts.message || "";

  return new Promise(async function (resolve, reject) {
    progress.spinner().start('Requesting data');

    let domainsResponse = await module.exports.list(true).catch(function(err) {
      if (err.code == 404) {
        console.log(
          chalk.red('You need to create a domain first')
        );
      } else {
        console.log(
          chalk.red('An unknown error occurred')
        );
      }
    })

    if (domainsResponse && domainsResponse.status) {
      progress.spinner().stop();

      let choices = []
      domainsResponse.domains.forEach(function (item) {
        choices.push({ title: item.domain_name });
      });

      const promptRes = await prompts({
        type: 'autocomplete',
        name: 'domain',
        message: message,
        choices: choices
      });

      if (promptRes.domain) {
        resolve(promptRes.domain);
      } else {
        resolve(null);
      }
    }
  });
}
module.exports.list = async function (throwErrors) {
  throwErrors = throwErrors || false;

  validation.requireApiKey();

  return new Promise(async function (resolve, reject) {
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
        resolve({status: true, domains: responseJson.domains});
        break;
      default:
        if (throwErrors) {
          reject(errors.formattedServerError(response.status, responseJson))
        } else {
          errors.returnServerError(response.status, responseJson);
          resolve({status: false});
        }
    }
  });
}
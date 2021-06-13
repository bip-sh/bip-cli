#!/usr/bin/env node

const console = require("console");
const { program } = require('commander');
const chalk = require('chalk');
var figlet = require('figlet');
const packageJson = require('../package.json');

const account = require('./account');
const auth = require('./auth');
const domain = require('./domain');
const domainalias = require('./domainalias');
const deploy = require('./deploy');
const functions = require('./functions');
const projectsettings = require('./projectsettings');
const signup = require('./signup');
const remotestatus = require('./remotestatus');

// Check the program.args obj
let argLength = (process.argv[0].includes('node')) ? process.argv.length - 2 : process.argv.length;

// Handle it however you like
if (argLength === 0) {
  console.clear();

  console.log(
    chalk.red(
      figlet.textSync('bip', { horizontalLayout: 'full' })
    )
  );
  console.log('');
}

remotestatus.getStatus(packageJson.version, function() {
  program.version(packageJson.version);

  program
    .option('--domain <domain>', 'the domain to perform the action on');

    program
    .command('login')
    .description('login to Bip')
    .action(auth.loginCommand);

    program
    .command('logout')
    .description('logout of Bip')
    .action(auth.logoutCommand);

    program
    .command('whoami')
    .description('check the currently logged in user')
    .action(auth.whoamiCommand);

    program
    .command('signup')
    .description('signup to Bip')
    .action(signup.signupCommand);

    const accountCmd = program.command('account')
    .description('account management');

    accountCmd
    .command('balance')
    .description('check the balance of your account')
    .action(account.balanceCommand);

    accountCmd
    .command('billing')
    .description('open the billing portal')
    .action(account.billingCommand);

    accountCmd
    .command('setuppayment')
    .description('attach a payment card to your account')
    .action(account.setupPaymentCommand);

    accountCmd
    .command('changeplan [domain]')
    .description('change the plan for the selected domain')
    .action(account.changePlanCommand);

    program
    .command('init')
    .description('initialise the project directory')
    .action(projectsettings.initCommand);

    const domainCmd = program.command('domain')
    .description('domain management');

    domainCmd
    .command('create')
    .description('create a new domain')
    .action(domain.createCommand);

    domainCmd
    .command('list')
    .description('list domains')
    .action(domain.listCommand);

    domainCmd
    .command('delete [domain]')
    .description('delete a domain')
    .action(domain.deleteCommand);

    const aliasCmd = domainCmd.command('alias')
    .description('alias management');

    aliasCmd
    .command('create')
    .description('create a new domain alias')
    .action(domainalias.createCommand);

    aliasCmd
    .command('list')
    .description('list aliases')
    .action(domainalias.listCommand);

    aliasCmd
    .command('delete [alias]')
    .description('delete a domain alias')
    .action(domainalias.deleteCommand);

    const functionCmd = program.command('fn')
    .description('function management');

    functionCmd
    .command('create')
    .description('create a new function')
    .action(functions.createCommand);

    functionCmd
    .command('list <domain>')
    .description('list functions')
    .action(functions.listCommand);

    functionCmd
    .command('init')
    .description('initialise the function')
    .action(projectsettings.initFunctionCommand);

    functionCmd
    .command('deploy')
    .description('deploy the current working directory to your Bip Function')
    .action(functions.deployCommand);

    functionCmd
    .command('delete')
    .description('delete a function')
    .action(functions.deleteCommand);

    program
    .command('use [domain]')
    .description("set the deployment domain for the project")
    .action(domain.useCommand);

    program
    .command('deploy')
    .description('deploy the current working directory to your Bip domain')
    .action(deploy.deployCommand);

  program.parse(process.argv);
});
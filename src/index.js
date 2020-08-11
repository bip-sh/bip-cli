#!/usr/bin/env node

const console = require("console");
const { program } = require('commander');
const chalk = require('chalk');
var figlet = require('figlet');
const packageJson = require('../package.json');

const account = require('./account');
const auth = require('./auth');
const domain = require('./domain');
const deploy = require('./deploy');
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
    .command('delete <domain>')
    .description('delete a domain')
    .action(domain.deleteCommand);

    program
    .command('use <domain>')
    .description('set the domain to perform actions on')
    .action(domain.useCommand);

    program
    .command('deploy')
    .description('deploy the current working directory to the bip.sh domain')
    .action(deploy.deployCommand);

  program.parse(process.argv);
});
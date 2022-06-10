const fs = require('fs');
const chalk = require('chalk');
const emoji = require('node-emoji');
const prompts = require('prompts');
const detectenv = require('./detectenv');
const domain = require('./domain');
const functions = require('./functions');

module.exports.get = function () {
  try {
    let rawdata = fs.readFileSync('bip.json');
    try {
      let projectSettings = JSON.parse(rawdata);
      return projectSettings;
    } catch (err) {
      return false;
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
}
module.exports.set = function (key, value) {
  // Get existing settings if present
  let thisProjectSettings = module.exports.get();
  if (!thisProjectSettings) {
    // No settings saved
    thisProjectSettings = {};
  }
  // Modify settings property
  thisProjectSettings[key] = value;

  // Save settings
  let data = JSON.stringify(thisProjectSettings, null, 4);
  fs.writeFileSync('bip.json', data);
}
module.exports.initCommand = async function () {
  return module.exports.init(true);
}
module.exports.init = async function (showDeployHint) {
  let thisProjectSettings = module.exports.get();
  if (thisProjectSettings) {
    const confirmRes = await prompts({
      type: 'confirm',
      name: 'value',
      message: "This project has already been initialised. Would you like to re-initialise it? (this will delete your project's settings)",
      initial: false
    });

    // Continue only if user confirms
    if (!confirmRes.value) {
      process.exit(1);
    }
  }

  if (thisProjectSettings) {
    // Delete project settings
    fs.unlinkSync('bip.json');
  }
  
  // No settings saved, begin init
  let framework = await detectenv.detectFramework();
  if (!framework) {
    await detectenv.detectDeployPath();
  }
  let result = await domain.use(null, true);

  if (result) {
    let message = ":white_check_mark: Project initialised!";
    if (showDeployHint) {
      message += " When you're ready to deploy, just run 'bip deploy'";
    }
    console.log(
      chalk.green(emoji.emojify(message))
    );
    return true;
  } else {
    return false;
  }
}
module.exports.initFunctionCommand = async function () {
  return module.exports.initFunction(true);
}
module.exports.initFunction = async function (showDeployHint) {
  let thisProjectSettings = module.exports.get();
  if (thisProjectSettings) {
    const confirmRes = await prompts({
      type: 'confirm',
      name: 'value',
      message: "This function has already been initialised. Would you like to re-initialise it?",
      initial: false
    });

    // Continue only if user confirms
    if (!confirmRes.value) {
      process.exit(1);
    }
  }

  if (thisProjectSettings) {
    // Delete function settings
    fs.unlinkSync('bip.json');
  }
  
  let ourDomain = await domain.use(null, "function", true);
  if (ourDomain) {
    let ourFunction = await functions.use(ourDomain, null, true)
    if (ourFunction) {
      let message = ":white_check_mark: Function initialised!";
      if (showDeployHint) {
        message += " When you're ready to deploy, just run 'bip fn deploy'";
      }
      console.log(
        chalk.green(emoji.emojify(message))
      );
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
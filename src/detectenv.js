const chalk = require('chalk');
const emoji = require('node-emoji');
const fs = require('fs');
const prompts = require('prompts')
const config = require('./config');
const domain = require('./domain');
const progress = require('./progress');
const projectSettings = require('./projectsettings');

module.exports.frameworks = {
  'jekyll': {
    name: 'jekyll',
    title: 'Jekyll',
    paths: [
      '_site',
      '.jekyll-cache'
    ],
    deployDir: '_site'
  },
  'hexo': {
    name: 'hexo',
    title: 'Hexo',
    paths: [
      'node_modules/hexo',
      'public'
    ],
    deployDir: 'public'
  }
}

module.exports.deployPaths = [
  'public',
  '_site'
]

module.exports.detectFramework = async function () {
  return new Promise(function (resolve, reject) {
    Object.entries(module.exports.frameworks).forEach(([key, framework]) => {
      let allPathsFound = true;
      framework.paths.forEach(async function(path) {
        if (!fs.existsSync(path)) {
          allPathsFound = false
          return
        }
      })
      if (allPathsFound) {
        // Framework found
        console.log(
          chalk.green(emoji.emojify(":white_check_mark: It looks like your project is using " + framework.title + "!"))
        );
        projectSettings.set('framework', framework.name);
        resolve(framework)
      }
    })
    // Framework not found
    resolve()
  })
}

module.exports.detectDeployPath = async function () {
  return new Promise(function (resolve, reject) {
    module.exports.deployPaths.forEach(async function(path) {
      if (fs.existsSync(path)) {
        const confirmRes = await prompts({
          type: 'confirm',
          name: 'value',
          message: "We found an output directory at /" + path + ". Would you like to upload this folder when you deploy?",
          initial: true
        });

        // Continue if user confirms
        if (confirmRes.value) {
          projectSettings.set('deployPath', path);
          resolve(path)
        } else {
          console.log(
           emoji.emojify("OK, we'll make any deployments from the current directory")
          );
        }
        resolve()
      }
    })
  })
}
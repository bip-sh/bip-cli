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
      '.jekyll-cache'
    ],
    deployDir: '_site'
  },
  'hexo': {
    name: 'hexo',
    title: 'Hexo',
    paths: [
      'node_modules/hexo',
    ],
    deployDir: 'public'
  }
}

module.exports.deployPaths = [
  'public',
  '_site'
]

module.exports.detectFramework = async function () {
  return new Promise(async function (resolve, reject) {
    for (let key in module.exports.frameworks) {
      if (module.exports.frameworks.hasOwnProperty(key)) {
         let framework = module.exports.frameworks[key];
            
          let allPathsFound = true;
          framework.paths.forEach(function (path) {
            if (!fs.existsSync(path)) {
              allPathsFound = false;
              return;
            }
          });
          if (allPathsFound) {
            // Framework found
            console.log(
              chalk.green(emoji.emojify(":white_check_mark: It looks like your project is using " + framework.title + "!"))
            );
            projectSettings.set('framework', framework.name);

            const confirmRes = await prompts({
              type: 'confirm',
              name: 'value',
              message: `Would you like to push up the standard output directory of /${framework.deployDir} when you deploy?`,
              initial: true
            });

            // Continue if user confirms
            if (confirmRes.value) {
              projectSettings.set('deployPath', framework.deployDir);
            }
            resolve(framework);
          }
        }
      }
    // Framework not found
    resolve(false)
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
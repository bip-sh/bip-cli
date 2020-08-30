const chalk = require('chalk');
const emoji = require('node-emoji');
const fs = require('fs');
const prompts = require('prompts')
const config = require('./config');
const domain = require('./domain');
const progress = require('./progress');
const projectSettings = require('./projectsettings');

module.exports.frameworks = {
  'gatsby': {
    name: 'gatsby',
    title: 'Gatsby',
    paths: [
      'node_modules/gatsby',
      'gatsby-config.js'
    ],
    deployDir: 'public'
  },
  'hexo': {
    name: 'hexo',
    title: 'Hexo',
    paths: [
      'node_modules/hexo',
    ],
    deployDir: 'public'
  },
  'hugo': {
    name: 'hugo',
    title: 'Hugo',
    paths: [
      'archetypes',
      'content',
      'layouts',
      'config.toml'
    ],
    deployDir: 'public'
  },
  'jekyll': {
    name: 'jekyll',
    title: 'Jekyll',
    paths: [
      '.jekyll-cache'
    ],
    deployDir: '_site'
  },
  'middleman': {
    name: 'middleman',
    title: 'Middleman',
    strings: {
      'Gemfile': "gem 'middleman'"
    },
    deployDir: 'build'
  },
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
         let allStringsFound = true;
            
          if (framework.hasOwnProperty('paths')) {
            framework.paths.forEach(function (path) {
              if (!fs.existsSync(path)) {
                allPathsFound = false;
                return;
              }
            });
          }
          if (framework.hasOwnProperty('strings')) {
            // Find strings
            for (let key in framework.strings) {
              if (framework.strings.hasOwnProperty(key)) {
                let path = key;
                let string = framework.strings[key];
                
                if (!fs.existsSync(path)) {
                  allStringsFound = false;
                } else {
                  let filedata = fs.readFileSync(path);
                  
                  if(filedata.indexOf(string) == -1){
                    allStringsFound = false;
                  }
                }
              }
            }
          }


          if (allStringsFound && allPathsFound) {
            // Framework found
            await frameworkFound(framework);
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
    resolve(false)
  })
}

frameworkFound = async function (framework) {
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
}
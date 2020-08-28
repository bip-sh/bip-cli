const fs = require("fs");
const os = require("os");
const { program } = require('commander');
const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const projectSettings = require('./projectsettings');
const validation = require('./validation');
const tasks = require('./tasks');
const emoji = require('node-emoji');
const chalk = require('chalk');
const file_system = require('fs');
const archiver = require('archiver');

module.exports = {
  deployCommand: async function () {
    validation.requireApiKey();
    if (await validation.requireProject()) {
      if (await validation.requireDomain(program.domain)) {
        let thisProjectSettings = projectSettings.get();

        let domain = program.domain || thisProjectSettings.domain;

        let deployDir = thisProjectSettings.deployPath ? '/' + thisProjectSettings.deployPath : ''

        progress.spinner().start('Archiving');

        let deploymentFilename = 'deployment-' + Date.now() + '.zip';

        // Create archive
        let output = file_system.createWriteStream(os.tmpdir() + '/' + deploymentFilename);
        let archive = archiver('zip');

        output.on('close', function () {
            //console.log(archive.pointer() + ' total bytes');
            // Archive finalised
            uploadDeployment(domain, os.tmpdir() + '/' + deploymentFilename, function(taskID) {
              // Deployment has been uploaded
              progress.spinner().text = 'Uploaded';

              // Cleanup local archive
              fs.unlinkSync(os.tmpdir() + '/' + deploymentFilename);

              // Track status of remote task
              tasks.getStatus(taskID, function(status, statusText) {
                statusText = statusText || "";

                progress.spinner().stop();
            
                if (status == 3) {
                  if (statusText != "") {
                    console.log(
                      chalk.green(emoji.get('tada') + ' ' + statusText)
                    );
                  } else {
                    console.log(
                      chalk.green(emoji.get('tada') + ' Deployed!')
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
                        chalk.red('An unknown error occurred during deployment')
                      );
                    }
                  }
                }
              });
            });
        });

        archive.on('error', function(err){
            throw err;
        });

        archive.pipe(output);

        // append files from a sub-directory and naming it `new-subdir` within the archive (see docs for more options):
        archive.directory(process.cwd() + deployDir, false);
        archive.finalize();
      }
    }
  }
}

async function uploadDeployment(domain, filepath, cb) {
  cb = cb || function(){};

  // Read the file
  try {
    var data = fs.readFileSync(filepath);
  } catch (err) {
    errors.returnError('An error occurred when reading the deployment for upload. ' + err.message);
  }

  progress.spinner().text = 'Uploading';
  let headers = {
    'X-Api-Key': config.userpref.get('apiKey')
  }
  let init = {
    headers: headers,
    method: 'PUT',
    body: data
  }
  let response = await validation.safelyFetch(config.api.baseurl + 'deploy/' + domain, init)
  let responseJson = await validation.safelyParseJson(response)

  progress.spinner().stop();

  switch(response.status) {
    case 200:
      cb(responseJson.taskID);
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}
const fs = require("fs");
const path = require("path");
const util = require("util");
const crypto = require('crypto');
const { program } = require('commander');
const config = require('./config');
const progress = require('./progress');
const fileLib = require('./file');
const listLib = require('./list');
const projectSettings = require('./projectsettings');
const validation = require('./validation');
const chalk = require('chalk');

const self = this;

let localFiles = [];

module.exports = {
  syncCommand: async function () {
    validation.requireApiKey();
    validation.requireDomain(program.domain);

    let thisProjectSettings = projectSettings.get();

    let domain = program.domain || thisProjectSettings.domain;

    let remoteSyncLocation = '/';
    if (typeof thisProjectSettings.location !== 'undefined') {
      remoteSyncLocation = thisProjectSettings.location + '/';
    }

    progress.spinner().start('Syncing');

    listLib.list({
      path: remoteSyncLocation, 
      listFilesInSubDirectories: true, 
      suppressErrors: true, 
      cb: async function(status, remoteFiles) {
        if (status) {
          // Files found on remote

          // Read and upload the files in local dir
          await readFilesInDir({
            remoteFiles: remoteFiles,
            localDirectory: process.cwd(),
            remoteSyncLocation: remoteSyncLocation
          });

          // Find files to delete on remote
          progress.spinner().text = 'Cleaning up old files';
          await deleteNonMatchingFiles({
            localFiles: localFiles,
            remoteFiles: remoteFiles,
            remoteSyncLocation: remoteSyncLocation
          });

          progress.spinner().stop();
      
          console.log(
            chalk.green('Files synced')
          );
        } else {
          // No existing files found on remote

          // Read and upload the files in local dir
          await readFilesInDir({
            remoteFiles: null,
            localDirectory: process.cwd(),
            remoteSyncLocation: remoteSyncLocation
          });

          progress.spinner().stop();
      
          console.log(
            chalk.green('Files synced')
          );
        }
      }
    });
  }
};

async function readFilesInDir(args) {

  // Read the local files
  let files = fs.readdirSync(args.localDirectory);

  for (const file of files) {
    let filename = path.join(args.localDirectory, file);

    // Add to local files array for use during file cleanup/delete later
    localFiles.push(filename.replace(process.cwd() + '/', ''));

    // Don't upload hidden or project settings files
    if (!file.startsWith('.') && file !== "bip.json") {
      if (fs.lstatSync(filename).isDirectory()) {
        // Read this dir to upload
        await readFilesInDir({
          remoteFiles: args.remoteFiles,
          localDirectory: filename,
          remoteSyncLocation: args.remoteSyncLocation
        });
      } else {
        var contents = fs.readFileSync(args.localDirectory + '/' + file, 'utf8');

        // Get checksum of read file
        let shasum = crypto.createHash('sha1');
        shasum.update(contents);
        let localFileHash = shasum.digest('hex');
        
        // Check if this filename has already been uploaded
        let needsUploading = true;
        if (args.remoteFiles !== null) {
          for (const remoteFile of args.remoteFiles) {
            if (remoteFile.filename === filename.replace(process.cwd() + '/', '')) {
              // Same filename
              // Check if checksum is the same
              if (remoteFile.hash === localFileHash) {
                // Checksum is the same, file doesn't need uploading
                needsUploading = false;
              }
            }
          }
        }
        if (needsUploading) {
          // Upload file
          let origin = filename;
          let destination = args.remoteSyncLocation + filename.replace(process.cwd() + '/', '');
          let response = await fileLib.upload(origin, destination);
        } else {
          // File doesn't need uploading
          progress.spinner().text = "File already up to date, skipping";
        }
      }
    }
  }
}
var readFilesInDirRepeat = readFilesInDir.bind(this);

/**
 * Delete files on the remote which aren't also saved locally
 */
async function deleteNonMatchingFiles(args) {
  args.remoteSyncLocation = args.remoteSyncLocation || '';

  for (const remoteFile of args.remoteFiles) {
    let markedForDeletion = true;
    for (const localFile of args.localFiles) {
      if (localFile === remoteFile.filename) {
        // File is a local file, do not delete
        markedForDeletion = false;
      }
    }
    if (markedForDeletion) {
      let filename = args.remoteSyncLocation + remoteFile.filename;
      await fileLib.delete(filename);
    }
  }
}
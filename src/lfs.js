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
const emoji = require('node-emoji');
const chalk = require('chalk');

const self = this;

let localFiles = [];

module.exports = {
  sync: async function () {
    return new Promise(async function (resolve, reject) {
      validation.requireApiKey();
      if (await validation.requireProject()) {
        if (await validation.requireDomain(program.domain)) {
          let thisProjectSettings = projectSettings.get();

          let domain = program.domain || thisProjectSettings.domain;

          let remoteSyncLocation = path.sep;

          // Only sync if LFS directory exists
          if (fs.existsSync(process.cwd() + path.sep + '_lfs')) {
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
                    localDirectory: process.cwd() + path.sep + '_lfs',
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
                    emoji.get('heavy_check_mark') + '  LFS files synced'
                  );
                } else {
                  // No existing files found on remote

                  // Read and upload the files in local dir
                  await readFilesInDir({
                    remoteFiles: null,
                    localDirectory: process.cwd() + path.sep + '_lfs',
                    remoteSyncLocation: remoteSyncLocation
                  });

                  progress.spinner().stop();
              
                  console.log(
                    emoji.get('heavy_check_mark') + '  LFS files synced'
                  );
                }
                resolve();
              }
            });
          } else {
            resolve();
          }
        }
      }
    });
  }
};

async function readFilesInDir(args) {

  // Read the local files
  let files = fs.readdirSync(args.localDirectory);

  let uploadError = false;

  for (const file of files) {
    let filename = path.join(args.localDirectory, file);

    let localFilename = filename.replace(process.cwd() + path.sep + '_lfs' + path.sep, '');

    // Add to local files array for use during file cleanup/delete later
    localFiles.push(localFilename);

    // Don't upload hidden files
    if (!file.startsWith('.')) {
      if (fs.lstatSync(filename).isDirectory()) {
        // Read this dir to upload
        await readFilesInDir({
          remoteFiles: args.remoteFiles,
          localDirectory: filename,
          remoteSyncLocation: args.remoteSyncLocation
        });
      } else {
        var contents = fs.readFileSync(args.localDirectory + path.sep + file);

        // Get checksum of read file
        let shasum = crypto.createHash('sha1');
        shasum.update(contents);
        let localFileHash = shasum.digest('hex');
        
        // Check if this filename has already been uploaded
        let needsUploading = true;
        if (args.remoteFiles !== null) {
          for (const remoteFile of args.remoteFiles) {
            if (remoteFile.filename === localFilename.replace(/\\/g, '/')) {
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
          // Only continue if there were no errors uploading files previously
          // i.e. no storage space left
          if (!uploadError) {
            // Upload file
            let origin = filename;
            let destination = args.remoteSyncLocation + localFilename;
            let response = await fileLib.upload(origin, destination);
            if (!response) {
              uploadError = true;
            }
          }
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
    for (let localFile of args.localFiles) {
      if (localFile.replace(/\\/g, '/') === remoteFile.filename) {
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

function urlencode(str) {
  str = (str + '').toString();

  // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
  return encodeURIComponent(str).replace('!', '%21')
      .replace(/\\/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+');
}
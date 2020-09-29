const packageJson = require('../package.json');
const Configstore = require('configstore');

var config = {};
config.userpref = {};
config.api = {};

config.userpref = new Configstore(packageJson.name);

config.api.baseurl = 'https://domain-api.bip.sh/v1/';
config.api.uploadbaseurl = 'https://domain-api-upload.bip.sh/v1/';

module.exports = config;
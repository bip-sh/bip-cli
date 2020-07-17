const config = require('./config');
const errors = require('./errors');
const validation = require('./validation');

module.exports = {
  get: async function (domainName, cb) {
    cb = cb || function(){};

    validation.requireApiKey();

    let headers = {
      'X-Api-Key': config.userpref.get('apiKey')
    }
    let init = {
      headers: headers,
      method: 'GET'
    }
    let response = await validation.safelyFetch(config.api.baseurl + 'domains/checkavailability/' + domainName, init)
    let responseJson = await validation.safelyParseJson(response)

    switch(response.status) {
      case 200:
        cb(responseJson);
        break;
      default:
        errors.returnServerError(response.status, responseJson);
    }
  }
};
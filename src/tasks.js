const config = require('./config');
const errors = require('./errors');
const progress = require('./progress');
const validation = require('./validation');

module.exports = {
  getStatus: async function (taskID, cb) {
    cb = cb || function(){};

    progress.spinner().start('');

    getStatus(taskID, cb);
  }
};

async function getStatus(taskID, cb) {
  let headers = {
    'X-Api-Key': config.userpref.get('apiKey')
  }
  let init = {
    headers: headers,
    method: 'GET'
  }
  let response = await validation.safelyFetch(config.api.baseurl + 'tasks/' + taskID, init)
  let responseJson = await validation.safelyParseJson(response)

  switch(response.status) {
    case 200:
      switch(responseJson.task.status) {
        case "3":
          // Done
          if (responseJson.task.status_text) {
            cb(responseJson.task.status, responseJson.task.status_text);
          } else {
            cb(responseJson.task.status);
          }
          break;
        case "4":
          // Error
          if (responseJson.task.status_text) {
            cb(responseJson.task.status, responseJson.task.status_text);
          } else {
            cb(responseJson.task.status);
          }
          break;
        default:
          if (responseJson.task.status_text) {
            progress.spinner().text = responseJson.task.status_text;
          }
          setTimeout(getStatus, 1000, taskID, cb);
      }
      break;
    default:
      errors.returnServerError(response.status, responseJson);
  }
}
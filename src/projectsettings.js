const fs = require('fs');

module.exports = {
  get: function () {
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
  },
  set: function (key, value) {
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
};
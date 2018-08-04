const customFilter = require('./customFilter.js');
const nunjucks = require('nunjucks');

module.exports = {
  setNunjucksConfig: function(app) {
    app.set('view engine', 'html');
    customFilter.addAllFilters(nunjucks.configure('views', {
      autoscape: true,
      express: app,
      watch: true
    }));
  }
};

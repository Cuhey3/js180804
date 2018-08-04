// initialize express
const express = require('express');
const app = express();
const server = require('http').createServer(app);

// set nunjucks to app and config nunjucks
require('./server/nunjucksUtil.js').setNunjucksConfig(app);

// set express routing
app.use(express.static(require('path').resolve(__dirname, 'client')));
app.get('/', function(req, res){
    res.render('content');
});

// run server
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  const addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

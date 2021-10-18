
// Importing express for the webserver and serve-static to make serving static files easier
var express = require('express')
var serveStatic = require('serve-static')

// create a express instance
var _app = express()

// Hold configuration for the port the webserver should be reached at
var _config = {
    webInterface: { port: 8080 }
}

_app.use(serveStatic('./src'))
_app.listen(_config.webInterface.port, () => {
    console.log("[webInterface] Server running on " + _config.webInterface.port + " ...")
})
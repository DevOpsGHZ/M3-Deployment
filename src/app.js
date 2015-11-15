var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

var sio = require('socket.io')
  , http = require('http')
  , request = require('request')
  , os = require('os')
  ;

var server = require('http').createServer(app);
server.listen(3000);

io = sio.listen(server);

function memoryLoad()
{
  // console.log( os.totalmem(), os.freemem() );
  return (os.totalmem() - os.freemem()) / os.totalmem();
}

// Create function to get CPU information
function cpuTicksAcrossCores() 
{
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
 
  //Loop through CPU cores
  for(var i = 0, len = cpus.length; i < len; i++) 
  {
    //Select CPU core
    var cpu = cpus[i];
    //Total up the time in the cores tick
    for(type in cpu.times) 
    {
      totalTick += cpu.times[type];
    }     
    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }
 
  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuTicksAcrossCores();

function cpuAverage()
{
  var endMeasure = cpuTicksAcrossCores(); 
 
  //Calculate the difference in idle and total time between the measures
  var idleDifference = endMeasure.idle - startMeasure.idle;
  var totalDifference = endMeasure.total - startMeasure.total;
 
  //Calculate the average percentage CPU usage
  return idleDifference / totalDifference;
}

function measureLatenancy(server)
{
  var options = 
  {
    url: 'http://localhost' + ":" + server.address().port,
  };

  var startTime = Date.now();
  request(options, function (error, res, body) 
  {
    server.latency = Date.now() - startTime;
  });

  return server.latency;
}

function calcuateColor()
{
  // latency scores of all nodes, mapped to colors.
  var nodes = nodeServers.map( measureLatenancy ).map( function(latency) 
  {
    var color = "#cccccc";
    if( !latency )
      return {color: color};
    if( latency > 8000 )
    {
      color = "#ff0000";
    }
    else if( latency > 4000 )
    {
      color = "#cc0000";
    }
    else if( latency > 2000 )
    {
      color = "#ffff00";
    }
    else if( latency > 1000 )
    {
      color = "#cccc00";
    }
    else if( latency > 100 )
    {
      color = "#0000cc";
    }
    else
    {
      color = "#00ff00";
    }
    //console.log( latency );
    return {color: color};
  });
  //console.log( nodes );
  return nodes;
}


/// CHILDREN nodes
var nodeServers = [];
nodeServers.push( server );

///////////////
//// Broadcast heartbeat over websockets
//////////////
setInterval( function () 
{
  io.sockets.emit('heartbeat', 
  { 
        name: "Your Computer", cpu: cpuAverage(), memoryLoad: memoryLoad(),  latency: measureLatenancy(server),
        nodes: calcuateColor()
   });

}, 2000);
var request = require('request');
var _ = require('lodash');

function PingService(options){
  if (options && options.dependencies && options.dependencies.request){
    request = options.dependencies.request;
  }
}

exports = module.exports = PingService;

PingService.prototype.ping = function(service, callback){
  var startTime = +new Date();

  var options = {
    uri: service.url,
    timeout: service.timeout,
    poll: false,
    headers: {
      'user-agent': 'watchmen/http-rabbit',
      'cache-control': 'no-cache',
      'pragma': 'no-cache'
    }
  };

  if( _.get( service, 'pingServiceOptions.http-rabbit.hostHeader.value' ) ) {
    _.set( options, 'headers.host', _.get( service, 'pingServiceOptions.http-rabbit.hostHeader.value' ) )
  }

  if (!service.pingServiceOptions || !service.pingServiceOptions['http-rabbit'] ||
      !service.pingServiceOptions['http-rabbit'].contains ||
      !service.pingServiceOptions['http-rabbit'].contains.value) {
   return callback('rabbit plugin configuration is missing');
  }

  var contains = service.pingServiceOptions['http-rabbit'].contains.value;

  var statusCode = null;

  if (service.pingServiceOptions['http-rabbit'].statusCode){
    statusCode = service.pingServiceOptions['http-rabbit'].statusCode.value;
  }

  request.get(options, function(error, response, body){

    var elapsedTime = +new Date() - startTime;

    if (error) {
      return callback(error, body, response, elapsedTime);
    }

    if (expectedStatusCode && response && response.statusCode != expectedStatusCode) {
      var errMsg = 'Invalid status code. Found: ' + response.statusCode + '. Expected: ' + expectedStatusCode;
      return callback(errMsg, body, response, +new Date() - startTime);
    }

    if (body.indexOf(contains) === -1) {
      return callback(contains + ' not found', body, response, elapsedTime);
    }

    else {

      callback(null, body, response, elapsedTime);
    }

  });
};

PingService.prototype.getDefaultOptions = function(){
  return {
    platform: {
      descr: 'platform name. e.g. wordpress',
      required: false
    },
    'statusCode': {
      descr: 'Expected status code (defaults to 200)',
      value: 200,
      required: false
    },
    'hostHeader': {
      descr: 'Optional host header',
      value: null,
      required: false
    },
  };
}
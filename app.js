var cfg = require('./config.js');
var https = require('https'),
    sql = require('sqlite3'),
    fs = require('fs'),
    Promise = require('promise');
var bot = require('./burpbot.js')

var db = new sql.Database(cfg.db.path);
db.serialize(function(){
  if(!fs.existsSync(cfg.db.path)) {
    db.run('CREATE TABLE Users (discordid, username, steamid, steamname)');
    db.run('CREATE TABLE UserConnections (type, name, id)')
  }
});

var webApp = require('express')();

var oauth = require('simple-oauth2').create(cfg.oauth.opts);

var authUri = oauth.authorizationCode.authorizeURL({
  redirect_uri: cfg.oauth.callbackUri,
  scope: cfg.oauth.scope
});

webApp.get('/test', (req, res) => {

})

webApp.get(cfg.oauth.callbackPath, function(req, res) {
  var cbcode = req.query.code;

  if(cbcode !== undefined && cbcode !== '') {
    var options = {
      code: cbcode,
      redirect_uri: cfg.oauth.callbackUri
    };
    console.log(options);
    oauth.authorizationCode.getToken(options, (error, result) => {
      if (error) {
        console.error('Access Token Error', error.message);
        return res.end('Authentication failed');
      }

      //console.log('The resulting token: ', result);
      const token = oauth.accessToken.create(result);
      var user = {};
      getDiscordIdentity(token).then((res) => {
        user = res;
        return getConnectionsSteam(token);
      }).then((res) => {
        if(!res){
          return false;
        } else {
          return isInGuild(res);
        }
        //get steam info
      }).then((res) => {
        if(res) {
          console.log('Registered new user: ' + user.id + ' with Member role.');
          bot.authorizeUser(user.id, 'Member');
        } else {
          console.log('Registered new user: ' + user.id + ' with Guest role.');
          bot.authorizeUser(user.id, 'Guest');
        }
      });
      res.end('Thank you for registering! You may now close this page.');
    });
  } else {
    res.status(400).send('Requires a valid callback code.');
  }
});

webApp.listen(cfg.port, () => {
  console.log('callback server listening');
});

bot.start();

function getDiscordIdentity(token) {
  return new Promise(function(fulfill, reject){
    try {
      var opts = {
        host: cfg.discordApiEndPoint.host,
        port: cfg.discordApiEndPoint.port,
        path: cfg.discordApiEndPoint.identity,
        headers: {
          'Authorization': `${token.token.token_type} ${token.token.access_token}`
        }
      };
      https.get(opts, function(res) {
        var data = '';
        res.on('data', (chunk) => {data += chunk});
        res.on('end', function(){
          //console.log(data);
          fulfill(JSON.parse(data));
        });
      });
    } catch(err) {
      reject(err);
    }
  });
}

function getConnectionsSteam(token) {
  return new Promise(function(fulfill, reject){
    try {
      var opts = {
        host: cfg.discordApiEndPoint.host,
        port: cfg.discordApiEndPoint.port,
        path: cfg.discordApiEndPoint.connections,
        headers: {
          'Authorization': `${token.token.token_type} ${token.token.access_token}`
        }
      };
      https.get(opts, function(res) {
        var data = '';
        res.on('data', (chunk) => {data += chunk});
        res.on('end', function(){
          var connections = JSON.parse(data);
          var steam = connections.find((cn) => {
            return cn.type == 'steam';
          });
          fulfill(steam);
        });
      });
    } catch(err) {
      reject(err);
    }
  });
}

function isInGuild(steam) {
  return new Promise(function(fulfill, reject){
    try{
      var opts = {
        host: cfg.steam.host,
        port: cfg.steam.port,
        path: `${cfg.steam.userGroupsPath}?key=${cfg.steam.apiKey}&format=json&steamid=${steam.id}`
      };
      //console.log(opts);
      https.get(opts, function(res) {
        var data = '';
        res.on('data', (chunk) => {data += chunk});
        res.on('end', function(){
          fulfill(!!JSON.parse(data).response.groups.find((group) => {
            return group.gid == cfg.steam.groupId32;
          }));
        });
        res.on('error', function(err){
          console.log(err);
        })
      });
    } catch(err) {
      reject(err);
    }
  })
}
/*
*/

var bot = module.exports = {};
var cfg = require('./config.js');
var discord = require('discord.js');
var sqlite3 = require('sqlite3');

var db = new sqlite3.Database(cfg.db.path);
var discordBot = new discord.Client();

bot.start = function() {
  discordBot.on("message", msg => {
    if(msg.author.bot) return;
    if(!msg.content.startsWith(cfg.bot.prefix)) return;

    var cmdArray = msg.content.slice(1).split(' ');

    if(cmds[cmdArray[0]]) {
      cmds[cmdArray[0]](cmdArray.slice(1), msg);
    }
  });

  discordBot.on('ready', () => {
    console.log('I am ready!');
  }).on('error', (e) => {
    console.error(e);
  });

  discordBot.on("error", e => { console.error(e); });
  discordBot.login(cfg.bot.token);
};

bot.authorizeUser = (userId, role) => {
  var guild = discordBot.guilds.first();
  var r = fetchRoleByName(guild, role);
  guild.fetchMember(userId).then((member) => {
    setRole(member, r);
  });
};

/* commands that can be called via discord chat */
var cmds = {};

cmds.echo = (args, msg) => {
  if(typeof args === 'string') {
    msg.channel.sendMessage(args);
    return;
  }
  if(Array.isArray(args) && args.length > 0) {
    msg.channel.sendMessage(args.join(' '));
  }
  return;
};

cmds.register = (args, msg) => {
  if(Array.isArray(args)) {
    if(args.length > 0) {
      //register stuff
    } else {
      //register myself
      //var cburi = encodeURIComponent('http://98.245.84.118:8080/callback');
      msg.author.sendMessage(`Whats up! To register you first need to authorize me to your discord account.
To do this, all you need to do is click the following link, and accept the authorization request.
${cfg.oauth.opts.auth.tokenHost}${cfg.oauth.opts.auth.authorizePath}?response_type=code&client_id=${cfg.oauth.opts.client.id}&scope=identify%20connections
After this, I will automatically assign you your roles and you can get to playing games with Burp Clan!`);
    }
  }
};

cmds.grantrole = (args, msg) => {
  var role = fetchRoleByName(msg.channel.guild, args[0]);
  var member = fetchMemberByName(msg.channel.guild, args[1]);
  console.log(role, member);
  setRole(member, role);
};

/* private functions */

function setRole(member, role) {
  member.addRole(role);
}

function fetchRoleByName(guild, role) {
  return guild.roles.find('name', role);
}

function fetchMemberByName(guild, name) {
  return guild.members.find((gMember) => {
    return gMember.user.username == name || gMember.nickname == name;
  })
}

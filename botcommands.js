var commands = module.exports = {};
var cfg = require('./config.js');

commands.echo = (args, msg) => {
  if(typeof args === 'string') {
    msg.channel.sendMessage(args);
    return;
  }
  if(Array.isArray(args) && args.length > 0) {
    msg.channel.sendMessage(args.join(' '));
  }
  return;
};

commands.register = (args, msg) => {
  if(Array.isArray(args)) {
    if(args.length > 0) {
      //register stuff
    } else {
      //register myself
      var cburi = encodeURIComponent('http://98.245.84.118:8080/callback');
      msg.author.sendMessage(`Whats up! To register you first need to authorize me to your discord account.
To do this, all you need to do is click the following link, and accept the authorization request.
${cfg.oauth.opts.auth.tokenHost}${cfg.oauth.opts.auth.authorizePath}?response_type=code&client_id=${cfg.oauth.opts.client.id}&scope=identify%20connections&${cburi}
After this, I will automatically assign you your roles and you can get to playing games with Burp Clan!`);
    }
  }
};

commands.grantrole = (args, msg) => {
  var role = fetchRoleByName(msg.channel.guild, args[0]);
  var member = msg.channel.guild.fetchMember(args[1]);
  console.log(role, member);
  member.addRole(role);
};

commands.profile = (args, msg) => {
  console.log(msg.author.fetchProfile())
}

function setRole(member, role) {
  var guildMember = guild.fetchMember(member);
  guildMember.addRole(role);
}

function fetchRoleByName(guild, role) {
  console.log(guild.roles.find('name', role));
  return guild.roles.find('name', role);
}

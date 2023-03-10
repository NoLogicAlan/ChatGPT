// TODO: rename to index.js
const { CommandHandler } = require("./Commands.js");
const { Client } = require("revolt.js");
const path = require("path");
const fs = require("fs");
const { SettingsManager } = require("./settings/Settings.js");
require('console-stamp')(console, '[HH:MM:ss.l]');
const Uploader = require("revolt-uploader");

let config;
if (fs.existsSync("./config.json")) {
  config = require("./config.json");
} else {
  config = {
    token: process.env.TOKEN
  };
}

class Chatgpt {
  constructor() {
    this.client = new Client();
    this.client.config = config;
    this.config = config;
    this.presenceInterval = config.presenceInterval || 7000;
    this.uploader = new Uploader(this.client);

    this.observedUsers = new Map();

    this.settingsMgr = new SettingsManager();
    this.settingsMgr.loadDefaultsSync("./storage/defaults.json");

    this.client.on("ready", () => {
      console.log("Logged in as " + this.client.user.username);
    });
    this.client.once("ready", () => {
      let state = 0;
      let texts = config.presenceContents || ["Ping for prefix", "By RedTech | NoLogicAlan", "Servers: $serverCount"]
      setInterval(() => {
          this.client.users.edit({
          status: {
            text: texts[state].replace(/\$serverCount/g, this.client.servers.size),
            presence: "Online"
          },
        });
        if (state == texts.length - 1) {state = 0} else {state++}
      }, this.presenceInterval);
    });
    this.client.on("message", (m) => {
      if (!this.observedUsers.has(m.author_id + ";" + m.channel_id)) return;
      this.observedUsers.get(m.author_id + ";" + m.channel_id)(m);
    });

    this.handler = new CommandHandler(this.client, config.prefix);
    this.handler.setReplyHandler((t, msg) => {
      msg.reply(this.em(t, msg), false);
    });
    this.handler.addOwners(...this.config.owners);
    this.handler.setRequestCallback((...data) => this.request(...data));
    this.handler.setOnPing(msg => {
      let pref = this.handler.getPrefix(msg.channel.server_id);
      let m = this.iconem(msg.channel.server.name, "My prefix in this server is: `" + pref + "`", (msg.channel.server.icon) ? "https://autumn.revolt.chat/icons/" + msg.channel.server.icon._id : null, msg);
      msg.reply(m, false)
    });
    const dir = path.join(__dirname, "commands");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
    this.runnables = new Map();

    // load command files
    files.forEach(commandFile => {
      const file = path.join(dir, commandFile);
      const cData = require(file);
      const builder = (typeof cData.command == "function") ? cData.command.call(this) : cData.command;
      if (cData.export) this[cData.export.name] = cData.export.object;
      this.handler.addCommand(builder);
      if (cData.run) {
        this.runnables.set(builder.uid, cData.run);
        builder.subcommands.forEach(sub => {
          this.runnables.set(sub.uid, cData.run);
        });
      }
    });
    this.handler.on("run", (data) => {
      if (this.runnables.has(data.command.uid)) {
        this.runnables.get(data.command.uid).call(this, data.message, data);
      }
    });

    if (process.argv[2] == "usage") {
      fs.writeFile("cmdUsage.md", this.handler.generateCommandOverviewMD(),()=>{ console.log("Done!"); process.exit(1) });
    } else if (process.argv[2] == "sreload") {
      this.settingsMgr.syncDefaults(); // updates all guilds if they are missing defaults
      this.settingsMgr.save();
    }

    try {
      this.comHash = require('child_process')
          .execSync('git rev-parse --short HEAD', {cwd: __dirname})
          .toString().trim();
      this.comHashLong = require('child_process')
          .execSync('git rev-parse HEAD', {cwd: __dirname})
          .toString().trim();
    } catch(e) {
      console.log("Git comhash error");
      this.comHash = "Newest";
      this.comHashLong = null;
    }

    this.comLink = (this.comHashLong) ? "https://github.com/NoLogicAlan/Chatgpt/tree/" + this.comHashLong : "https://github.com/NoLogicAlan/Chatgpt";
    this.playerMap = new Map();
    this.currPort = -1;
    this.channels = [];
    this.freed = [];

    this.client.loginBot(config.token);

    return this;
  }
  request(d) {
    switch(d.type) {
      case "prefix":
        return this.settingsMgr.getServer(d.data.channel.server_id).get("prefix");
    }
  }
  getSettings(message) {
    const serverId = message.channel.server_id;
    return this.settingsMgr.getServer(serverId);
  }
  observeUser(id, channel, cb) {
    this.observedUsers.set(id + ";" + channel, cb);
    return id + ";" + channel;
  }
  unobserveUser(i) {
    return this.observedUsers.delete(i);
  }
  embedify(text = "", color = "#e9196c") {
    return {
      type: "Text",
      description: "" + text, // convert bools and numbers to strings
      colour: color,
    }
  }
  em(text, msg) { // embedMessage
    return {
      content: " ",
      embeds: [this.embedify(text)]
    }
  }
  iconem(title, text, img, m) {
    let e = this.embedify(text);
    e.icon_url = img;
    e.title = title;
    return {
      content: " ",
      embeds: [e],
    }
  }
  isNumber(n) {
    return !isNaN(n) && !isNaN(parseFloat(n));
  }
  prettifyMS(milliseconds) {
    const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;

  	const parsed = {
  		days: roundTowardsZero(milliseconds / 86400000),
  		hours: roundTowardsZero(milliseconds / 3600000) % 24,
  		minutes: roundTowardsZero(milliseconds / 60000) % 60,
  		seconds: roundTowardsZero(milliseconds / 1000) % 60,
  		milliseconds: roundTowardsZero(milliseconds) % 1000,
  		microseconds: roundTowardsZero(milliseconds * 1000) % 1000,
  		nanoseconds: roundTowardsZero(milliseconds * 1e6) % 1000
  	};

    const units = {
      days: "d",
      hours: "h",
      minutes: "m",
      seconds: "s"
    }

    var result = "";
    for (let k in parsed) {
      if (!parsed[k] || !units[k]) continue;
      result += " " + parsed[k] + units[k];
    }
    return result.trim();
  }
}

new Chatgpt();

// God, please forgive us, this is just to keep the bot online at all cost
process.on("unhandledRejection", (reason, p) => {
  console.log(" [Error_Handling] :: Unhandled Rejection/Catch");
  console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
  console.log(" [Error_Handling] :: Uncaught Exception/Catch");
  console.log(err, origin);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log(" [Error_Handling] :: Uncaught Exception/Catch (MONITOR)");
  console.log(err, origin);
});
process.on("multipleResolves", (type, promise, reason) => {
  console.log(" [Error_Handling] :: Multiple Resolves");
  console.log(type, promise, reason);
});

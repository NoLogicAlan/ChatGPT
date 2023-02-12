const { CommandBuilder } = require("../Commands.js");
const { ask } = require("../ai.js");

module.exports = {
  command: new CommandBuilder()
    .setName("textgen")
    .setDescription("Generate an texts based on a given prompt.")
    .addAliases("tg")
    .addTextOption(o =>
      o.setName("prompt")
        .setRequired(true)),
  run: async function (message, data) {
    const prompt = data.get("prompt").value;
    const answer = (await ask(prompt)).replaceAll("<code>", "```").replaceAll("</code>", "```") //prompt GPT-3
    message.channel.sendMessage(answer);
  }
}
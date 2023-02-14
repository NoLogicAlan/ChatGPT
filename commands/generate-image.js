const { CommandBuilder } = require("../Commands.js");
const { ask } = require("../generateImage");

module.exports = {
  command: new CommandBuilder()
    .setName("generate-image")
    .setDescription("Generate an image based on a given prompt.")
    .addAliases("gi")
    .addTextOption(o =>
      o.setName("prompt")
        .setRequired(true)),
  run: async function (message, data) {
    const prompt = data.get("prompt").value
    const answer = await ask(prompt, message);
    if (answer.success) {
      answer.imageUrls.forEach(url => {
        message.channel.sendMessage(`[Image](${url})`);
      });
    } else {
      message.channel.sendMessage(answer.error);
    }
  }
}
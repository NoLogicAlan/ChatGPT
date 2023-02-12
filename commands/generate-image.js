const { CommandBuilder } = require("../Commands.js");
const { ask } = require("../generateImage");
const Uploader = require("revolt-uploader");
const https = require('https');

async function upload(url) {
  return new Promise((res) => {
    https.get(url, async (response) => {
      res(await this.upload.upload(response, "generatedImage"));
    });
  });
}

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
    const answer = await ask(prompt);
    if (answer.success) {
      message.channel.sendMessage(answer.imageUrls.join(" "));
      //message.channel.sendMessage({
      //  content: " ",
      //  images: (await Promise.all(answer.imageUrls.map(i=>upload(i))).map(i=>i.value))
      //})
    } else {
      message.channel.sendMessage(answer.error);
    }
  }
}
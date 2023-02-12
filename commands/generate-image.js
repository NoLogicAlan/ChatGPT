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
      const startTime = new Date();
      const elapsedTime = (new Date() - startTime) / 1000;
      //message.channel.sendMessage({
      //  content: " ",
      //  images: (await Promise.all(answer.imageUrls.map(i=>upload(i))).map(i=>i.value))
      //})
      message.channel.sendMessage(`Image generated in ${elapsedTime} seconds, please wait...`);
      setTimeout(() => {
        answer.imageUrls.forEach(url => {
          message.channel.sendMessage(`[Image](${url})`);
        });
      }, 5000); // 5000ms = 5s
    } else {
      message.channel.sendMessage(answer.error);
    }
  }
}


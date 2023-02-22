const { CommandBuilder } = require("../Commands.js");
const { ask } = require("../generateImage");
const fetch = require('node-fetch');

module.exports = {
  command: new CommandBuilder()
    .setName("generate-image")
    .setDescription("Generate an image based on a given prompt.")
    .addAliases("gi")
    .addTextOption(o =>
      o.setName("prompt")
        .setRequired(true)),
  run: async function (message, data) {
    const prompt = data.get("prompt").value;
    const answer = await ask(prompt, message);
    const imageUrl = answer.imageUrls[0]; // select the first URL from the array
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.buffer();
      const media = await upload.call(this, buffer, prompt);
      message.channel.sendMessage({
        content: "",
        embeds: [{
          title: "Image Generation",
          description: "Here's your generated image:",
          media,
          colour: "#bb2525"
        }]
      });
    } catch (error) {
      console.error(error);
    }
  }
}

async function upload(buffer, prompt) {
  return new Promise((res, rej) => {
    this.uploader.upload(buffer, `${prompt}`).then(res).catch(rej);
  });
}

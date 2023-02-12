const { Configuration, OpenAIApi } = require("openai");
const API_KEY = "its ur problem";
const configuration = new Configuration({
  apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

async function ask(prompt) {
  try {
    const response = await openai.createImage({
      prompt: prompt,
      n: 2,
      size: "1024x1024"
    });
    const imageUrls = response.data.data.map(e=>e.url);

    return { success: true, imageUrls };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  ask,
};

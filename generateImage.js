const { Configuration, OpenAIApi } = require("openai");
const API_KEY = "its ur problem";
const configuration = new Configuration({
  apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

const rateLimitPeriod = 10 * 1000; // 10 seconds
const rateLimitCount = 10;

let rateLimitResetTime = 0;
let rateLimitCounter = 0;

async function ask(prompt) {
  try {
    if (Date.now() < rateLimitResetTime) {
      if (rateLimitCounter >= rateLimitCount) {
        return { success: false, error: `Rate limit reached. Try again in ${(rateLimitResetTime - Date.now()) / 1000} seconds.` };
      }
      rateLimitCounter++;
    } else {
      rateLimitCounter = 0;
      rateLimitResetTime = Date.now() + rateLimitPeriod;
    }

    const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });
    const imageUrls = response.data.data.map(e => e.url);

    return { success: true, imageUrls };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  ask,
};

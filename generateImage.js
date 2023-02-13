const { Configuration, OpenAIApi } = require("openai");
const API_KEY = "its ur problem";
const DEFAULT_MODEL = "image-alpha-001";
const AVAILABLE_MODELS = ["image-alpha-001", "image-alpha-002", "image-alpha-003", "image-dall-E-002", "image-curie-001", "image-curie-002", "image-babbage-001", "image-jukebox-001"];
const configuration = new Configuration({
  apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

const RATE_LIMIT_PERIOD = 10 * 1000; // 10 seconds
const RATE_LIMIT_COUNT = 10;

let rateLimitResetTime = 0;
let rateLimitCounter = 0;

async function ask(prompt, model = DEFAULT_MODEL,) {
  if (!AVAILABLE_MODELS.includes(model)) {
    throw new Error(`Error: The model "${model}" is not available. Please choose from: ${AVAILABLE_MODELS.join(", ")}`);
  }
  try {
    if (Date.now() < rateLimitResetTime) {
      if (rateLimitCounter >= RATE_LIMIT_COUNT) {
        throw new Error(`Rate limit reached. Try again in ${(rateLimitResetTime - Date.now()) / 1000} seconds.`);
      }
      rateLimitCounter++;
    } else {
      rateLimitCounter = 0;
      rateLimitResetTime = Date.now() + RATE_LIMIT_PERIOD;
    }

    const response = await openai.createImage({
      prompt,
      model,
      n: 1,
      size: "1024x1024"
    });
    const imageUrls = response.data.data.map(({ url }) => url);

    return { success: true, imageUrls };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message + " or bad prompt (maybe)" };
  }
}

module.exports = {
  ask,
};

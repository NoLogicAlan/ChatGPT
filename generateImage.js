const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");

const API_KEY = "its ur problem";
const DEFAULT_MODEL = "image-alpha-001";
const AVAILABLE_MODELS = [
  "image-alpha-001",
  "image-alpha-002",
  "image-alpha-003",
  "image-dall-E-002",
  "image-curie-001",
  "image-curie-002",
  "image-babbage-001",
  "image-jukebox-001",
];

const RATE_LIMIT_COUNT = 1000;

const usageDataPath = path.join(__dirname, "usageData.json");

const configuration = new Configuration({
  apiKey: API_KEY,
});

const openai = new OpenAIApi(configuration);

let usageData = {};

// Load the usage data from the file
try {
  const rawData = fs.readFileSync(usageDataPath);
  usageData = JSON.parse(rawData);
} catch (error) {
  console.error("Failed to load usage data from file", error);
}

// Save the usage data to the file
function saveUsageData() {
  fs.writeFileSync(usageDataPath, JSON.stringify(usageData));
}

async function ask(prompt, message, model = DEFAULT_MODEL) {
  let userId = null;
  if (message && message.author_id) {
    userId = message.author_id;
  }
  if (!AVAILABLE_MODELS.includes(model)) {
    throw new Error(`Error: The model "${model}" is not available. Please choose from: ${AVAILABLE_MODELS.join(", ")}`);
  }

  const now = Date.now();
  const userUsage = usageData[userId] || { count: 0, resetTime: 0 };

  // Check if the user has exceeded the usage limit
  if (userUsage.count >= RATE_LIMIT_COUNT && now < userUsage.resetTime) {
    const timeLeft = Math.ceil((userUsage.resetTime - now) / 1000);
    throw new Error(`Usage limit reached for user ${userId}. Try again in ${timeLeft} seconds.`);
  }

  userUsage.count++;

  // Check if the user has used the API 1000 times
  if (userUsage.count === 1000) {
    userUsage.limitReached = true;
  }

  // Save the updated usage data to the file
  usageData[userId] = userUsage;
  saveUsageData();

  if (userUsage.limitReached) {
    return { success: false, error: "User" + `<@${userId}>` + "has reached 1000 API uses." };
  }

  try {
    const response = await openai.createImage({
      prompt,
      model,
      n: 1,
      size: "1024x1024"
    });
    const imageUrls = response?.data?.data?.map(({ url }) => url);
    return { success: true, imageUrls };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message + " or bad prompt (maybe)" };
  }
}

module.exports = {
  ask,
};

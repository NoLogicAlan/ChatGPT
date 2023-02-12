const { Configuration, OpenAIApi } = require("openai");

const API_KEY = "its ur problem";
const DEFAULT_MODEL = "text-davinci-002";
const AVAILABLE_MODELS = ["text-davinci-002", "text-curie-001", "text-babbage-001"];

const configuration = new Configuration({
    apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

async function ask(prompt, model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 256, topP = 1, frequencyPenalty = 0, presencePenalty = 0) {
    if (!AVAILABLE_MODELS.includes(model)) {
        throw new Error(`Error: The model "${model}" is not available. Please choose from: ${AVAILABLE_MODELS.join(", ")}`);
    }

    const response = await openai.createCompletion({
        model,
        prompt,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
    });
    const answer = response.data.choices[0].text;
    return answer;
}

module.exports = {
    ask,
};

const OpenAI = require("openai");

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: OPENAI_API_KEY is not set. AI features will not work.");
}

const client = new OpenAI({ apiKey: apiKey || "not-configured" });

const originalChatCreate = client.chat.completions.create.bind(client.chat.completions);
client.chat.completions.create = function (params) {
  return originalChatCreate({ ...params, store: false });
};

module.exports = client;

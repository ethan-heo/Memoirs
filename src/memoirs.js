const { NotionToMarkdown } = require("notion-to-md");
const { markdownToBlocks } = require("@tryfabric/martian");
const { Client } = require("@notionhq/client");
const { OpenAI } = require("openai");
const { SYSTEM_PROMPTS } = require("./prompts");

const createMemoirs = (options) => {
  const notion = new Client({ auth: options.notion.token });
  const ntm = new NotionToMarkdown({ notionClient: notion });
  const openai = new OpenAI({
    apiKey: options.openai.key,
  });
  return {
    getContents: async (queryOptions = {}) => {
      const { results } = await notion.databases.query({
        database_id: options.notion.databaseId,
        ...queryOptions,
      });
      const result = [];

      for (const { id, created_time } of results) {
        let content = ntm.toMarkdownString(await ntm.pageToMarkdown(id)).parent;

        content = `## ${created_time}\n` + content;
        result.push(content);
      }

      return result.join("\n");
    },
    createNotionPage: async (title, content) => {
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await notion.pages.create({
        parent: { database_id: options.notion.databaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
          Date: {
            date: {
              start: currentDate,
            },
          },
        },
        children: markdownToBlocks(content),
      });

      return response;
    },
    ask: async (content) => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS,
          },
          {
            role: "user",
            content,
          },
        ],
      });
    },
  };
};

module.exports = createMemoirs;

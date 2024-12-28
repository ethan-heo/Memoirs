const { Client } = require("@notionhq/client");
const { markdownToBlocks } = require("@tryfabric/martian");

const notionHandler = (token) => {
  const notion = new Client({ auth: token });

  return {
    notion,
    getDatabases: async (databaseId, filterOptions) => {
      const databases = await notion.databases.query({
        database_id: databaseId,
        filter: filterOptions,
      });

      return databases.results;
    },
    createPage: async (databaseId, title, pageData) => {
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
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
              start: new Date().toISOString().split("T")[0],
            },
          },
        },
        children: markdownToBlocks(pageData),
      });

      return response;
    },
  };
};

module.exports = notionHandler;

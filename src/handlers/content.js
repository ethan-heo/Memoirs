const { NotionToMarkdown } = require("notion-to-md");

const contentHandler = (notion) => {
  const ntm = new NotionToMarkdown({ notionClient: notion });
  return {
    toContent: async (notionDBResult) => {
      const { id, created_time } = notionDBResult;
      let content = ntm.toMarkdownString(await ntm.pageToMarkdown(id)).parent;

      content = `## ${created_time}\n` + content;

      return content;
    },
  };
};

module.exports = contentHandler;

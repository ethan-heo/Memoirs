const { resolve } = require("node:path");
const createMemoirs = require("./memoirs");

require("dotenv").config({ path: resolve(__dirname, "../.env") });

const memoirs = createMemoirs({
  notion: {
    databaseId: process.env.NOTION_DATABASE_ID,
    token: process.env.NOTION_API_KEY,
  },
  openai: {
    key: process.env.OPENAI_API_KEY,
  },
});

async function generate() {
  const contents = await memoirs.getContents({
    filter: {
      property: "Date",
      date: { this_week: {} },
    },
  });

  if (!contents) {
    console.log("No contents found for this week.");
    return;
  }

  const answers = await memoirs.ask(contents);

  await memoirs.createNotionPage("주간 회고", answers);
}

generate();

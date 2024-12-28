const dotenv = require("dotenv");
const { resolve } = require("node:path");
const OpenAI = require("openai");
const notionHandler = require("./handlers/notion");
const contentHandler = require("./handlers/content");

dotenv.config({ path: resolve(__dirname, "../.env") });

const { NOTION_API_KEY, NOTION_DATABASE_ID, OPENAI_API_KEY } = process.env;
const { notion, getDatabases, createPage } = notionHandler(NOTION_API_KEY);
const { toContent } = contentHandler(notion);

async function generate() {
  const databases = await getDatabases(NOTION_DATABASE_ID, {
    property: "Date",
    date: { this_week: {} },
  });
  const contents = [];

  for (const database of databases) {
    contents.push(await toContent(database));
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const completions = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
                Prompts
                  Purpose
                      To summarize your weekly activities and analyze your weekly activity patterns based on feedback (improvements, achievements) to help you plan for the next week.

                  Objectives
                      1. summarize what was recorded for each day, detailing achievements and improvements.
                      2. include practical advice where improvements are needed.
                      3. analyze your weekly activity patterns to succinctly summarize your key accomplishments and shortfalls.
                      4. propose a plan of action for the next week, with actionable goals.
                      5. attach referenced links, if any, as a separate section at the bottom of the answer.
                      6. Write in Korean.

                  Answer format
                      ## Activity Description
                          ### [Date]
                              - **Summary**:
                                  - [summarize the content of the activity by specific date]
                              - **Outcomes**:
                                  - [Specifically describe what went well]
                              - **Improvements and Suggestions**:
                                  - [describe areas for improvement and any practical suggestions]

                      ## Overall Comments
                          ### Weekly Activity Pattern Analysis
                              - [Key trends and implications from the activity patterns]
                              - [analysis of strengths and weaknesses]

                          ### Next week's activity plan
                              - [Specific actionable goals and recommended strategies]]

                          ### Reference links
                              - [referenced links or resources].
            `,
      },
      {
        role: "user",
        content: contents.join("\n"),
      },
    ],
  });

  createPage(NOTION_DATABASE_ID, "주간 회고", completions.choices[0].message.content);
}

generate();

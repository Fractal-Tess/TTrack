import { TokenTracker } from "@workspace/tracker";

const tracker = new TokenTracker({
  url: "http://localhost:8086",
  token: "my-super-secret-auth-token",
  org: "ttrack-org",
  bucket: "token-usage",
});

const agents = [
  "research-agent",
  "coding-agent",
  "writer-agent",
  "planner-agent",
];
const models = [
  "gpt-4-turbo",
  "claude-3-opus",
  "llama-3-70b",
  "gemini-1.5-pro",
];

async function seed() {
  console.log("Seeding data...");
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 500; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)]!;
    const model = models[Math.floor(Math.random() * models.length)]!;
    const inputTokens = Math.floor(Math.random() * 2000) + 100;
    const outputTokens = Math.floor(Math.random() * 1000) + 50;

    const timeOffset = Math.floor(Math.random() * oneDay);
    const timestamp = new Date(now - timeOffset);

    tracker.track(
      {
        agentName: agent,
        model: model,
        inputTokens,
        outputTokens,
      },
      timestamp,
    );
  }

  await tracker.flush();
  await tracker.close();
  console.log("Seeding complete.");
}

seed().catch(console.error);

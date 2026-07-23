// Thin abstraction over multiple AI providers so the rest of the app
// never has to know which one is configured. Uses Node's built-in fetch.

const PROVIDER = () => process.env.AI_PROVIDER || "openai";

async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content.map((b) => b.text || "").join("\n");
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Calls the configured AI provider and returns raw text.
 * Set AI_PROVIDER=openai|anthropic|openrouter in .env
 */
export async function callAI(systemPrompt, userPrompt) {
  const provider = PROVIDER();
  switch (provider) {
    case "anthropic":
      return callAnthropic(systemPrompt, userPrompt);
    case "openrouter":
      return callOpenRouter(systemPrompt, userPrompt);
    case "openai":
    default:
      return callOpenAI(systemPrompt, userPrompt);
  }
}

/**
 * Calls the AI and parses the response as JSON, stripping markdown
 * code fences if the model wraps its output in them.
 */
export async function callAIForJSON(systemPrompt, userPrompt) {
  const raw = await callAI(systemPrompt, userPrompt);
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `AI response was not valid JSON: ${err.message}\nRaw response: ${cleaned.slice(0, 500)}`
    );
  }
}

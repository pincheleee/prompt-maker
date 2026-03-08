# Multi-AI Prompt Generator

A web-based tool that generates optimized prompts for LLMs (ChatGPT, Claude, etc.) using multiple AI models. Built with vanilla HTML, CSS, and JavaScript, bundled with Vite.

## Features

- **Three Generation Methods**:
  - **Template-based** -- no API key required, instant local generation
  - **Single AI** -- uses OpenAI GPT-4o Mini to craft an optimized prompt
  - **Multi-AI Aggregation** -- queries multiple models (OpenAI + DeepSeek + template baseline), then aggregates results into one final prompt

- **Supported AI Models**:
  - OpenAI GPT-4o Mini
  - DeepSeek Chat (optional)
  - Built-in template generator (baseline)

- **Customization**:
  - Tone: Professional, Casual, Academic, Friendly
  - Length: Short, Medium, Long
  - Free-form keyword / topic input

- **Reliability**:
  - 30-second request timeouts (AbortController) on every API call
  - Debounce guard prevents duplicate submissions while a request is in flight
  - Local aggregation fallback when the cloud aggregator fails
  - Detailed error handling with a troubleshooting modal

## Tech Stack

| Layer | Tool |
|-------|------|
| Markup | HTML5 |
| Styles | CSS3 |
| Logic  | Vanilla JavaScript (ES modules) |
| Bundler | Vite 6 |

No frameworks -- no React, no TypeScript.

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd prompt-maker

# 2. Install dependencies
npm install

# 3. Copy the example env file and add your keys
cp .env.example .env

# 4. Start the dev server
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (for Single AI and Multi-AI modes) | [Get one here](https://platform.openai.com/api-keys) |
| `DEEPSEEK_API_KEY` | No (Multi-AI only) | [Get one here](https://platform.deepseek.com/) |

Template-based generation works without any API keys.

**Note:** API keys entered in the browser UI are saved to `localStorage` -- they are never sent anywhere except the respective API provider.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
prompt-maker/
  index.html        # Main HTML page
  script.js         # All application logic (API calls, UI, aggregation)
  styles.css        # Styling
  vite.config.ts    # Vite config (vanilla HTML/JS/CSS, no plugins)
  package.json      # Dev dependency: Vite only
  .env.example      # Template for required environment variables
```

## How Multi-AI Aggregation Works

1. Your topic is sent to each enabled model in parallel.
2. A flow diagram in the UI tracks progress per model.
3. Once all models finish, an aggregator pass (GPT-4o Mini) merges the best elements from every response into a single optimized prompt.
4. If the aggregator call fails, a local fallback combines the raw outputs so you never leave empty-handed.

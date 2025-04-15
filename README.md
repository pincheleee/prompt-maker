# Multi-AI Prompt Generator

A powerful web-based tool that generates optimized prompts for LLMs (Large Language Models) like ChatGPT using multiple AI models.

## Features

- **Multiple Generation Methods**:
  - Template-based generation (no API key required)
  - Single AI generation with OpenAI
  - Multi-AI aggregation combining multiple models

- **Supported AI Models**:
  - OpenAI GPT-3.5 Turbo
  - DeepSeek AI
  - Basic template generation

- **Customization Options**:
  - Different tones (Professional, Casual, Academic, Friendly)
  - Length options (Short, Medium, Long)
  - Keyword/topic input

- **Resilient Design**:
  - Fallback mechanisms when APIs fail
  - Local aggregation when cloud services are unavailable
  - Detailed error handling and troubleshooting guides

## Usage

1. Open `index.html` in your web browser
2. Choose a generation method:
   - **Template-Based**: Simple, works without API keys
   - **Single AI**: Uses just OpenAI's API
   - **Multi-AI**: Combines multiple AI models for better results
3. Enter API keys if needed
4. Enter keywords/topics
5. Select tone and length
6. Click "Generate Prompt"
7. Copy the generated prompt to use with ChatGPT or other LLMs

## API Keys

- **OpenAI**: Required for Single AI and Multi-AI methods
  - Get from: [OpenAI API Keys](https://platform.openai.com/api-keys)
- **DeepSeek**: Optional for Multi-AI method
  - Get from: [DeepSeek Platform](https://platform.deepseek.com/)

## Notes

- API keys are stored locally in your browser
- No data is sent to servers except the API providers
- For issues with APIs, use the Troubleshooting guide

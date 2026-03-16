// Debounce flag -- prevents spam clicks during API calls
let isGenerating = false;

// Store API keys in sessionStorage (cleared when tab closes)
document.addEventListener('DOMContentLoaded', function() {
  const openaiKeyInput = document.getElementById('openai-api-key');
  const deepseekKeyInput = document.getElementById('deepseek-api-key');

  if (sessionStorage.getItem('openai-api-key')) {
    openaiKeyInput.value = sessionStorage.getItem('openai-api-key');
  }

  if (sessionStorage.getItem('deepseek-api-key')) {
    deepseekKeyInput.value = sessionStorage.getItem('deepseek-api-key');
  }

  openaiKeyInput.addEventListener('change', function() {
    sessionStorage.setItem('openai-api-key', openaiKeyInput.value);
  });

  deepseekKeyInput.addEventListener('change', function() {
    sessionStorage.setItem('deepseek-api-key', deepseekKeyInput.value);
  });

  // Toggle between generation methods
  let generationMethod = 'template';

  document.getElementById('template-method').addEventListener('click', function() {
    generationMethod = 'template';
    setActiveMethod(this);
    document.getElementById('api-key-section').style.display = 'none';
    document.getElementById('deepseek-key-section').style.display = 'none';
  });

  document.getElementById('single-ai-method').addEventListener('click', function() {
    generationMethod = 'single';
    setActiveMethod(this);
    document.getElementById('api-key-section').style.display = 'block';
    document.getElementById('deepseek-key-section').style.display = 'none';
  });

  document.getElementById('multi-ai-method').addEventListener('click', function() {
    generationMethod = 'multi';
    setActiveMethod(this);
    document.getElementById('api-key-section').style.display = 'block';
    document.getElementById('deepseek-key-section').style.display = 'block';
    
    // Show explanation of the new aggregation behavior
    showToast('Multi-AI mode will now combine all available model outputs into one comprehensive prompt', 'success');
  });

  // Generate prompt based on selected method
  document.getElementById('generate').addEventListener('click', function() {
    if (isGenerating) {
      showToast('Generation already in progress, please wait...', 'error');
      return;
    }

    const keywords = document.getElementById('keywords').value.trim();
    const tone = document.getElementById('tone').value;
    const length = document.getElementById('length').value;

    if (!keywords) {
      showToast('Please enter some keywords', 'error');
      return;
    }

    if (generationMethod === 'template') {
      generateTemplatePrompt(keywords, tone, length);
    } else if (generationMethod === 'single') {
      const apiKey = openaiKeyInput.value.trim();
      if (!apiKey) {
        showToast('Please enter your OpenAI API key', 'error');
        return;
      }
      generateSingleAiPrompt(keywords, tone, length, apiKey);
    } else if (generationMethod === 'multi') {
      const openaiKey = openaiKeyInput.value.trim();
      const deepseekKey = deepseekKeyInput.value.trim();
      
      if (!openaiKey) {
        showToast('Please enter your OpenAI API key', 'error');
        return;
      }
      
      generateMultiAiPrompt(keywords, tone, length, openaiKey, deepseekKey);
    }
  });
  
  // Copy button functionality
  document.getElementById('copy').addEventListener('click', function() {
    const prompt = document.getElementById('prompt').value;
    navigator.clipboard.writeText(prompt).then(function() {
      showToast('Prompt copied to clipboard', 'success');
    }).catch(function() {
      showToast('Failed to copy prompt', 'error');
    });
  });

  // Troubleshooting modal functionality
  document.getElementById('troubleshoot-button').addEventListener('click', function() {
    document.getElementById('troubleshoot-modal').style.display = 'flex';
  });

  document.querySelector('.modal-close').addEventListener('click', function() {
    document.getElementById('troubleshoot-modal').style.display = 'none';
  });

  // Close modal when clicking outside of it
  document.getElementById('troubleshoot-modal').addEventListener('click', function(event) {
    if (event.target === this) {
      this.style.display = 'none';
    }
  });
});

// Helper Functions
function setActiveMethod(element) {
  document.querySelectorAll('.method-option').forEach(option => {
    option.classList.remove('active');
  });
  element.classList.add('active');
}

function generateTemplatePrompt(keywords, tone, length) {
  const promptTemplate = `Create a ${tone} response about ${keywords}. 
The response should be ${length} in length and focus on the key aspects of the topic.
Please provide detailed information while maintaining a ${tone} tone throughout.`;
  
  document.getElementById('prompt').value = promptTemplate;
  document.getElementById('prompt-source').textContent = 'Source: Template-based generation';
  document.getElementById('result').style.display = 'block';
  document.getElementById('model-results').style.display = 'none';
  document.getElementById('flow-diagram').style.display = 'none';
}

function buildPromptMessages(keywords, tone, length) {
  const systemPrompt = `You are an expert prompt engineer. Your task is to create an optimized prompt for ChatGPT or similar LLMs.
The prompt should be designed to get high-quality responses about the provided topic.`;

  const userPrompt = `Create an optimized prompt about the following topic(s): "${keywords}".
The prompt should be in a ${tone} tone and should generate a ${length} response.
The prompt should be comprehensive, clear, and designed to get the most helpful and accurate information from an AI assistant.
Return ONLY the optimized prompt, without any explanations, introductions, or surrounding text.`;

  return { systemPrompt, userPrompt };
}

function generateSingleAiPrompt(keywords, tone, length, apiKey) {
  isGenerating = true;
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  document.getElementById('model-results').style.display = 'none';
  document.getElementById('flow-diagram').style.display = 'none';

  const { systemPrompt, userPrompt } = buildPromptMessages(keywords, tone, length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    }),
    signal: controller.signal
  })
  .then(response => {
    if (!response.ok) {
      return response.json().catch(() => null).then(errorData => {
        console.error('OpenAI API Error:', errorData);
        let errorMessage = 'API request failed';

        if (errorData && errorData.error) {
          if (errorData.error.type === 'invalid_request_error') {
            errorMessage = 'Invalid API key or request format';
          } else if (errorData.error.type === 'authentication_error') {
            errorMessage = 'Authentication failed - check your API key';
          } else if (errorData.error.type === 'rate_limit_exceeded') {
            errorMessage = 'Rate limit exceeded - try again later';
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        }

        throw new Error(`OpenAI API Error: ${errorMessage}`);
      });
    }
    return response.json();
  })
  .then(data => {
    const generatedPrompt = data.choices[0].message.content;
    document.getElementById('prompt').value = generatedPrompt;
    document.getElementById('prompt-source').textContent = 'Source: OpenAI GPT-4o Mini';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'block';
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('loading').style.display = 'none';
    if (error.name === 'AbortError') {
      showToast('Request timed out after 30 seconds. Please try again.', 'error');
    } else {
      showToast(error.message || 'Error generating prompt. Please check your API key and try again.', 'error');
    }
  })
  .finally(() => {
    clearTimeout(timeoutId);
    isGenerating = false;
  });
}

function generateMultiAiPrompt(keywords, tone, length, openaiKey, deepseekKey) {
  isGenerating = true;
  // Reset UI
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  document.getElementById('model-results').style.display = 'block';
  document.getElementById('model-results').innerHTML = '';
  document.getElementById('flow-diagram').style.display = 'block';
  document.getElementById('troubleshoot-button').style.display = 'none';
  
  // Initialize flow steps
  resetFlowDiagram();
  setActiveFlowStep('step-query');
  
  // Create model cards
  const modelResultsContainer = document.getElementById('model-results');
  
  // OpenAI model card
  const openaiCard = createModelCard('OpenAI GPT-4o Mini', 'Specialized in following instructions precisely');
  modelResultsContainer.appendChild(openaiCard);
  
  // DeepSeek model card (if API key provided)
  let deepseekCard = null;
  if (deepseekKey) {
    deepseekCard = createModelCard('DeepSeek AI', 'Advanced language model with extensive knowledge');
    modelResultsContainer.appendChild(deepseekCard);
  }
  
  // Simple model card (simulated)
  const simpleCard = createModelCard('Simple Template', 'Basic template generation as a baseline');
  modelResultsContainer.appendChild(simpleCard);
  
  // Aggregator model card
  const aggregatorCard = createModelCard('Meta Aggregator', 'Combines insights from all models');
  modelResultsContainer.appendChild(aggregatorCard);
  
  // Set statuses to pending
  setModelStatus(openaiCard, 'pending');
  if (deepseekCard) setModelStatus(deepseekCard, 'pending');
  setModelStatus(simpleCard, 'pending');
  setModelStatus(aggregatorCard, 'pending');
  
  // Set model step as active
  setTimeout(() => {
    setActiveFlowStep('step-models');
  }, 1000);

  // Build all model promises
  const modelPromises = [
    // 1. OpenAI
    generateOpenAIPrompt(keywords, tone, length, openaiKey)
      .then(prompt => {
        setModelStatus(openaiCard, 'complete');
        return { source: 'OpenAI', prompt };
      })
      .catch(error => {
        console.error('OpenAI Error:', error);
        setModelStatus(openaiCard, 'error');
        document.getElementById('troubleshoot-button').style.display = 'inline-block';
        throw error;
      }),
    // 2. Simple template (wrapped in a delayed promise)
    new Promise(resolve => {
      const simplePrompt = `Create a ${tone} response about ${keywords}.
The response should be ${length} in length and focus on the key aspects of the topic.
Please provide detailed information while maintaining a ${tone} tone throughout.`;
      setTimeout(() => {
        setModelStatus(simpleCard, 'complete');
        resolve({ source: 'Template', prompt: simplePrompt });
      }, 1000);
    })
  ];

  // 3. DeepSeek (if API key provided)
  if (deepseekKey) {
    modelPromises.push(
      generateDeepSeekPrompt(keywords, tone, length, deepseekKey)
        .then(prompt => {
          setModelStatus(deepseekCard, 'complete');
          return { source: 'DeepSeek', prompt };
        })
        .catch(error => {
          console.error('DeepSeek Error:', error);
          setModelStatus(deepseekCard, 'error');
          throw error;
        })
    );
  }

  Promise.allSettled(modelPromises).then(async results => {
    const allPrompts = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    // Set aggregation step as active
    setActiveFlowStep('step-aggregate');

    if (allPrompts.length === 0) {
      setModelStatus(aggregatorCard, 'error');
      document.getElementById('loading').style.display = 'none';
      showToast('All prompt generation attempts failed.', 'error');
      isGenerating = false;
      return;
    }

    const openaiSucceeded = allPrompts.some(item => item.source === 'OpenAI');

    if (openaiSucceeded) {
      try {
        const finalPrompt = await aggregatePrompts(allPrompts, openaiKey);
        setModelStatus(aggregatorCard, 'complete');
        setActiveFlowStep('step-final');
        document.getElementById('prompt').value = finalPrompt;
        document.getElementById('prompt-source').textContent = 'Source: Multi-AI Aggregation (via OpenAI)';
      } catch (error) {
        console.error('Aggregation Error:', error);
        setModelStatus(aggregatorCard, 'error');
        const localAggregation = localAggregatePrompts(allPrompts);
        document.getElementById('prompt').value = localAggregation;
        document.getElementById('prompt-source').textContent = 'Source: Multi-AI Aggregation (local fallback)';
      }
    } else {
      try {
        const localAggregation = localAggregatePrompts(allPrompts);
        setModelStatus(aggregatorCard, 'complete');
        setActiveFlowStep('step-final');
        document.getElementById('prompt').value = localAggregation;
        document.getElementById('prompt-source').textContent = 'Source: Multi-AI Aggregation (local)';
      } catch (error) {
        console.error('Local Aggregation Error:', error);
        setModelStatus(aggregatorCard, 'error');
        showToast('Error during aggregation. Using best available prompt.', 'error');
        document.getElementById('prompt').value = allPrompts[0].prompt;
        document.getElementById('prompt-source').textContent = `Source: ${allPrompts[0].source} (fallback)`;
      }
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    isGenerating = false;
  });
}

function generateOpenAIPrompt(keywords, tone, length, apiKey) {
  const { systemPrompt, userPrompt } = buildPromptMessages(keywords, tone, length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    }),
    signal: controller.signal
  })
  .then(response => {
    if (!response.ok) {
      return response.json().catch(() => null).then(errorData => {
        console.error('OpenAI API Error:', errorData);
        let errorMessage = 'API request failed';

        if (errorData && errorData.error) {
          if (errorData.error.type === 'invalid_request_error') {
            errorMessage = 'Invalid API key or request format';
          } else if (errorData.error.type === 'authentication_error') {
            errorMessage = 'Authentication failed - check your API key';
          } else if (errorData.error.type === 'rate_limit_exceeded') {
            errorMessage = 'Rate limit exceeded - try again later';
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        }

        throw new Error(`OpenAI API Error: ${errorMessage}`);
      });
    }
    return response.json();
  })
  .then(data => data.choices[0].message.content)
  .finally(() => clearTimeout(timeoutId));
}

function generateDeepSeekPrompt(keywords, tone, length, apiKey) {
  // Create a prompt for DeepSeek's AI
  const userMessage = `Create an optimized prompt about the following topic(s): "${keywords}".
The prompt should be in a ${tone} tone and should generate a ${length} response.
The prompt should be comprehensive, clear, and designed to get the most helpful and accurate information from an AI assistant.
Return ONLY the optimized prompt, without any explanations, introductions, or surrounding text.`;

  // Call DeepSeek's API
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  return fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }),
    signal: controller.signal
  })
  .then(response => {
    if (!response.ok) {
      return response.json().catch(() => null).then(errorData => {
        console.error('DeepSeek API Error:', errorData);
        let errorMessage = 'API request failed';

        if (errorData && errorData.error) {
          if (errorData.error.type) {
            errorMessage = `${errorData.error.type}`;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        }

        throw new Error(`DeepSeek API Error: ${errorMessage}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Unexpected response format from DeepSeek API');
  })
  .finally(() => clearTimeout(timeoutId));
}

function aggregatePrompts(prompts, apiKey) {
  // Create a system prompt for the aggregator
  const systemPrompt = `You are an expert prompt engineer tasked with creating the most effective prompt possible.
You will be given multiple prompt versions created by different AI models.
Your job is to analyze these prompts, identify the strengths of each, and create a single optimized prompt that combines the best elements.
The final prompt should be comprehensive, clear, and designed to get the most helpful and accurate information from an AI assistant.`;

  // Format the collected prompts for the aggregator
  let promptsText = '';
  prompts.forEach((item, index) => {
    promptsText += `Prompt ${index + 1} (from ${item.source}):\n${item.prompt}\n\n`;
  });

  const userPrompt = `Here are ${prompts.length} different prompts generated for the same topic:\n\n${promptsText}
Analyze these prompts and create a single optimized version that combines the strengths of each.
Return ONLY the optimized prompt, without any explanations, introductions, or surrounding text.`;

  // Call OpenAI to aggregate the prompts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    }),
    signal: controller.signal
  })
  .then(response => {
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error('Aggregation API request failed');
    }
    return response.json();
  })
  .then(data => data.choices[0].message.content);
}

function localAggregatePrompts(prompts) {
  // Always combine prompts when multiple are available
  if (prompts.length > 1) {
    let combinedPrompt = "Combined insights from multiple AI models:\n\n";
    prompts.forEach((item) => {
      // Extract the full prompt from each source
      combinedPrompt += `From ${item.source}:\n${item.prompt}\n\n`;
    });
    
    // Add a note to help users understand how to use the combined prompt
    combinedPrompt += "Consider using elements from all the above suggestions to craft your final prompt.";
    
    return combinedPrompt.trim();
  }
  
  // Fallback to single prompt if only one is available
  return prompts[0].prompt;
}

function resetFlowDiagram() {
  // Reset all steps to inactive
  document.querySelectorAll('.flow-step').forEach(step => {
    step.classList.remove('active');
  });
}

function setActiveFlowStep(stepId) {
  // First, reset all steps
  document.querySelectorAll('.flow-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Set the specified step as active
  document.getElementById(stepId).classList.add('active');
}

function createModelCard(title, description) {
  const card = document.createElement('div');
  card.className = 'model-card';
  card.innerHTML = `
    <div class="model-title">${title}</div>
    <div class="model-description">${description}</div>
    <div class="model-status">Status: Pending</div>
  `;
  return card;
}

function setModelStatus(card, status) {
  card.querySelector('.model-status').textContent = `Status: ${status}`;
  if (status === 'complete') {
    card.className = 'model-card complete';
  } else if (status === 'error') {
    card.className = 'model-card error';
  } else if (status === 'pending') {
    card.className = 'model-card pending';
  }
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';
  
  setTimeout(function() {
    toast.style.display = 'none';
  }, 3000);
} 
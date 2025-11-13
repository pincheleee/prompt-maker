// Store API keys in local storage
// WARNING: localStorage is vulnerable to XSS attacks. API keys stored here could be
// accessed by malicious scripts. Consider using sessionStorage for better security,
// or implement additional security measures if this app is deployed in production.
document.addEventListener('DOMContentLoaded', function() {
  const openaiKeyInput = document.getElementById('openai-api-key');
  const deepseekKeyInput = document.getElementById('deepseek-api-key');

  if (localStorage.getItem('openai-api-key')) {
    openaiKeyInput.value = localStorage.getItem('openai-api-key');
  }

  if (localStorage.getItem('deepseek-api-key')) {
    deepseekKeyInput.value = localStorage.getItem('deepseek-api-key');
  }
  
  openaiKeyInput.addEventListener('change', function() {
    localStorage.setItem('openai-api-key', openaiKeyInput.value);
  });

  deepseekKeyInput.addEventListener('change', function() {
    localStorage.setItem('deepseek-api-key', deepseekKeyInput.value);
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
    }).catch(function(err) {
      console.error('Clipboard error:', err);
      showToast('Failed to copy prompt. Please copy manually.', 'error');
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

function generateSingleAiPrompt(keywords, tone, length, apiKey) {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  document.getElementById('model-results').style.display = 'none';
  document.getElementById('flow-diagram').style.display = 'none';
  
  const systemPrompt = `You are an expert prompt engineer. Your task is to create an optimized prompt for ChatGPT or similar LLMs.
The prompt should be designed to get high-quality responses about the provided topic.`;

  const userPrompt = `Create an optimized prompt about the following topic(s): "${keywords}".
The prompt should be in a ${tone} tone and should generate a ${length} response.
The prompt should be comprehensive, clear, and designed to get the most helpful and accurate information from an AI assistant.
Return ONLY the optimized prompt, without any explanations, introductions, or surrounding text.`;

  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  })
  .then(response => {
    if (!response.ok) {
      // Get more detailed error information
      return response.json().then(errorData => {
        console.error('OpenAI API Error:', errorData);
        let errorMessage = 'API request failed';
        
        if (errorData.error) {
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
      }, jsonError => {
        // If parsing the error response fails
        throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('Unexpected response format from OpenAI API');
    }
    const generatedPrompt = data.choices[0].message.content;
    document.getElementById('prompt').value = generatedPrompt;
    document.getElementById('prompt-source').textContent = 'Source: OpenAI GPT-3.5 Turbo';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'block';
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('loading').style.display = 'none';
    showToast('Error generating prompt. Please check your API key and try again.', 'error');
  });
}

function generateMultiAiPrompt(keywords, tone, length, openaiKey, deepseekKey) {
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
  const openaiCard = createModelCard('OpenAI GPT-3.5', 'Specialized in following instructions precisely');
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
  
  // Create an array to store all results
  const allPrompts = [];
  let completedCount = 0;
  const totalModels = deepseekKey ? 3 : 2; // OpenAI + Simple + (DeepSeek if provided)
  
  // Set model step as active
  setTimeout(() => {
    setActiveFlowStep('step-models');
  }, 1000);
  
  // 1. Generate OpenAI prompt
  generateOpenAIPrompt(keywords, tone, length, openaiKey)
    .then(prompt => {
      setModelStatus(openaiCard, 'complete');
      allPrompts.push({ source: 'OpenAI', prompt });
      checkAllComplete();
    })
    .catch(error => {
      console.error('OpenAI Error:', error);
      setModelStatus(openaiCard, 'error');
      // Show troubleshoot button when there's an error
      document.getElementById('troubleshoot-button').style.display = 'inline-block';
      checkAllComplete();
    });
  
  // 2. Generate DeepSeek prompt (if API key provided)
  if (deepseekKey) {
    generateDeepSeekPrompt(keywords, tone, length, deepseekKey)
      .then(prompt => {
        setModelStatus(deepseekCard, 'complete');
        allPrompts.push({ source: 'DeepSeek', prompt });
        checkAllComplete();
      })
      .catch(error => {
        console.error('DeepSeek Error:', error);
        setModelStatus(deepseekCard, 'error');
        checkAllComplete();
      });
  }
  
  // 3. Generate simple template prompt
  try {
    const simplePrompt = `Create a ${tone} response about ${keywords}. 
The response should be ${length} in length and focus on the key aspects of the topic.
Please provide detailed information while maintaining a ${tone} tone throughout.`;
    
    setTimeout(() => {
      setModelStatus(simpleCard, 'complete');
      allPrompts.push({ source: 'Template', prompt: simplePrompt });
      checkAllComplete();
    }, 1000); // Simulated delay
  } catch (error) {
    console.error('Template Error:', error);
    setModelStatus(simpleCard, 'error');
    checkAllComplete();
  }
  
  // Function to check if all models have completed
  function checkAllComplete() {
    completedCount++;
    
    if (completedCount >= totalModels) {
      // Set aggregation step as active
      setActiveFlowStep('step-aggregate');
      
      // If we have at least one successful prompt, proceed with aggregation
      if (allPrompts.length > 0) {
        // Try to use OpenAI for aggregation if it succeeded, otherwise use local aggregation
        const openaiSucceeded = allPrompts.some(item => item.source === 'OpenAI');
        
        if (openaiSucceeded) {
          // Use OpenAI for aggregation
          aggregatePrompts(allPrompts, openaiKey)
            .then(finalPrompt => {
              setModelStatus(aggregatorCard, 'complete');
              setActiveFlowStep('step-final');
              document.getElementById('prompt').value = finalPrompt;
              document.getElementById('prompt-source').textContent = 'Source: Multi-AI Aggregation (via OpenAI)';
              document.getElementById('loading').style.display = 'none';
              document.getElementById('result').style.display = 'block';
            })
            .catch(error => {
              console.error('Aggregation Error:', error);
              setModelStatus(aggregatorCard, 'error');
              // Always fall back to local aggregation that combines all available prompts
              const localAggregation = localAggregatePrompts(allPrompts);
              document.getElementById('prompt').value = localAggregation;
              document.getElementById('prompt-source').textContent = 'Source: Multi-AI Aggregation (local fallback)';
              document.getElementById('loading').style.display = 'none';
              document.getElementById('result').style.display = 'block';
            });
        } else {
          // Use local aggregation
          try {
            const localAggregation = localAggregatePrompts(allPrompts);
            setModelStatus(aggregatorCard, 'complete');
            setActiveFlowStep('step-final');
            document.getElementById('prompt').value = localAggregation;
            document.getElementById('prompt-source').textContent = 'Source: Multi-AI Aggregation (local)';
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').style.display = 'block';
          } catch (error) {
            console.error('Local Aggregation Error:', error);
            setModelStatus(aggregatorCard, 'error');
            document.getElementById('loading').style.display = 'none';
            showToast('Error during aggregation. Using best available prompt.', 'error');
            
            // Use the best available prompt if everything fails
            document.getElementById('prompt').value = allPrompts[0].prompt;
            document.getElementById('prompt-source').textContent = `Source: ${allPrompts[0].source} (fallback)`;
            document.getElementById('result').style.display = 'block';
          }
        }
      } else {
        // No successful prompts
        setModelStatus(aggregatorCard, 'error');
        document.getElementById('loading').style.display = 'none';
        showToast('All prompt generation attempts failed.', 'error');
      }
    }
  }
}

function generateOpenAIPrompt(keywords, tone, length, apiKey) {
  const systemPrompt = `You are an expert prompt engineer. Your task is to create an optimized prompt for ChatGPT or similar LLMs.
The prompt should be designed to get high-quality responses about the provided topic.`;

  const userPrompt = `Create an optimized prompt about the following topic(s): "${keywords}".
The prompt should be in a ${tone} tone and should generate a ${length} response.
The prompt should be comprehensive, clear, and designed to get the most helpful and accurate information from an AI assistant.
Return ONLY the optimized prompt, without any explanations, introductions, or surrounding text.`;

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  })
  .then(response => {
    if (!response.ok) {
      // Get more detailed error information
      return response.json().then(errorData => {
        console.error('OpenAI API Error:', errorData);
        let errorMessage = 'API request failed';
        
        if (errorData.error) {
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
      }, jsonError => {
        // If parsing the error response fails
        throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('Unexpected response format from OpenAI API');
    }
    return data.choices[0].message.content;
  });
}

function generateDeepSeekPrompt(keywords, tone, length, apiKey) {
  // Create a prompt for DeepSeek's AI
  const userMessage = `Create an optimized prompt about the following topic(s): "${keywords}".
The prompt should be in a ${tone} tone and should generate a ${length} response.
The prompt should be comprehensive, clear, and designed to get the most helpful and accurate information from an AI assistant.
Return ONLY the optimized prompt, without any explanations, introductions, or surrounding text.`;

  // Call DeepSeek's API
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
    })
  })
  .then(response => {
    if (!response.ok) {
      // Get more detailed error information
      return response.json().then(errorData => {
        console.error('DeepSeek API Error:', errorData);
        let errorMessage = 'API request failed';
        
        if (errorData.error) {
          if (errorData.error.type) {
            errorMessage = `${errorData.error.type}`;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        }
        
        throw new Error(`DeepSeek API Error: ${errorMessage}`);
      }, jsonError => {
        // If parsing the error response fails
        throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Unexpected response format from DeepSeek API');
  });
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
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Aggregation API request failed');
    }
    return response.json();
  })
  .then(data => {
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('Unexpected response format from OpenAI API');
    }
    return data.choices[0].message.content;
  });
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
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  card.querySelector('.model-status').textContent = `Status: ${statusText}`;
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
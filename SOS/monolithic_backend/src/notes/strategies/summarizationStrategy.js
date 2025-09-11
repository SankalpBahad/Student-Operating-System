const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require('dotenv').config();

/**
 * Strategy Pattern: Base Summarization Strategy interface
 */
class SummarizationStrategy {
  async summarize(content) {
    throw new Error('summarize method must be implemented by concrete strategies');
  }
}

/**
 * Concrete Strategy: Gemini AI Summarization Strategy
 */
class GeminiSummarizationStrategy extends SummarizationStrategy {
  constructor() {
    super();
    // Initialize Gemini API
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    this.generationConfig = {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096,
    };
    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
  }

  async summarize(content) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      throw new Error('Missing or invalid Gemini API key');
    }

    // Extract text from BlockNote content structure
    let textToSummarize = '';
    if (Array.isArray(content)) {
      content.forEach(block => {
        if (block.content && Array.isArray(block.content)) {
          block.content.forEach(item => {
            if (item.text) textToSummarize += item.text + ' ';
          });
          textToSummarize += '\n';
        }
      });
    } else if (typeof content === 'string') {
      textToSummarize = content;
    }

    // Prepare prompt
    const prompt = `Please summarize the following text concisely while preserving all key information:
    
    ${textToSummarize}
    
    Focus on the main points and key insights. Organize the summary in a clear structure.`;

    // Make API call
    const result = await this.model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings,
    });

    if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
      throw new Error('Gemini did not return valid content');
    }

    return result.response.candidates[0].content.parts[0].text;
  }
}

/**
 * Concrete Strategy: Basic Summarization Strategy (fallback when AI is unavailable)
 */
class BasicSummarizationStrategy extends SummarizationStrategy {
  async summarize(content) {
    let textToSummarize = '';
    
    // Extract text from BlockNote content structure
    if (Array.isArray(content)) {
      content.forEach(block => {
        if (block.content && Array.isArray(block.content)) {
          block.content.forEach(item => {
            if (item.text) textToSummarize += item.text + ' ';
          });
          textToSummarize += '\n';
        }
      });
    } else if (typeof content === 'string') {
      textToSummarize = content;
    }
    
    // Basic summarization: Extract first 1-2 sentences from each paragraph
    const paragraphs = textToSummarize.split('\n');
    let summary = '';
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        const firstSentences = sentences.slice(0, Math.min(2, sentences.length)).join(' ');
        summary += firstSentences + '\n\n';
      }
    });
    
    return summary.length > 10 ? summary : 'Unable to generate summary due to insufficient content.';
  }
}

/**
 * Context class that uses the strategies
 */
class SummarizationContext {
  constructor(strategy = null) {
    this.strategy = strategy || new GeminiSummarizationStrategy();
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async summarize(content) {
    return await this.strategy.summarize(content);
  }
}

module.exports = {
  SummarizationStrategy,
  GeminiSummarizationStrategy,
  BasicSummarizationStrategy,
  SummarizationContext
}; 
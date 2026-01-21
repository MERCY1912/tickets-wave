interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaOptions {
  model: string;
  prompt?: string;
  messages?: OllamaMessage[];
  temperature?: number;
  stream?: boolean;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response?: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaModelsResponse {
  models: OllamaModel[];
}

export class OllamaError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OllamaError';
  }
}

export class OllamaClient {
  constructor(private baseUrl: string = 'http://localhost:11434') {}

  private get endpoint(): string {
    return this.baseUrl.replace(/\/$/, '');
  }

  /**
   * Check if Ollama is running and accessible
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List all available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) {
        throw new OllamaError('Failed to list models', response.status);
      }
      const data = await response.json() as OllamaModelsResponse;
      return data.models.map(m => m.name);
    } catch (error) {
      if (error instanceof OllamaError) throw error;
      throw new OllamaError(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a completion using the prompt endpoint (simpler)
   */
  async generate(options: OllamaOptions): Promise<string> {
    try {
      const requestBody = {
        model: options.model,
        prompt: options.prompt || '',
        system: options.messages?.find(m => m.role === 'system')?.content,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
        },
      };

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        throw new OllamaError(`Ollama API error: ${response.statusText}`, response.status);
      }

      const data = await response.json() as OllamaResponse;

      // Chat endpoint returns message.content, generate returns response
      if (data.message?.content) {
        return data.message.content;
      }
      if (data.response) {
        return data.response;
      }

      throw new OllamaError('No response content from Ollama');
    } catch (error) {
      if (error instanceof OllamaError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OllamaError('Request timeout - Ollama took too long to respond');
      }
      throw new OllamaError(`Failed to generate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chat using the chat endpoint (supports conversation history)
   */
  async chat(options: OllamaOptions): Promise<string> {
    try {
      const messages: OllamaMessage[] = options.messages || [];

      // If prompt is provided but no messages, create a user message
      if (options.prompt && messages.length === 0) {
        messages.push({ role: 'user', content: options.prompt });
      }

      const requestBody = {
        model: options.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
        },
      };

      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        throw new OllamaError(`Ollama API error: ${response.statusText}`, response.status);
      }

      const data = await response.json() as OllamaResponse;

      // Chat endpoint returns message.content, generate returns response
      if (data.message?.content) {
        return data.message.content;
      }
      if (data.response) {
        return data.response;
      }

      throw new OllamaError('No response content from Ollama');
    } catch (error) {
      if (error instanceof OllamaError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OllamaError('Request timeout - Ollama took too long to respond');
      }
      throw new OllamaError(`Failed to chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test if a specific model is available
   */
  async hasModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some(m => m.startsWith(modelName) || modelName.includes(m));
    } catch {
      return false;
    }
  }
}

// Export singleton instance factory
export function createOllamaClient(baseUrl?: string): OllamaClient {
  return new OllamaClient(baseUrl);
}

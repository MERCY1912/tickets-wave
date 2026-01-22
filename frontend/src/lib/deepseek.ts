interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekOptions {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  stream?: boolean;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export class DeepSeekError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'DeepSeekError';
  }
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new DeepSeekError('Failed to list models', response.status);
      }

      const data = (await response.json()) as DeepSeekModelsResponse;
      return data.data.map((m) => m.id);
    } catch (error) {
      if (error instanceof DeepSeekError) throw error;
      throw new DeepSeekError(
        `Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async chat(options: DeepSeekOptions): Promise<string> {
    try {
      const requestBody = {
        model: options.model || 'deepseek-chat',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        stream: false,
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new DeepSeekError(
          errorData.error?.message || `DeepSeek API error: ${response.statusText}`,
          response.status
        );
      }

      const data = (await response.json()) as DeepSeekResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new DeepSeekError('No response from DeepSeek');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof DeepSeekError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new DeepSeekError('Request timeout - DeepSeek took too long to respond');
      }
      throw new DeepSeekError(
        `Failed to chat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export function createDeepSeekClient(apiKey: string): DeepSeekClient {
  return new DeepSeekClient(apiKey);
}

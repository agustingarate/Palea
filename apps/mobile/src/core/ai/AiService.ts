export interface AiService {
  complete(input: {
    prompt: string;
    signal?: AbortSignal;
  }): Promise<{ text: string }>;
}

export class DisabledAiService implements AiService {
  async complete(): Promise<{ text: string }> {
    throw new Error('AI services must be configured through the Palea backend');
  }
}

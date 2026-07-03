import OpenAI from 'openai';
import type { LLMProvider } from './provider';

export class OpenAILLMProvider implements LLMProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private model = process.env.OPENAI_MODEL ?? 'gpt-5.1';

  async chat(input: Parameters<LLMProvider['chat']>[0]) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: input.messages.map((m) => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
      temperature: input.temperature ?? 0.2,
      tools: input.tools?.map((t) => ({ type: 'function' as const, function: { name: t.name, description: t.description, parameters: t.parameters } })),
    });
    const message = response.choices[0]?.message;
    const functionCalls = message?.tool_calls?.filter((call) => call.type === 'function') ?? [];
    return {
      content: message?.content ?? undefined,
      toolCalls: functionCalls.map((call) => ({ name: call.function.name, arguments: JSON.parse(call.function.arguments || '{}') })),
    };
  }
}

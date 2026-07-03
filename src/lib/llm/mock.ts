import type { LLMProvider } from './provider';

export class MockLLMProvider implements LLMProvider {
  constructor(private readonly reply = 'Gerne — welchen Service möchten Sie buchen?') {}
  async chat() { return { content: this.reply }; }
}

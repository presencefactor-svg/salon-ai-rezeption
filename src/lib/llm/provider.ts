export type LLMRole = 'system' | 'user' | 'assistant' | 'tool';
export interface LLMMessage { role: LLMRole; content: string; name?: string }
export interface LLMTool { name: string; description: string; parameters: Record<string, unknown> }
export interface LLMToolCall { name: string; arguments: Record<string, unknown> }
export interface LLMResponse { content?: string; toolCalls?: LLMToolCall[] }

export interface LLMProvider {
  chat(input: { messages: LLMMessage[]; tools?: LLMTool[]; temperature?: number }): Promise<LLMResponse>;
}

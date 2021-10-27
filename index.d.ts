import 'koa';

export declare class MessageCodeError extends Error {
  constructor(code: string, params?: { [key: string]: any });
  code: string;
  params: { [key: string]: any };
}

export interface MessageCodeResolver {
  set(code: string, message: string): void;
  assign(codes: { [key: string]: string }): void;
  get(code: string): string;
  format(code: string, params:? { [key: string]: any }): string;
}

declare module 'koa' {
  interface BaseContext {
    messageCodeResolver: MessageCodeResolver;
  }
}

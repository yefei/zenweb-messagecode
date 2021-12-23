import { SetupFunction } from '@zenweb/core';

export type CodeMap = { [key: string]: string };
export type ParamMap = { [key: string]: any };

export interface MessageCodeOption {
  codes?: CodeMap;
}

export class MessageCodeError extends Error {
  code: string;
  params: ParamMap;

  constructor(code: string, params?: ParamMap) {
    super(code);
    this.name = 'MessageCodeError';
    this.code = code;
    this.params = params;
  }
}

export class MessageCodeResolver {
  private _codes: CodeMap = {};

  set(code: string, message: string) {
    this._codes[code] = message;
  }

  assign(codes: CodeMap) {
    Object.assign(this._codes, codes);
  }

  get(code: string) {
    const codes = code.split('.');
    for (let i = codes.length; i > 0; i--) {
      const message = this._codes[codes.slice(0, i).join('.')];
      if (message) return message;
    }
  }

  format(code: string, params?: ParamMap) {
    const message = this.get(code);
    if (message && params) {
      return message.replace(/{(\w+)}/g, function(match, key) { 
        return typeof params[key] != 'undefined'
          ? params[key]
          : match
        ;
      });
    }
    return message || code;
  }
}

export default function setup(option?: MessageCodeOption): SetupFunction {
  return function messagecode(setup) {
    setup.debug('option: %o', option);
    const resolver = new MessageCodeResolver();
    if (option && option.codes) {
      resolver.assign(option.codes);
    }
    setup.defineCoreProperty('messageCodeResolver', { value: resolver });
    setup.defineContextProperty('messageCodeResolver', { value: resolver });
  }
}

declare module '@zenweb/core' {
  interface Core {
    messageCodeResolver: MessageCodeResolver;
  }
}

declare module 'koa' {
  interface DefaultContext {
    messageCodeResolver: MessageCodeResolver;
  }
}

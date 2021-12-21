import fs = require('fs/promises');
import { Core } from '@zenweb/core';
import Debug from 'debug';
import path = require('path');

const debug = Debug('zenweb:messagecode')

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

export function setup(core: Core, option?: MessageCodeOption) {
  const resolver = new MessageCodeResolver();
  core.setupAfter(async () => {
    for (const { name } of core.loaded) {
      try {
        var modPath = require.resolve(`${name}`);
      } catch {
        debug('can not resolve module:', name);
        continue;
      }
      const codeFile = path.join(modPath, 'message-codes.json');
      try {
        await fs.access(codeFile);
      } catch {
        continue;
      }
      try {
        var codes = JSON.parse(await fs.readFile(codeFile, { encoding: 'utf-8' }));
      } catch (e) {
        debug('load message-codes error:', e);
        continue;
      }
      resolver.assign(codes);
      debug('loaded message-codes: %s total: %d', modPath, Object.keys(codes).length);
    }
    if (option && option.codes) {
      resolver.assign(option.codes);
    } 
  });
  core.koa.context.messageCodeResolver = resolver;
  Object.defineProperty(core, 'messageCodeResolver', { value: resolver });
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

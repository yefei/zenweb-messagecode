'use strict';

class MessageCodeError extends Error {
  constructor(code, params) {
    super(code);
    this.name = 'MessageCodeError';
    this.code = code;
    this.params = params;
  }
}

class MessageCodeResolver {
  constructor() {
    this._codes = {};
  }

  /**
   * @param {string} code
   * @param {string} message
   */
  set(code, message) {
    this._codes[code] = message;
  }

  assign(codes) {
    Object.assign(this._codes, codes);
  }

  /**
   * @param {string} code
   * @returns {string}
   */
  get(code) {
    const codes = code.split('.');
    for (let i = codes.length; i > 0; i--) {
      const message = this._codes[codes.slice(0, i).join('.')];
      if (message) return message;
    }
  }

  /**
   * @param {string} code
   * @param {*} params
   * @returns {string}
   */
  format(code, params) {
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

/**
 * 安装 helper 服务
 * @param {import('@zenweb/core').Core} core
 */
function setup(core, option) {
  const resolver = new MessageCodeResolver();
  core.setupAfter(() => {
    for (const { name } of core.loaded) {
      try {
        const codes = require(`${name}/message-codes`);
        resolver.assign(codes);
      } catch (e) {
        //
      }
    }
    if (option && option.codes) {
      resolver.assign(option.codes);
    } 
  });
  Object.defineProperty(core, 'messageCodeResolver', { value: resolver });
}

module.exports = {
  setup,
  MessageCodeError,
};

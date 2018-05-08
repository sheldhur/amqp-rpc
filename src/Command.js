const assert = require('assert');

/**
 * This class is responsible for wrapping command structure for sending across queues.
 * It uses when you need to send a command request to an RPC queue in Rabbit.
 *
 * @class
 */
class Command {
  /**
   * Creates a new command instance.
   *
   * @param {String} command RPC command name
   * @param {Array<*>} args Array of arguments to provide an RPC
   * @example
   * const command = new Command('commandName', [
   *  {foo: 'bar'},
   *  [1, 2, 3]
   * ]);
   */
  constructor(command, args = []) {
    this.command = command;
    this.args = args;
  }

  /**
   * Pack a command into the buffer for sending across queues.
   *
   * @returns {Buffer}
   */
  pack() {
    return new Buffer(JSON.stringify({
      command: this.command,
      args: this.args
    }, this.constructor.replacer));
  }

  /**
   * Static helper for serialize function to string.
   *
   * @static
   * @param key
   * @param value
   * @returns {string}
   */
  static replacer(key, value) {
    if (typeof(value) === 'function') {
      return value.toString();
    }
    return value;
  }


  /**
   * Static helper for de-serialize function from string.
   *
   * @static
   * @param key
   * @param value
   * @returns {Object}
   */
  static revive(key, value) {
    if (key === '') return value;

    if (typeof value === 'string') {
      const match = value.match(/(?:function[^(]*)?\(?([^)=]+)\)?(?:\s*(?:=>)?\s*){([\s\S]+)}/);

      if (match) {
        return new Function(
          match[1].replace(/,+$/, '').split(',').map(arg => arg.replace(/\s+/, '')),
          match[2],
        );
      }
    }

    return value;
  }

  /**
   * Static helper for creating new instances of a Command.
   *
   * @static
   * @param args
   * @returns {Command}
   */
  static create(...args) {
    return new this(...args);
  }

  /**
   * Static helper for creating new Command instances.
   *
   * @static
   * @param {Buffer} buffer
   * @param {Boolean} reviveFunctions
   * @returns {Command}
   */
  static fromBuffer(buffer, reviveFunctions = false) {
    const str = buffer.toString('utf-8');
    const obj = JSON.parse(str, reviveFunctions? this.revive : null);

    assert(obj.command, 'Expect command field to be present and not false in serialized command');
    assert(typeof obj.command === 'string', 'Expect command field to be string');
    assert(obj.args, 'Expect args field to be present and not false in serialized command');
    assert(obj.args instanceof Array, 'Expect args field to be array');

    return new Command(obj.command, obj.args);
  }
}

module.exports = Command;

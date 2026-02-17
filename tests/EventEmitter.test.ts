import { EventEmitter } from '../src/core/EventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test('calls registered handler on emit', () => {
    const fn = jest.fn();
    emitter.on('test', fn);
    emitter.emit('test', { value: 1 });
    expect(fn).toHaveBeenCalledWith({ value: 1 });
  });

  test('supports multiple handlers for same event', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    emitter.on('test', fn1);
    emitter.on('test', fn2);
    emitter.emit('test');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  test('does not call handler after off()', () => {
    const fn = jest.fn();
    emitter.on('test', fn);
    emitter.off('test', fn);
    emitter.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });

  test('off() on non-existent event does not throw', () => {
    expect(() => emitter.off('nope', jest.fn())).not.toThrow();
  });

  test('emit on non-existent event does not throw', () => {
    expect(() => emitter.emit('nope')).not.toThrow();
  });

  test('clear() removes all handlers', () => {
    const fn = jest.fn();
    emitter.on('a', fn);
    emitter.on('b', fn);
    emitter.clear();
    emitter.emit('a');
    emitter.emit('b');
    expect(fn).not.toHaveBeenCalled();
  });

  test('clearEvent() removes handlers for specific event only', () => {
    const fnA = jest.fn();
    const fnB = jest.fn();
    emitter.on('a', fnA);
    emitter.on('b', fnB);
    emitter.clearEvent('a');
    emitter.emit('a');
    emitter.emit('b');
    expect(fnA).not.toHaveBeenCalled();
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  test('handler errors do not break other handlers', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const fn1 = jest.fn(() => { throw new Error('boom'); });
    const fn2 = jest.fn();
    emitter.on('test', fn1);
    emitter.on('test', fn2);
    emitter.emit('test');
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('duplicate handler registration is idempotent (Set)', () => {
    const fn = jest.fn();
    emitter.on('test', fn);
    emitter.on('test', fn);
    emitter.emit('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

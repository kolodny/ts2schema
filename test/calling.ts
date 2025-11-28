import { test } from 'node:test';
import { basename } from 'node:path';
import { strictEqual } from 'node:assert/strict';
import { generateSchemas } from '../src/index';

export const addV1 = (a: number, b: number) => a + b;
export const addV2 = ({ a, b }: { a: number; b: number }) => a + b;
export const sayHi = (name: string) => `Hi, ${name}!`;
export const sum = (s: number, ...r: number[]) => r.reduce((a, n) => a + n, s);
export const restSum = (...ns: number[]) => ns.reduce((a, n) => a + n);

test(basename(__filename), async () => {
  const fns = await import(__filename); // In an MCP this would be import tools from './tools';

  const schemas = generateSchemas(__filename);
  const tool = (name: string, args: any) => {
    const isUnary = schemas.unaryFns.includes(name);
    return isUnary ? fns[name](args) : fns[name](...Object.values(args).flat());
  };

  strictEqual(tool('addV1', { a: 4, b: 5 }), 9);
  strictEqual(tool('addV2', { a: 4, b: 5 }), 9);
  strictEqual(tool('sayHi', { name: 'Bob' }), 'Hi, Bob!');
  strictEqual(tool('sum', { s: 1, r: [2, 3, 4, 5] }), 15);
  strictEqual(tool('restSum', { arg0: [1, 2, 3, 4, 5] }), 15);
});

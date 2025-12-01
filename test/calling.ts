import { test } from 'node:test';
import { basename } from 'node:path';
import { strictEqual } from 'node:assert/strict';
import { generateSchemas } from '../src/index';

export const addV1 = (a: number, b: number) => a + b;
export const addV2 = ({ a, b }: { a: number; b: number }) => a + b;
export const sayHi = (name: string) => `Hi, ${name}!`;
export const sum = (s: number, ...r: number[]) => r.reduce((a, n) => a + n, s);
export const restSum = (...ns: number[]) => ns.reduce((a, n) => a + n);
export const concat = (a: string, b: string) => a + b;

test(basename(__filename), async () => {
  const fns = await import(__filename); // In an MCP this would be import tools from './tools';

  const schemas = generateSchemas(__filename);
  const tool = (name: string, params: any) => {
    const isUnary = schemas.unaryFns.includes(name);
    if (isUnary) return fns[name](params);
    const args: Record<string, any> = {};
    const schema = schemas.fns[name];
    const p = schema.properties?.['params'];
    const props = typeof p === 'object' ? p['properties'] : {};

    for (const key of Object.keys(props ?? {})) args[key] = params[key];

    return fns[name](...Object.values(args).flat());
  };

  strictEqual(tool('addV1', { a: 4, b: 5 }), 9);
  strictEqual(tool('addV2', { a: 4, b: 5 }), 9);
  strictEqual(tool('sayHi', { name: 'Bob' }), 'Hi, Bob!');
  strictEqual(tool('sum', { s: 1, r: [2, 3, 4, 5] }), 15);
  strictEqual(tool('restSum', { arg0: [1, 2, 3, 4, 5] }), 15);
  strictEqual(tool('concat', { a: 'Hello, ', b: 'world!' }), 'Hello, world!');
  strictEqual(tool('concat', { b: 'world!', a: 'Hello, ' }), 'Hello, world!');
});

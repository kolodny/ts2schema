import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

type DeepPartialCheck = <T>(a: T, b: Partial<T>) => void;
const deepPartialCheck = assert.partialDeepStrictEqual as DeepPartialCheck;

export const sum = (s: number, ...r: number[]) => r.reduce((a, n) => a + n, s);

test(basename(__filename), async () => {
  const schemas = generateSchemas(__filename);

  assert.deepStrictEqual(schemas.unaryFns, []);
  assert.deepStrictEqual(schemas.nonFns, {});
  deepPartialCheck(schemas, {
    fns: {
      sum: {
        type: 'object',
        properties: {
          params: {
            properties: {
              s: { type: 'number' },
              r: { type: 'array', items: { type: 'number' } },
            },
            required: ['s', 'r'],
          },
          result: { type: 'number' },
        },
        additionalProperties: false,
      },
    },
  });
});

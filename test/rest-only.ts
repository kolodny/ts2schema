import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

type DeepPartialCheck = <T>(a: T, b: Partial<T>) => void;
const deepPartialCheck = assert.partialDeepStrictEqual as DeepPartialCheck;

export const sum = (...ns: number[]) => ns.reduce((a, n) => a + n);

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
            properties: { arg0: { type: 'array', items: { type: 'number' } } },
            required: ['arg0'],
          },
          result: { type: 'number' },
        },
        additionalProperties: false,
      },
    },
  });
});

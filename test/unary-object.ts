import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

type DeepPartialCheck = <T>(a: T, b: Partial<T>) => void;
const deepPartialCheck = assert.partialDeepStrictEqual as DeepPartialCheck;

export const add = ({ a, b }: { a: number; b: number }) => a + b;

test(basename(__filename), async () => {
  const schemas = generateSchemas(__filename);

  assert.deepStrictEqual(schemas.unaryFns, ['add']);
  assert.deepStrictEqual(schemas.nonFns, {});
  deepPartialCheck(schemas, {
    fns: {
      add: {
        type: 'object',
        properties: {
          params: {
            type: 'object',
            properties: { a: { type: 'number' }, b: { type: 'number' } },
            required: ['a', 'b'],
          },
          result: { type: 'number' },
        },
        additionalProperties: false,
      },
    },
    unaryFns: ['add'],
  });
});

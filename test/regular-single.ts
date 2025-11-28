import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

type DeepPartialCheck = <T>(a: T, b: Partial<T>) => void;
const deepPartialCheck = assert.partialDeepStrictEqual as DeepPartialCheck;

export const sayHi = (name: string) => `Hi, ${name}!`;

test(basename(__filename), async () => {
  const schemas = generateSchemas(__filename);

  assert.deepStrictEqual(schemas.unaryFns, []);
  assert.deepStrictEqual(schemas.nonFns, {});
  deepPartialCheck(schemas, {
    fns: {
      sayHi: {
        type: 'object',
        properties: {
          params: {
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
          result: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  });
});

import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

type DeepPartialCheck = <T>(a: T, b: Partial<T>) => void;
const deepPartialCheck = assert.partialDeepStrictEqual as DeepPartialCheck;

export const testUserName = 'testUser';

test(basename(__filename), async () => {
  const schemas = generateSchemas(__filename);

  assert.deepStrictEqual(schemas.fns, {});
  assert.deepStrictEqual(schemas.unaryFns, []);
  deepPartialCheck(schemas, {
    nonFns: {
      testUserName: { type: 'string' },
    },
  });
});

import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

type DeepPartialCheck = <T>(a: T, b: Partial<T>) => void;
const deepPartialCheck = assert.partialDeepStrictEqual as DeepPartialCheck;

export const add = () => {};

test(basename(__filename), async () => {
  const schemas = generateSchemas(__filename);

  assert.deepStrictEqual(schemas.unaryFns, []);
  assert.deepStrictEqual(schemas.nonFns, {});
  assert.deepStrictEqual(schemas.fns['add'].properties?.result, undefined);
});

import { test } from 'node:test';
import { basename } from 'node:path';
import assert from 'node:assert/strict';
import { generateSchemas } from '../src/index';

export const noParams = () => `Hello`;

test(basename(__filename), async () => {
  const schemas = generateSchemas(__filename);

  assert.deepStrictEqual(schemas.unaryFns, []);
  assert.deepStrictEqual(schemas.nonFns, {});
  assert.deepEqual(schemas.fns['noParams'], {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      result: {
        type: 'string',
      },
    },
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#',
  });
});

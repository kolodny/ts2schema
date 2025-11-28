# ts2schema

Generate JSON Schema from TypeScript exports using `typescript-json-schema`

## Installation

```bash
npm install ts2schema
```

## Usage

```typescript
// file.ts

export const testUserId = 123;

/** add number */
export const add = async (num1: number, num2?: number) => num1 + (num2 ?? 0);

/** say hi to user */
export const sayHi = (name: string) => `Hi, ${name}`;

export const makeUser = (user: {
  /** Name of user */ name: string;
  /** Age of user */ age?: number;
}) => user;
```

```typescript
import { generateSchemas } from 'ts2schema';
const schemas = generateSchemas('absolute/path/to/your/file.ts');
console.log(schemas);

/* Logs:
{
  nonFns: {
    testUserId: {
      type: 'number',
      enum: [123],
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
  },
  unaryFns: ['makeUser'],
  fns: {
    add: {
      type: 'object',
      properties: {
        params: {
          type: 'object',
          properties: {
            num1: { type: 'number', title: 'num1' },
            num2: { type: 'number', title: 'num2' },
          },
          required: ['num1'],
        },
        result: { type: 'number' },
      },
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
    makeUser: {
      type: 'object',
      properties: {
        params: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name of user' },
            age: { type: 'number', description: 'Age of user' },
          },
          additionalProperties: false,
          required: ['name'],
          title: 'user',
        },
        result: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name of user' },
            age: { type: 'number', description: 'Age of user' },
          },
          additionalProperties: false,
          required: ['name'],
        },
      },
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
    sayHi: {
      type: 'object',
      properties: {
        params: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'name' },
          },
          required: ['name'],
        },
        result: { type: 'string' },
      },
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
  }
}
*/
```

The `unaryFns` values are to track the "flavor" of a function. Consider these functions which wind up with similar params schemas:

```typescript
export const addV1 = (a: number, b: number) => a + b;
export const addV2 = ({ a, b }: { a: number; b: number }) => a + b;

export const sayHiV1 = (name: string) => `Hi, ${name}`;
export const sayHiV2 = ({ name }: { name: string }) => `Hi, ${name}`;
```

The `unaryFns` will be `['addV2', 'sayHiV2']`. This let's us know how to invoke the functions. See [this test](./test//calling.ts#L16-L19) for an example.

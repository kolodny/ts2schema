# ts2schema

Generate JSON Schema from exported functions using `typescript-json-schema`

## Installation

```bash
npm install ts2schema
```

## Usage

```typescript
// file.ts

/** Add two numbers */
export const add = async (params: { num1: number; num2: number }) => {
  return params.num1 + params.num2;
};
```

```typescript
import { generateSchemas } from 'ts2schema';
const schemas = generateSchemas(['absolute/path/to/your/file.ts'], {
  /* additional settings */
});
console.log(schemas);

/* Logs:
{
  Fns: {
    description: 'Add two numbers',
    type: 'object',
    properties: {
      add: {
        type: 'object',
        properties: {
          params: {
            type: 'object',
            properties: {
              num1: { type: 'number' },
              num2: { type: 'number' },
            },
            additionalProperties: false,
            required: ['num1', 'num2'],
          },
          result: { type: 'number' },
        },
        additionalProperties: false,
      },
    },
  },
}
*/
```

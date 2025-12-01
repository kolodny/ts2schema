import * as path from 'node:path';
import * as TJS from 'typescript-json-schema';
import type { JSONSchema4, JSONSchema7 } from 'json-schema';

const { ts } = TJS;

const defaultSettings: TJS.PartialArgs = {
  ...{ required: true, ref: true },
  ...{ noExtraProps: true, constAsEnum: true, ignoreErrors: true },
};
export const extractor = (fns?: string[], nonFns?: string[]) => {
  const prefix = `type Fn<F> = F extends (...args: infer A) => infer R ? { params?: A; result?: Awaited<R> } : never;\n`;
  const split1 = fns?.map((e) => `type ${e} = Fn<typeof imported.${e}>;`) || [];
  const split2 = nonFns?.map((e) => `type ${e} = typeof imported.${e};`) || [];
  return [prefix, ...split1, ...split2].join('\n');
};

const force = <T>(o: T) => (o || {}) as Extract<NonNullable<T>, object>;
const mapToString = (v: unknown) => `${v}`;

export const generateSchemas = (
  file: string,
  info?: {
    settings?: TJS.PartialArgs;
    extractor?: (fns?: string[], nonFns?: string[]) => string;
    cwd?: string;
    tsconfig?: TJS.CompilerOptions;
  }
) => {
  const settings = info?.settings || defaultSettings;
  const cwd = info?.cwd || process.cwd();
  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists)!;
  if (!configPath) throw new Error(`No valid tsconfig.json for ${cwd}`);
  const dir = path.dirname(configPath);
  let tsconfig = info?.tsconfig;
  if (!tsconfig) {
    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    tsconfig = ts.parseJsonConfigFileContent(config, ts.sys, dir).options;
  }

  const programWithVirtualFile = (contents: string) => {
    const customHost = ts.createCompilerHost(tsconfig);
    const getSourceFile = customHost.getSourceFile;

    const vFile = `virtual-${Math.random().toString(36).slice(2)}.ts`;
    const relativeFile = path.relative(cwd, file);
    const vContents = `import * as imported from './${relativeFile}';\n${contents}`;

    customHost.getSourceFile = (file, version, onError, create) => {
      if (file === vFile) return ts.createSourceFile(file, vContents, version);
      return getSourceFile.call(customHost, file, version, onError, create);
    };

    return ts.createProgram([vFile], tsconfig, customHost);
  };

  const getInfo = `
    type GetFns<T> = { [K in keyof T]: T[K] extends Function ? K : never; }[keyof T];
    type FnKeys = GetFns<typeof imported>;
    type NonFnKeys = Exclude<keyof typeof imported, FnKeys>;
    export type Info = { fns: FnKeys; nonFns: NonFnKeys; };
  `;
  const infoProgram = programWithVirtualFile(getInfo);
  const infoSettings = { ...settings, ref: false };
  const infoSchema = TJS.generateSchema(infoProgram, 'Info', infoSettings);
  const properties = infoSchema?.properties;
  const fns = force(properties?.['fns']).enum?.map(mapToString);
  const nonFns = force(properties?.['nonFns']).enum?.map(mapToString);

  const extractContents = (info?.extractor || extractor)(fns, nonFns);
  const pro = programWithVirtualFile(extractContents);
  const generator = TJS.buildGenerator(pro, settings)!;
  const getSchema = (id: string) => {
    return TJS.generateSchema(pro, id, settings, [], generator) as JSONSchema4;
  };
  type Schemas = Record<string, JSONSchema7>;
  const fnSchemas: Schemas = {};
  const unaryFns: string[] = [];
  for (const fn of fns ?? []) {
    const def = getSchema(fn);
    const props = def.properties!;

    const {
      minItems,
      maxItems,
      items: _items,
      additionalItems: rest,
    } = props['params']!;
    const required: string[] = (props['params']!.required = []);

    const items = (Array.isArray(_items) ? _items : [_items]).map(force);
    const first = items?.[0];

    if (minItems === maxItems && minItems === 1 && first?.type === 'object') {
      props['params'] = items?.[0]!;
      required.push(...(Array.isArray(first.required) ? first.required : []));
      unaryFns.push(fn);
    } else {
      props['params'] = {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      };
      for (const [index, item] of Object.entries(items)) {
        if (!item.type) continue;
        if (!item.title) {
          const title = `arg${index}`;
          props['params'].properties![title] = { type: 'array', items: item };
          required.push(title);
        } else {
          const title = item.title || `arg${index}`;
          props['params'].properties![title] = item;
          if (+index < minItems!) required!.push(title);
        }
      }
      if (rest) {
        const title = force(rest)?.title || 'rest';
        const value = { type: 'array' as const, items: force(rest) };
        props['params'].properties![force(rest)?.title || 'rest'] = value;
        required.push(title);
      }
    }
    props['params'].required = required;
    fnSchemas[fn] = def as JSONSchema7;
  }
  const nonFnSchemas: Schemas = {};
  for (const nonFn of nonFns ?? []) {
    nonFnSchemas[nonFn] = getSchema(nonFn) as JSONSchema7;
  }
  return { fns: fnSchemas, unaryFns, nonFns: nonFnSchemas };
};

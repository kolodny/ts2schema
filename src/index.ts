import * as path from 'node:path';
import * as TJS from 'typescript-json-schema';
import ts from 'typescript-json-schema/node_modules/typescript';

const defaultSettings: TJS.PartialArgs = {
  ...{ required: true, ref: true },
  ...{ noExtraProps: true, constAsEnum: true, ignoreErrors: true },
};

export const extractor = `
  import * as imported from '{IMPORTED}';

  type Fn<T> = T extends (params: infer P) => infer R ? { params?: P, result?: Awaited<R> } : never;
  export type Fns = { [K in keyof typeof imported]?: Fn<(typeof imported)[K]>; };

  type BadFn<T> = T extends (params: any) => any ? never : T;
  export type BadFns = { [K in keyof typeof imported as BadFn<(typeof imported)[K]> extends never ? never : K]: BadFn<(typeof imported)[K]> };
`;

const isExported = (symbol: ts.Symbol) => {
  return symbol.declarations?.some((d) => {
    const { ExportKeyword, ExportAssignment } = ts.SyntaxKind;
    if (ts.canHaveModifiers(d)) {
      return ts.getModifiers(d)?.some((m) => m.kind === ExportKeyword);
    }

    const parent = d.parent;
    return ts.isExportDeclaration(parent) || parent.kind === ExportAssignment;
  });
};

export const exportSchema = (
  file: string,
  info: { settings?: TJS.PartialArgs; extractor?: string; cwd?: string }
) => {
  const settings = info.settings || defaultSettings;
  const cwd = info.cwd || process.cwd();
  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists)!;
  const dir = path.dirname(configPath);
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, dir);

  const customHost = ts.createCompilerHost(options);
  const getSourceFile = customHost.getSourceFile;

  const vFile = `virtual-${Math.random().toString(36).slice(2)}.ts`;
  const relativeFile = path.relative(cwd, file);
  const extract = info.extractor || extractor;
  const vContents = extract.replace('{IMPORTED}', `./${relativeFile}`);

  customHost.getSourceFile = (file, version, onError, create) => {
    if (file === vFile) return ts.createSourceFile(file, vContents, version);
    return getSourceFile.call(customHost, file, version, onError, create);
  };

  const program = ts.createProgram([vFile], options, customHost);
  const generator = TJS.buildGenerator(program, settings);

  const mainSymbols = generator?.getMainFileSymbols(program);
  const get = generator?.getSymbols.bind(generator);
  const exported = mainSymbols?.filter((s) => isExported(get?.(s)[0]?.symbol!));

  const generate = TJS.generateSchema.bind(TJS);

  const entries = exported?.map((n) => [n, generate(program, n, settings)]);
  return Object.fromEntries(entries || []);
};

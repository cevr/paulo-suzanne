import type { Plugin } from '#oxlint/plugins';

interface AstNode {
  readonly type: string;
  readonly [key: string]: unknown;
}

const isAstNode = (value: unknown): value is AstNode => {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  return typeof (value as Record<string, unknown>).type === 'string';
};

const getStringField = (node: AstNode, field: string): string | undefined => {
  const value = node[field];
  return typeof value === 'string' ? value : undefined;
};

const getNodeField = (node: AstNode, field: string): AstNode | undefined => {
  const value = node[field];
  return isAstNode(value) ? value : undefined;
};

const isTestFilename = (filename: string): boolean =>
  /\/tests\//.test(filename) || /\.test\.tsx?$/.test(filename);

const PROMISE_CHAIN_METHODS = new Set(['then', 'catch', 'finally']);
const PROMISE_STATIC_METHODS = new Set(['all', 'allSettled', 'any', 'race', 'resolve', 'reject']);

const promiseChainMethodName = (node: AstNode): string | undefined => {
  if (node.type !== 'CallExpression') return undefined;
  const callee = getNodeField(node, 'callee');
  if (callee?.type !== 'MemberExpression') return undefined;
  const object = getNodeField(callee, 'object');
  if (object?.type === 'Identifier' && getStringField(object, 'name') === 'Effect') {
    return undefined;
  }
  const property = getNodeField(callee, 'property');
  if (property?.type !== 'Identifier') return undefined;
  const name = getStringField(property, 'name');
  return name !== undefined && PROMISE_CHAIN_METHODS.has(name) ? name : undefined;
};

const promiseStaticMethodName = (node: AstNode): string | undefined => {
  if (node.type !== 'CallExpression') return undefined;
  const callee = getNodeField(node, 'callee');
  if (callee?.type !== 'MemberExpression') return undefined;
  const object = getNodeField(callee, 'object');
  if (object?.type !== 'Identifier' || getStringField(object, 'name') !== 'Promise') {
    return undefined;
  }
  const property = getNodeField(callee, 'property');
  if (property?.type !== 'Identifier') return undefined;
  const name = getStringField(property, 'name');
  return name !== undefined && PROMISE_STATIC_METHODS.has(name) ? name : undefined;
};

const isPromiseConstructor = (node: AstNode): boolean => {
  if (node.type !== 'NewExpression') return false;
  const callee = getNodeField(node, 'callee');
  return callee?.type === 'Identifier' && getStringField(callee, 'name') === 'Promise';
};

const plugin: Plugin = {
  meta: {
    name: 'paulo-suzanne',
  },
  rules: {
    'no-promise-control-flow-in-tests': {
      create(context) {
        if (!isTestFilename(context.filename)) return {};

        return {
          TryStatement(node) {
            if (node.finalizer == null) return;
            context.report({
              message:
                'Do not use try/finally cleanup in tests. Use effect-bun-test with it.scopedLive, FileSystem.makeTempDirectoryScoped, or Effect.acquireRelease.',
              node,
            });
          },
          FunctionDeclaration(node) {
            if (node.async !== true) return;
            context.report({
              message:
                'Do not use async test functions. Import it from effect-bun-test and return an Effect.',
              node,
            });
          },
          FunctionExpression(node) {
            if (node.async !== true) return;
            context.report({
              message:
                'Do not use async test functions. Import it from effect-bun-test and return an Effect.',
              node,
            });
          },
          ArrowFunctionExpression(node) {
            if (node.async !== true) return;
            context.report({
              message:
                'Do not use async test functions. Import it from effect-bun-test and return an Effect.',
              node,
            });
          },
          AwaitExpression(node) {
            context.report({
              message:
                'Do not use await in tests. Use yield* inside Effect.gen and Effect.promise only at real async boundaries.',
              node,
            });
          },
          CallExpression(node) {
            if (!isAstNode(node)) return;
            const method = promiseChainMethodName(node);
            if (method !== undefined) {
              context.report({
                message: `Do not use Promise-chain .${method}(...) control flow in tests. Use Effect composition.`,
                node,
              });
              return;
            }
            const staticMethod = promiseStaticMethodName(node);
            if (staticMethod === undefined) return;
            context.report({
              message: `Do not use Promise.${staticMethod}(...) in tests. Use Effect.all, Effect.succeed, Effect.fail, or Deferred.`,
              node,
            });
          },
          NewExpression(node) {
            if (!isAstNode(node) || !isPromiseConstructor(node)) return;
            context.report({
              message:
                'Do not construct raw Promises in tests. Use Deferred, Effect.async, or Effect.promise at a real boundary.',
              node,
            });
          },
        };
      },
    },
  },
};

export default plugin;

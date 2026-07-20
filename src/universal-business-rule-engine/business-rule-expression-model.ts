/**
 * Universal Business Rule Engine V1 — safe serializable expression model.
 *
 * No arbitrary code execution: expressions are data (a closed AST), evaluated
 * only by the deterministic evaluation engine against a closed operator registry.
 */

export type RuleLiteralValue = string | number | boolean | null;

export type RuleExpression =
  | { readonly kind: 'literal'; readonly value: RuleLiteralValue }
  | { readonly kind: 'input'; readonly name: string }
  | { readonly kind: 'collection-input'; readonly name: string }
  | { readonly kind: 'op'; readonly op: string; readonly args: readonly RuleExpression[] }
  | {
      readonly kind: 'aggregate';
      readonly op: string;
      readonly collection: RuleExpression;
      readonly projection?: string;
    }
  | {
      readonly kind: 'conditional';
      readonly condition: RuleExpression;
      readonly whenTrue: RuleExpression;
      readonly whenFalse: RuleExpression;
    }
  | { readonly kind: 'safe-function'; readonly functionId: string; readonly args: readonly RuleExpression[] };

export function serializeRuleExpression(expression: RuleExpression): string {
  return JSON.stringify(expression);
}

export function deserializeRuleExpression(serialized: string): RuleExpression {
  return JSON.parse(serialized) as RuleExpression;
}

/** Collects input names referenced anywhere in the expression tree. */
export function collectExpressionInputs(expression: RuleExpression): string[] {
  const inputs = new Set<string>();
  const walk = (node: RuleExpression): void => {
    switch (node.kind) {
      case 'input':
      case 'collection-input':
        inputs.add(node.name);
        return;
      case 'op':
      case 'safe-function':
        node.args.forEach(walk);
        return;
      case 'aggregate':
        walk(node.collection);
        return;
      case 'conditional':
        walk(node.condition);
        walk(node.whenTrue);
        walk(node.whenFalse);
        return;
      case 'literal':
        return;
    }
  };
  walk(expression);
  return [...inputs];
}

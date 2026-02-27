'use strict';

/**
 * Safe shim for jsonpath replacing the CVE-affected jsonpath@1.2.1.
 * Implements only the subset of the API used by bfj (parse function).
 * Does NOT use vulnerable regex patterns from the original package.
 */

function parse(pathExpression) {
  if (typeof pathExpression !== 'string' || pathExpression.length === 0) {
    throw new Error('jsonpath: path expression must be a non-empty string');
  }

  const result = [];
  let i = 0;
  const len = pathExpression.length;

  function parseIdentifier(start) {
    let end = start;
    while (end < len && pathExpression[end] !== '.' && pathExpression[end] !== '[') {
      end++;
    }
    return pathExpression.slice(start, end);
  }

  if (pathExpression[i] !== '$') {
    throw new Error('jsonpath: path must start with $');
  }

  result.push({ expression: { type: 'root', value: '$' }, operation: 'member', scope: 'child' });
  i++;

  while (i < len) {
    const ch = pathExpression[i];

    if (ch === '.') {
      i++;
      if (i >= len) break;

      if (pathExpression[i] === '.') {
        i++;
        const id = parseIdentifier(i);
        i += id.length;
        result.push({
          expression: { type: 'identifier', value: id },
          operation: 'member',
          scope: 'descendant',
        });
      } else if (pathExpression[i] === '*') {
        i++;
        result.push({
          expression: { type: 'wildcard', value: '*' },
          operation: 'member',
          scope: 'child',
        });
      } else {
        const id = parseIdentifier(i);
        if (id.length === 0) {
          throw new Error('jsonpath: expected identifier after dot');
        }
        i += id.length;
        result.push({
          expression: { type: 'identifier', value: id },
          operation: 'member',
          scope: 'child',
        });
      }
    } else if (ch === '[') {
      i++;
      if (i >= len) throw new Error('jsonpath: unexpected end in subscript');

      if (pathExpression[i] === '*') {
        i++;
        if (pathExpression[i] !== ']') throw new Error('jsonpath: expected ] after *');
        i++;
        result.push({
          expression: { type: 'wildcard', value: '*' },
          operation: 'subscript',
          scope: 'child',
        });
      } else if (pathExpression[i] === '"' || pathExpression[i] === "'") {
        const quote = pathExpression[i];
        i++;
        const start = i;
        while (i < len && pathExpression[i] !== quote) {
          if (pathExpression[i] === '\\') i++;
          i++;
        }
        const value = pathExpression.slice(start, i);
        i++;
        if (pathExpression[i] !== ']') throw new Error('jsonpath: expected ] after string');
        i++;
        result.push({
          expression: { type: 'string_literal', value },
          operation: 'subscript',
          scope: 'child',
        });
      } else if (pathExpression[i] === '-' || (pathExpression[i] >= '0' && pathExpression[i] <= '9')) {
        const start = i;
        if (pathExpression[i] === '-') i++;
        while (i < len && pathExpression[i] >= '0' && pathExpression[i] <= '9') {
          i++;
        }
        const value = parseInt(pathExpression.slice(start, i), 10);
        if (pathExpression[i] !== ']') throw new Error('jsonpath: expected ] after number');
        i++;
        result.push({
          expression: { type: 'numeric_literal', value },
          operation: 'subscript',
          scope: 'child',
        });
      } else {
        const start = i;
        while (i < len && pathExpression[i] !== ']') {
          i++;
        }
        const value = pathExpression.slice(start, i);
        i++;
        result.push({
          expression: { type: 'identifier', value },
          operation: 'subscript',
          scope: 'child',
        });
      }
    } else {
      throw new Error('jsonpath: unexpected character: ' + ch);
    }
  }

  return result;
}

function query() {
  throw new Error('jsonpath shim: query() is not implemented');
}

function value() {
  throw new Error('jsonpath shim: value() is not implemented');
}

module.exports = { parse, query, value };

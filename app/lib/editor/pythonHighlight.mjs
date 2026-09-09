const KEYWORDS = new Set([
  "and", "as", "assert", "async", "await", "break", "case", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "match", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
]);

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function span(kind, value) {
  return `<span class="token-${kind}">${escapeHtml(value)}</span>`;
}

export function highlightPython(source) {
  let output = "";
  let index = 0;
  let previousSignificant = "";
  while (index < source.length) {
    if (source[index] === "#") {
      const end = source.indexOf("\n", index);
      const value = source.slice(index, end === -1 ? source.length : end);
      output += span("comment", value);
      index += value.length;
      continue;
    }
    if (source.startsWith('"""', index) || source.startsWith("'''", index)) {
      const quote = source.slice(index, index + 3);
      const end = source.indexOf(quote, index + 3);
      const value = source.slice(index, end === -1 ? source.length : end + 3);
      output += span("string", value);
      index += value.length;
      previousSignificant = "string";
      continue;
    }
    if (source[index] === '"' || source[index] === "'") {
      const quote = source[index];
      let end = index + 1;
      while (end < source.length) {
        if (source[end] === "\\") { end += 2; continue; }
        if (source[end] === quote) { end += 1; break; }
        end += 1;
      }
      const value = source.slice(index, end);
      output += span("string", value);
      index = end;
      previousSignificant = "string";
      continue;
    }
    const number = source.slice(index).match(/^(?:0[bBoOxX][\da-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?)/)?.[0];
    if (number) {
      output += span("number", number);
      index += number.length;
      previousSignificant = "number";
      continue;
    }
    const identifier = source.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0];
    if (identifier) {
      const after = source.slice(index + identifier.length).match(/^\s*\(/);
      const kind = KEYWORDS.has(identifier) ? "keyword" : previousSignificant === "." ? "attribute" : after ? "function" : "identifier";
      output += span(kind, identifier);
      index += identifier.length;
      previousSignificant = kind;
      continue;
    }
    const char = source[index];
    output += escapeHtml(char);
    if (!/\s/.test(char)) previousSignificant = char;
    index += 1;
  }
  return output;
}

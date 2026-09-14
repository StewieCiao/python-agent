"use client";

import { useState } from "react";
import { staticDiagnostics } from "../lib/editor/staticDiagnostics.mjs";

export function StaticFeedback({ code }: { code: string }) {
  const [checked, setChecked] = useState<string | null>(null);
  const findings = checked === null ? [] : staticDiagnostics(checked);
  return <section className="output-block" aria-label="静态检查">
    <button type="button" onClick={() => setChecked(code)}>静态检查（不运行）</button>
    <p>只检查已覆盖的语法结构，不验证运行结果，也不自动完成课程。</p>
    <div aria-live="polite">
      {checked !== null && (checked !== code
        ? <p>代码已修改，静态检查结果已过期，请重新检查。</p>
        : findings.length === 0
          ? <p>未发现已覆盖的常见问题，未运行代码。</p>
          : findings.map((item) => <div key={`${item.line}:${item.column}`}>
            <p>来源：静态分析 · 严重程度：提示 · 第 {item.line} 行，第 {item.column} 列</p>
            <p>{item.reason}</p><p>下一步：{item.nextStep}</p>
          </div>))}
    </div>
  </section>;
}

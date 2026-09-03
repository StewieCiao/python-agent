export type LessonTest = {
  name: string;
  expression: string;
  failure: string;
  kind?: "behavior" | "structure";
  feedback?: {
    expected: string;
    actualLine?: number;
    actualExpression?: string;
    rule: string;
  };
};

export type Lesson = {
  id: string;
  familyId?: string;
  module:
    | "Python 起步"
    | "Python 工程能力"
    | "Python 综合训练"
    | "Agent 核心范式"
    | "Agent 系统能力"
    | "Agent 案例实战";
  number: number;
  title: string;
  kicker: string;
  minutes: number;
  goal: string;
  concepts: Array<{ title: string; body: string; example: string }>;
  requirements: string[];
  starterCode: string;
  hints: string[];
  tests: LessonTest[];
  project?: boolean;
  source?: { label: string; url: string };
};

export const MODULE_ORDER = [
  "Python 起步",
  "Python 工程能力",
  "Python 综合训练",
  "Agent 核心范式",
  "Agent 系统能力",
  "Agent 案例实战",
] as const;

const HELLO_AGENTS_REPO = "https://github.com/datawhalechina/hello-agents";
const HELLO_AGENTS_CHAPTER_4 = `${HELLO_AGENTS_REPO}/blob/main/docs/chapter4/%E7%AC%AC%E5%9B%9B%E7%AB%A0%20%E6%99%BA%E8%83%BD%E4%BD%93%E7%BB%8F%E5%85%B8%E8%8C%83%E5%BC%8F%E6%9E%84%E5%BB%BA.md`;
const HELLO_AGENTS_CHAPTER_7 = `${HELLO_AGENTS_REPO}/blob/main/docs/chapter7/%E7%AC%AC%E4%B8%83%E7%AB%A0%20%E6%9E%84%E5%BB%BA%E4%BD%A0%E7%9A%84Agent%E6%A1%86%E6%9E%B6.md`;
const HELLO_AGENTS_CHAPTER_8 = `${HELLO_AGENTS_REPO}/blob/main/docs/chapter8/%E7%AC%AC%E5%85%AB%E7%AB%A0%20%E8%AE%B0%E5%BF%86%E4%B8%8E%E6%A3%80%E7%B4%A2.md`;
const HELLO_AGENTS_CHAPTER_14 = `${HELLO_AGENTS_REPO}/blob/main/docs/chapter14/Chapter14-Automated-Deep-Research-Agent.md`;

export const lessons: Lesson[] = [
  {
    id: "first-output",
    module: "Python 起步",
    number: 1,
    title: "让 Python 开口",
    kicker: "输出与表达式",
    minutes: 8,
    goal: "理解代码从上到下执行，并用 print() 输出计算结果。",
    concepts: [
      {
        title: "print() 是你的观察窗口",
        body: "括号里的值会被输出。先让程序可观察，再判断它是否按预期工作。",
        example: 'print("你好，Python")',
      },
      {
        title: "表达式会先计算",
        body: "Python 会先算出括号中的表达式，再把结果交给 print。",
        example: "print(7 * 6)",
      },
    ],
    requirements: [
      "第一行输出“我的第一段 Python”；中英文之间有无空格都可以",
      "第二个 print() 的括号中直接写乘法表达式并输出 56；8*7、7*8，以及运算符两侧加空格都可以",
    ],
    starterCode: '# 在这里写下你的第一段代码\nprint("你好，Python")\n',
    hints: ["需要调用两次 print()。", "乘法运算符是 *，不要手算后直接写 56。"],
    tests: [
      {
        name: "第一行文字正确（忽略空格）",
        expression: `len(_output_lines) >= 1 and _normalize_python_label(_output_lines[0]) == "我的第一段Python"`,
        failure: "第一行的文字内容应为“我的第一段 Python”；中英文之间有无空格都可以。",
        feedback: {
          expected: "我的第一段 Python",
          actualLine: 0,
          rule: "只忽略中文与 Python 之间的空格",
        },
      },
      {
        name: "第二行输出 56",
        expression: `len(_output_lines) >= 2 and _output_lines[1].strip() == "56"`,
        failure: "第二行应输出 56。",
        feedback: {
          expected: "56",
          actualLine: 1,
          rule: "检查真实标准输出的第二行",
        },
      },
      {
        name: "乘法写在第二个 print 中",
        expression: `_second_print_uses_multiplication(_source)`,
        failure: "请在第二个 print() 的括号中直接写乘法表达式。",
        kind: "structure",
        feedback: {
          expected: "第二个 print 的参数表达式包含 *",
          actualExpression: `_second_print_uses_multiplication(_source)`,
          rule: "AST 只检查第二个 print 的参数；其他位置出现乘法不计入",
        },
      },
    ],
  },
  {
    id: "variables",
    module: "Python 起步",
    number: 2,
    title: "给数据起名字",
    kicker: "变量与类型",
    minutes: 10,
    goal: "用变量保存字符串和数字，并组合出可读的输出。",
    concepts: [
      {
        title: "变量是名字，不是盒子",
        body: "赋值让一个名字指向某个值。好名字能让代码直接表达意图。",
        example: 'course = "Python"\nlessons = 15',
      },
      {
        title: "f-string 组合文本",
        body: "在字符串前加 f，就能用花括号插入变量。",
        example: 'print(f"{course} 有 {lessons} 关")',
      },
    ],
    requirements: ["创建变量 name，值为“小派”", "创建变量 level，值为 1", "输出：小派正在挑战第 1 关"],
    starterCode: 'name = ""\nlevel = 0\n\nprint()\n',
    hints: ["字符串需要引号，数字不需要。", '试试：print(f"{name}正在挑战第 {level} 关")，留意文字中的空格。'],
    tests: [
      {
        name: "name 保存正确",
        expression: `name == "小派"`,
        failure: "变量 name 应保存字符串“小派”。",
        feedback: {
          expected: "'小派'",
          actualExpression: "name",
          rule: "检查变量 name 的真实值",
        },
      },
      {
        name: "level 是数字 1",
        expression: `level == 1 and isinstance(level, int)`,
        failure: "level 应是整数 1，而不是字符串。",
        feedback: {
          expected: "1（int）",
          actualExpression: `(level, type(level).__name__)`,
          rule: "值和类型都必须正确",
        },
      },
      {
        name: "输出完全匹配",
        expression: `_stdout.strip() == "小派正在挑战第 1 关"`,
        failure: "输出应为“小派正在挑战第 1 关”，请检查空格。",
        feedback: {
          expected: "小派正在挑战第 1 关",
          actualLine: 0,
          rule: "检查去除首尾空白后的完整输出",
        },
      },
    ],
  },
  {
    id: "strings",
    module: "Python 起步",
    number: 3,
    title: "处理真实文本",
    kicker: "字符串方法",
    minutes: 12,
    goal: "把文本清理规则封装成可复用函数。",
    concepts: [
      {
        title: "方法是值自带的工具",
        body: "字符串方法会返回新字符串，不会悄悄修改原值。",
        example: 'clean = raw.strip().lower()',
      },
      {
        title: "切片提取片段",
        body: "text[start:end] 包含 start，不包含 end。",
        example: 'word = "python"\nprint(word[:3])  # pyt',
      },
    ],
    requirements: ["实现 normalize_title(text)", "返回去除两端空格并转为小写的新字符串", "不要在函数内 print"],
    starterCode: "def normalize_title(text):\n    # 返回清理后的新字符串\n    pass\n",
    hints: ["可以连续调用 .strip().lower()。", "直接 return 清理结果，不需要额外变量。"],
    tests: [
      {
        name: "混合大小写与中文",
        expression: `_silent_call(normalize_title, "  PyThOn 学习  ") == ("python 学习", "")`,
        failure: "应同时去掉两端空格、转为小写，并且不打印。",
        feedback: {
          expected: `("python 学习", "")`,
          actualExpression: `_silent_call(normalize_title, "  PyThOn 学习  ")`,
          rule: "结果元组第二项必须为空字符串，表示函数没有打印",
        },
      },
      {
        name: "可复用于其他输入",
        expression: `_silent_call(normalize_title, "\\t  Data SCIENCE \\n") == ("data science", "")`,
        failure: "函数应根据传入文本工作，不能写死示例结果。",
        feedback: {
          expected: `("data science", "")`,
          actualExpression: `_silent_call(normalize_title, "\\t  Data SCIENCE \\n")`,
          rule: "使用未在起始代码中出现的输入验证",
        },
      },
    ],
  },
  {
    id: "branches",
    module: "Python 起步",
    number: 4,
    title: "让程序做决定",
    kicker: "条件分支",
    minutes: 14,
    goal: "用互斥条件覆盖边界，避免重复或遗漏。",
    concepts: [
      {
        title: "从最具体的条件开始",
        body: "if / elif / else 只会执行第一个成立的分支。",
        example: 'if score >= 90:\n    grade = "A"\nelif score >= 60:\n    grade = "B"',
      },
      {
        title: "边界值最容易出错",
        body: "写完条件后，主动检查 59、60、89、90 这样的边界。",
        example: "age >= 18",
      },
    ],
    requirements: ["实现函数 grade(score)", "90 分及以上返回 A；60–89 返回 B；低于 60 返回 C"],
    starterCode: 'def grade(score):\n    # 在这里完成分支\n    pass\n',
    hints: ["建议使用 if / elif / else，或用提前 return 表达互斥边界。", "先判断 score >= 90，再判断 score >= 60。"],
    tests: [
      {
        name: "高分段",
        expression: `grade(90) == "A" and grade(100) == "A"`,
        failure: "90 和 100 都应返回 A。",
        feedback: {
          expected: "('A', 'A')",
          actualExpression: `(grade(90), grade(100))`,
          rule: "90 是 A 段的下边界",
        },
      },
      {
        name: "中间分段",
        expression: `grade(60) == "B" and grade(89) == "B"`,
        failure: "60 到 89 应返回 B。",
        feedback: {
          expected: "('B', 'B')",
          actualExpression: `(grade(60), grade(89))`,
          rule: "同时检查中间段两侧边界",
        },
      },
      {
        name: "低分段",
        expression: `grade(0) == "C" and grade(59) == "C"`,
        failure: "低于 60 应返回 C。",
        feedback: {
          expected: "('C', 'C')",
          actualExpression: `(grade(0), grade(59))`,
          rule: "59 仍属于低分段",
        },
      },
    ],
  },
  {
    id: "loops",
    module: "Python 工程能力",
    number: 5,
    title: "批量处理数据",
    kicker: "循环与 range",
    minutes: 14,
    goal: "用循环表达重复规则，而不是复制粘贴代码。",
    concepts: [
      {
        title: "for 读取序列",
        body: "每轮循环把下一个元素交给临时变量。",
        example: "for number in numbers:\n    print(number)",
      },
      {
        title: "累加器记录过程",
        body: "在循环外初始化，在循环内更新，循环后读取结果。",
        example: "total = 0\nfor n in numbers:\n    total += n",
      },
    ],
    requirements: ["实现 sum_even(numbers)", "用 for 遍历传入序列", "返回其中所有偶数的总和"],
    starterCode: "def sum_even(numbers):\n    total = 0\n    # 用循环更新 total\n    return total\n",
    hints: ["偶数满足 number % 2 == 0。", "只有条件成立时才执行 total += number。"],
    tests: [
      {
        name: "混合正负数",
        expression: `sum_even([3, 4, 10, -6, 7]) == 8`,
        failure: "应只累加偶数；本组输入期望得到 8。",
        feedback: {
          expected: "8",
          actualExpression: `sum_even([3, 4, 10, -6, 7])`,
          rule: "使用未在起始代码中出现的正数、负数和奇数",
        },
      },
      {
        name: "空输入与全奇数",
        expression: `sum_even([]) == 0 and sum_even([1, 3, 9]) == 0`,
        failure: "空输入和全奇数输入都应返回 0。",
        feedback: {
          expected: "(0, 0)",
          actualExpression: `(sum_even([]), sum_even([1, 3, 9]))`,
          rule: "返回结果，不依赖固定全局样例",
        },
      },
      {
        name: "使用 for 循环",
        expression: `_function_has_node(_source, "sum_even", "For")`,
        failure: "本关要求在 sum_even 函数中使用 for 循环。",
        kind: "structure",
        feedback: {
          expected: "sum_even 函数体包含 for 循环",
          actualExpression: `_function_has_node(_source, "sum_even", "For")`,
          rule: "AST 只检查 sum_even 函数体；注释中的 for 不算",
        },
      },
    ],
  },
  {
    id: "functions",
    module: "Python 工程能力",
    number: 6,
    title: "封装一条规则",
    kicker: "函数与返回值",
    minutes: 16,
    goal: "把输入、规则和输出封装成可重复验证的函数。",
    concepts: [
      {
        title: "参数是函数的输入",
        body: "同一段逻辑通过不同参数处理不同数据。",
        example: "def double(number):\n    return number * 2",
      },
      {
        title: "return 交还结果",
        body: "print 只负责显示；return 才让调用者拿到值继续使用。",
        example: "result = double(4)",
      },
    ],
    requirements: ["实现函数 shipping_fee(price, member)", "会员或满 99 元免运费", "其他情况返回 10", "返回数字，不在函数内 print"],
    starterCode: "def shipping_fee(price, member):\n    pass\n",
    hints: ["“或”对应 or。", "免费条件成立时 return 0，否则 return 10。"],
    tests: [
      {
        name: "会员免运费且不打印",
        expression: `_silent_call(shipping_fee, 20, True) == (0, "")`,
        failure: "会员应返回 0，调用期间不能打印。",
        feedback: {
          expected: `(0, "")`,
          actualExpression: `_silent_call(shipping_fee, 20, True)`,
          rule: "在真实调用 shipping_fee 时捕获标准输出",
        },
      },
      {
        name: "99 元边界且不打印",
        expression: `_silent_call(shipping_fee, 99, False) == (0, "")`,
        failure: "非会员恰好 99 元应返回 0，调用期间不能打印。",
        feedback: {
          expected: `(0, "")`,
          actualExpression: `_silent_call(shipping_fee, 99, False)`,
          rule: "99 属于免运费边界",
        },
      },
      {
        name: "普通情况且不打印",
        expression: `_silent_call(shipping_fee, 37, False) == (10, "")`,
        failure: "非会员且未满 99 元应返回 10，调用期间不能打印。",
        feedback: {
          expected: `(10, "")`,
          actualExpression: `_silent_call(shipping_fee, 37, False)`,
          rule: "用未在起始代码中出现的金额验证",
        },
      },
    ],
  },
  {
    id: "lists",
    module: "Python 工程能力",
    number: 7,
    title: "组织一组数据",
    kicker: "列表与推导式",
    minutes: 16,
    goal: "筛选并转换列表，写出可读的数据处理管道。",
    concepts: [
      {
        title: "列表保持顺序",
        body: "列表适合保存同类、有顺序、可增删的数据。",
        example: "scores = [82, 95, 61]",
      },
      {
        title: "推导式表达映射与筛选",
        body: "简单规则可写成“为每个元素生成什么，只保留谁”。",
        example: "[n * 2 for n in numbers if n > 0]",
      },
    ],
    requirements: ["实现 improve_scores(scores)", "选出及格分数（>= 60）并各加 5 分，最高不超过 100", "使用列表推导式返回新列表"],
    starterCode: "def improve_scores(scores):\n    # 用一个列表推导式返回结果\n    pass\n",
    hints: ["先筛选 score >= 60。", "min(score + 5, 100) 可以限制上限。"],
    tests: [
      {
        name: "筛选、加分与封顶",
        expression: `improve_scores([59, 60, 95, 100, 42]) == [65, 100, 100]`,
        failure: "应过滤不及格分数，及格分加 5 并封顶 100。",
        feedback: {
          expected: "[65, 100, 100]",
          actualExpression: `improve_scores([59, 60, 95, 100, 42])`,
          rule: "按原顺序返回通过筛选的结果",
        },
      },
      {
        name: "空输入与另一组分数",
        expression: `improve_scores([]) == [] and improve_scores([61, 74]) == [66, 79]`,
        failure: "函数应适用于空列表和其他分数。",
        feedback: {
          expected: "([], [66, 79])",
          actualExpression: `(improve_scores([]), improve_scores([61, 74]))`,
          rule: "不能写死起始样例",
        },
      },
      {
        name: "使用列表推导式",
        expression: `_function_has_node(_source, "improve_scores", "ListComp")`,
        failure: "本关要求在 improve_scores 中使用列表推导式。",
        kind: "structure",
        feedback: {
          expected: "improve_scores 函数体包含列表推导式",
          actualExpression: `_function_has_node(_source, "improve_scores", "ListComp")`,
          rule: "AST 只检查目标函数；注释或其他位置的文本不算",
        },
      },
    ],
  },
  {
    id: "dictionaries",
    module: "Python 工程能力",
    number: 8,
    title: "建立键值关系",
    kicker: "字典与统计",
    minutes: 18,
    goal: "用字典完成频次统计，并安全处理第一次出现的值。",
    concepts: [
      {
        title: "字典用键查值",
        body: "键应唯一，适合表示名字到数量、编号到记录的映射。",
        example: 'profile = {"name": "小派", "level": 8}',
      },
      {
        title: "get 提供明确初值",
        body: "统计时，尚不存在的键从 0 开始。",
        example: "counts[word] = counts.get(word, 0) + 1",
      },
    ],
    requirements: ["实现 word_counts(words)", "返回每个单词及其出现次数组成的字典", "用 for 遍历输入，不提前写死任何单词键"],
    starterCode: "def word_counts(words):\n    counts = {}\n    # 遍历并统计\n    return counts\n",
    hints: ["每轮用 word 作为 counts 的键。", "右侧可以写 counts.get(word, 0) + 1。"],
    tests: [
      {
        name: "统计未见过的单词",
        expression: `word_counts(["rust", "py", "rust", "go", "rust", "py"]) == {"rust": 3, "py": 2, "go": 1}`,
        failure: "应根据传入单词动态统计，不能写死 py/go/js 样例。",
        feedback: {
          expected: `{"rust": 3, "py": 2, "go": 1}`,
          actualExpression: `word_counts(["rust", "py", "rust", "go", "rust", "py"])`,
          rule: "键来自传入列表，而不是预先写死",
        },
      },
      {
        name: "空输入与重复一次",
        expression: `word_counts([]) == {} and word_counts(["x", "y"]) == {"x": 1, "y": 1}`,
        failure: "空列表应返回空字典，新单词应从 1 开始。",
        feedback: {
          expected: `({}, {"x": 1, "y": 1})`,
          actualExpression: `(word_counts([]), word_counts(["x", "y"]))`,
          rule: "函数必须可复用",
        },
      },
      {
        name: "使用 for 遍历",
        expression: `_function_has_node(_source, "word_counts", "For")`,
        failure: "本关要求在 word_counts 中使用 for 循环统计。",
        kind: "structure",
        feedback: {
          expected: "word_counts 函数体包含 for 循环",
          actualExpression: `_function_has_node(_source, "word_counts", "For")`,
          rule: "AST 只检查目标函数；注释中的 for 不算",
        },
      },
    ],
  },
  {
    id: "exceptions",
    module: "Python 工程能力",
    number: 9,
    title: "只捕获能处理的错误",
    kicker: "异常与边界",
    minutes: 18,
    goal: "识别可恢复边界，捕获具体异常并保留真实失败。",
    concepts: [
      {
        title: "异常不是普通分支",
        body: "只捕获你知道如何处理的具体异常，其他错误应继续暴露。",
        example: "try:\n    value = int(text)\nexcept ValueError:\n    return None",
      },
      {
        title: "不要用 except Exception 吞错",
        body: "宽泛捕获会把真正的编程错误伪装成正常结果。",
        example: "except ValueError:  # 边界清晰",
      },
    ],
    requirements: ["实现 parse_age(text)", "有效整数返回 int", "仅当无法转为整数时返回 None", "不要捕获 Exception 或 BaseException"],
    starterCode: "def parse_age(text):\n    # 只处理可预期的输入错误\n    pass\n",
    hints: ["int(text) 失败时会抛出 ValueError。", "try 中直接 return int(text)，except ValueError 中 return None。"],
    tests: [
      {
        name: "多个有效整数",
        expression: `parse_age("18") == 18 and parse_age(" 27 ") == 27`,
        failure: "有效整数字符串应交给 int 转换，不能只识别一个样例。",
        feedback: {
          expected: "(18, 27)",
          actualExpression: `(parse_age("18"), parse_age(" 27 "))`,
          rule: "使用两个不同输入验证转换行为",
        },
      },
      {
        name: "无效年龄",
        expression: `parse_age("十八") is None`,
        failure: "无法转换时应返回 None。",
        feedback: {
          expected: "None",
          actualExpression: `parse_age("十八")`,
          rule: "只把 int 转换产生的 ValueError 转为 None",
        },
      },
      {
        name: "TypeError 继续外溢",
        expression: `_type_error_escapes(parse_age)`,
        failure: "只应处理 ValueError；int 转换中的 TypeError 必须继续抛出。",
        feedback: {
          expected: "TypeError 继续抛出",
          actualExpression: `_type_error_escapes(parse_age)`,
          rule: "行为探针会让 __int__ 抛出 TypeError；宽泛捕获会失败",
        },
      },
      {
        name: "只捕获 ValueError",
        expression: `_function_catches_only_value_error(_source, "parse_age")`,
        failure: "parse_age 中应使用 except ValueError；不能使用 bare except、Exception 或 BaseException。",
        kind: "structure",
        feedback: {
          expected: "parse_age 至少有一个 except，且每个 handler 仅捕获 ValueError",
          actualExpression: `_function_catches_only_value_error(_source, "parse_age")`,
          rule: "AST 只检查 parse_age；接受括号和 as 别名，不读取源码字符串",
        },
      },
    ],
  },
  {
    id: "classes",
    module: "Python 工程能力",
    number: 10,
    title: "让数据带上行为",
    kicker: "类与对象",
    minutes: 22,
    goal: "用类维护相关状态，并通过方法保护状态变化规则。",
    concepts: [
      {
        title: "对象把状态和行为放在一起",
        body: "__init__ 建立实例状态，方法通过 self 读取或修改它。",
        example: "class Counter:\n    def __init__(self):\n        self.value = 0",
      },
      {
        title: "方法维护不变量",
        body: "如果状态变化有约束，让方法统一执行，避免外部随意修改。",
        example: "def add(self, amount):\n    self.value += amount",
      },
    ],
    requirements: ["实现 Wallet 类，初始 balance 为 0", "deposit(amount) 增加余额并返回新余额", "amount <= 0 时抛出 ValueError"],
    starterCode: "class Wallet:\n    def __init__(self):\n        pass\n\n    def deposit(self, amount):\n        pass\n",
    hints: ["初始化时写 self.balance = 0。", "非法 amount 用 raise ValueError(...) 主动拒绝。"],
    tests: [
      {
        name: "初始余额",
        expression: `(lambda w: w.balance == 0)(Wallet())`,
        failure: "新 Wallet 的 balance 应为 0。",
        feedback: {
          expected: "0",
          actualExpression: "Wallet().balance",
          rule: "每个新实例都从 0 开始",
        },
      },
      {
        name: "连续存款更新并返回",
        expression: `_wallet_sequence(Wallet)`,
        failure: "连续存入 30 和 12 后，应分别返回 30、42，最终余额为 42。",
        feedback: {
          expected: "(30, 42, 42)",
          actualExpression: `_wallet_results(Wallet)`,
          rule: "同一个 Wallet 实例连续调用两次",
        },
      },
      {
        name: "拒绝零和负数",
        expression: `_raises_value_error(lambda: Wallet().deposit(0)) and _raises_value_error(lambda: Wallet().deposit(-5))`,
        failure: "amount 为 0 或负数时都应抛出 ValueError。",
        feedback: {
          expected: "(True, True)",
          actualExpression: `(_raises_value_error(lambda: Wallet().deposit(0)), _raises_value_error(lambda: Wallet().deposit(-5)))`,
          rule: "完整验证 amount <= 0",
        },
      },
    ],
  },
  {
    id: "generators",
    module: "Python 工程能力",
    number: 11,
    title: "按需产生数据",
    kicker: "迭代器与生成器",
    minutes: 20,
    goal: "用 yield 描述数据流，避免一次性创建不必要的列表。",
    concepts: [
      {
        title: "yield 暂停并保留状态",
        body: "生成器每次产出一个值，下次从暂停位置继续。",
        example: "def countdown(n):\n    while n:\n        yield n\n        n -= 1",
      },
      {
        title: "生成器适合流式数据",
        body: "数据很多或可能无限时，按需计算能减少内存占用。",
        example: "for item in countdown(3): ...",
      },
    ],
    requirements: ["实现 even_numbers(limit)", "依次 yield 0 到 limit 以内的偶数", "不创建中间列表"],
    starterCode: "def even_numbers(limit):\n    pass\n",
    hints: ["range(0, limit + 1, 2) 会依次产生偶数。", "循环中使用 yield number，而不是 return。"],
    tests: [
      {
        name: "边界与顺序",
        expression: `list(even_numbers(6)) == [0, 2, 4, 6]`,
        failure: "limit=6 时应依次产生 0、2、4、6。",
        feedback: {
          expected: "[0, 2, 4, 6]",
          actualExpression: "list(even_numbers(6))",
          rule: "包含偶数上限并保持升序",
        },
      },
      {
        name: "零、奇数与负数边界",
        expression: `list(even_numbers(0)) == [0] and list(even_numbers(5)) == [0, 2, 4] and list(even_numbers(-2)) == []`,
        failure: "应正确处理 0、奇数上限和负数上限。",
        feedback: {
          expected: "([0], [0, 2, 4], [])",
          actualExpression: `(list(even_numbers(0)), list(even_numbers(5)), list(even_numbers(-2)))`,
          rule: "limit 为包含上限；负数范围为空",
        },
      },
      {
        name: "确实是生成器函数",
        expression: `inspect.isgeneratorfunction(even_numbers)`,
        failure: "even_numbers 本身应是生成器函数。",
        kind: "structure",
        feedback: {
          expected: "True",
          actualExpression: `inspect.isgeneratorfunction(even_numbers)`,
          rule: "使用 Python 运行时的生成器语义判断，不读取源码文本",
        },
      },
    ],
  },
  {
    id: "decorators",
    module: "Python 工程能力",
    number: 12,
    title: "为函数增加能力",
    kicker: "装饰器与闭包",
    minutes: 24,
    goal: "理解函数是一等对象，并用装饰器复用横切逻辑。",
    concepts: [
      {
        title: "函数也可以被传递",
        body: "装饰器接收函数并返回新函数，不修改原函数内部。",
        example: "def decorate(func):\n    def wrapper():\n        return func()\n    return wrapper",
      },
      {
        title: "*args 与 **kwargs 保留调用方式",
        body: "包装器转发任意参数，才能适配不同函数。",
        example: "def wrapper(*args, **kwargs):\n    return func(*args, **kwargs)",
      },
    ],
    requirements: ["实现 twice 装饰器", "被装饰函数每次调用两遍", "返回第二次调用的结果", "支持任意参数"],
    starterCode: "def twice(func):\n    # 返回包装函数\n    pass\n\n@twice\ndef add(a, b):\n    return a + b\n",
    hints: ["在 twice 内定义 wrapper(*args, **kwargs)。", "调用两次 func；第一次不保存，第二次 return。"],
    tests: [
      {
        name: "调用两次并返回第二次结果",
        expression: `_decorator_contract(twice)`,
        failure: "包装器应以完全相同的位置参数和关键字参数调用两次，并返回第二次结果。",
        feedback: {
          expected: "两次调用参数一致，返回第 2 次结果",
          actualExpression: `_decorator_observation(twice)`,
          rule: "用真实位置参数、仅关键字参数和调用次数记录验证",
        },
      },
      {
        name: "关键字参数不丢失",
        expression: `_decorator_kwargs_probe(twice)`,
        failure: "包装器必须把关键字参数原样转发给两次调用。",
        feedback: {
          expected: "两次调用收到相同的关键字参数",
          actualExpression: `_decorator_kwargs_probe(twice)`,
          rule: "用关键字参数探针验证，而不是检查参数变量名",
        },
      },
    ],
  },
  {
    id: "project-text",
    module: "Python 综合训练",
    number: 13,
    title: "Prompt 文本分析器",
    kicker: "Agent 前置项目 · 上下文统计",
    minutes: 35,
    goal: "组合字符串、列表和字典，分析进入 Agent 上下文的文本规模与高频词。",
    project: true,
    concepts: [
      {
        title: "先定义输入输出契约",
        body: "Agent 的上下文处理也需要稳定契约：函数接收文本，返回结构固定的统计字典。",
        example: '{"words": 4, "unique": 3, "top": "python"}',
      },
      {
        title: "让数据逐步变干净",
        body: "Prompt 进入模型前先统一大小写、分词、统计；每一步只做一件事。",
        example: "words = text.lower().split()",
      },
    ],
    requirements: ["实现 analyze(text)", "忽略大小写并按空白分词", "返回 words、unique、top 三个字段", "top 为出现最多的单词；同频时取最先出现者", "空文本的 top 为 None"],
    starterCode: "def analyze(text):\n    # 1. 清洗并分词\n    # 2. 统计次数\n    # 3. 返回结果\n    pass\n",
    hints: ["words 数量是 len(words)，unique 是 len(counts)。", "非空时 max(counts, key=counts.get) 会在同频时保留最先插入的键。"],
    tests: [
      {
        name: "基本统计",
        expression: `analyze("Py py code") == {"words": 3, "unique": 2, "top": "py"}`,
        failure: "“Py py code” 应得到 words=3、unique=2、top=py。",
        feedback: {
          expected: `{"words": 3, "unique": 2, "top": "py"}`,
          actualExpression: `analyze("Py py code")`,
          rule: "忽略大小写后校验完整字典",
        },
      },
      {
        name: "第二组完整结果",
        expression: `analyze("one\\n two\\tone") == {"words": 3, "unique": 2, "top": "one"}`,
        failure: "换行和制表符也应分词，并返回完整、结构稳定的字典。",
        feedback: {
          expected: `{"words": 3, "unique": 2, "top": "one"}`,
          actualExpression: `analyze("one\\n two\\tone")`,
          rule: "校验完整字典，不只检查 top",
        },
      },
      {
        name: "同频与空文本",
        expression: `analyze("red blue blue red") == {"words": 4, "unique": 2, "top": "red"} and analyze("   ") == {"words": 0, "unique": 0, "top": None}`,
        failure: "同频时取最先出现的单词；空文本的 top 为 None。",
        feedback: {
          expected: `({"words": 4, "unique": 2, "top": "red"}, {"words": 0, "unique": 0, "top": None})`,
          actualExpression: `(analyze("red blue blue red"), analyze("   "))`,
          rule: "同频规则明确为最先出现者",
        },
      },
    ],
  },
  {
    id: "project-expense",
    module: "Python 综合训练",
    number: 14,
    title: "Agent 调用成本汇总器",
    kicker: "Agent 前置项目 · 成本观测",
    minutes: 40,
    goal: "从模型与工具调用记录中计算总成本和分类成本，为 Agent 评估建立观测能力。",
    project: true,
    concepts: [
      {
        title: "调用记录是 Agent 的账单",
        body: "每条字典表示一次模型或工具调用，循环把成本累积成汇总结果。",
        example: '{"category": "model", "amount": 0.03}',
      },
      {
        title: "成本计算要集中",
        body: "同一个循环同时更新总成本与分类成本，不重复遍历 trace。",
        example: "by_category[key] = by_category.get(key, 0) + amount",
      },
    ],
    requirements: ["实现 summarize(records)", "返回 total 和 by_category", "空列表也返回 total=0 与空字典", "在一个 for 循环中同时完成两项汇总，不使用额外推导式"],
    starterCode: "def summarize(records):\n    total = 0\n    by_category = {}\n    # 完成一次遍历\n    return {\"total\": total, \"by_category\": by_category}\n",
    hints: ["每条 record 用 record['amount'] 和 record['category'] 取值。", "在同一个 for 循环中更新 total 与 by_category。"],
    tests: [
      {
        name: "多类 Agent 调用汇总",
        expression: `summarize([{"category":"model","amount":13},{"category":"tool","amount":7},{"category":"model","amount":2}]) == {"total":22,"by_category":{"model":15,"tool":7}}`,
        failure: "应按传入记录计算总额和分类，不能硬编码空/非空结果。",
        feedback: {
          expected: `{"total": 22, "by_category": {"model": 15, "tool": 7}}`,
          actualExpression: `summarize([{"category":"model","amount":13},{"category":"tool","amount":7},{"category":"model","amount":2}])`,
          rule: "用模型与工具两类调用记录验证",
        },
      },
      {
        name: "空输入",
        expression: `summarize([]) == {"total": 0, "by_category": {}}`,
        failure: "空列表应返回零总额和空分类。",
        feedback: {
          expected: `{"total": 0, "by_category": {}}`,
          actualExpression: "summarize([])",
          rule: "返回结构与非空输入保持一致",
        },
      },
      {
        name: "使用一个 for 循环",
        expression: `_function_node_count(_source, "summarize", "For") == 1 and _function_node_count(_source, "summarize", "AsyncFor") == 0 and _function_node_count(_source, "summarize", "comprehension") == 0`,
        failure: "summarize 中应恰好使用一个同步 for 循环，且不使用额外推导式。",
        kind: "structure",
        feedback: {
          expected: "(1, 0, 0)",
          actualExpression: `(_function_node_count(_source, "summarize", "For"), _function_node_count(_source, "summarize", "AsyncFor"), _function_node_count(_source, "summarize", "comprehension"))`,
          rule: "依次为 for、async for、推导式数量；AST 只检查 summarize 的实际函数体",
        },
      },
    ],
  },
  {
    id: "project-tasks",
    module: "Python 综合训练",
    number: 15,
    title: "Agent 任务优先级引擎",
    kicker: "Agent 前置项目 · 计划排序",
    minutes: 50,
    goal: "综合函数、排序、异常边界与数据契约，为 Planner 排出稳定的执行顺序。",
    project: true,
    concepts: [
      {
        title: "排序键表达业务规则",
        body: "key 函数把每项转换成可比较的元组，规则优先级一目了然。",
        example: "sorted(tasks, key=lambda task: (-task['priority'], task['name']))",
      },
      {
        title: "在入口验证数据",
        body: "越早拒绝无效值，后续逻辑越简单可靠。",
        example: "if priority not in range(1, 6):\n    raise ValueError(...)",
      },
    ],
    requirements: ["实现 plan(tasks)", "priority 必须是 1–5，否则抛出 ValueError", "先按 priority 从高到低，再按 name 字母顺序", "返回任务 name 列表，不修改原列表"],
    starterCode: "def plan(tasks):\n    # 验证后排序，返回名称列表\n    pass\n",
    hints: ["先循环验证 priority，再调用 sorted。", "排序键可用 (-task['priority'], task['name'])。"],
    tests: [
      {
        name: "排序规则",
        expression: `plan([{"name":"write","priority":3},{"name":"learn","priority":5},{"name":"build","priority":3}]) == ["learn","build","write"]`,
        failure: "先按优先级降序，同级按名称升序。",
        feedback: {
          expected: `["learn", "build", "write"]`,
          actualExpression: `plan([{"name":"write","priority":3},{"name":"learn","priority":5},{"name":"build","priority":3}])`,
          rule: "优先级降序，同级名称升序",
        },
      },
      {
        name: "空输入与同级排序",
        expression: `plan([]) == [] and plan([{"name":"zeta","priority":2},{"name":"alpha","priority":2},{"name":"mid","priority":4}]) == ["mid","alpha","zeta"]`,
        failure: "空输入返回空列表；同优先级按 name 升序。",
        feedback: {
          expected: `([], ["mid", "alpha", "zeta"])`,
          actualExpression: `(plan([]), plan([{"name":"zeta","priority":2},{"name":"alpha","priority":2},{"name":"mid","priority":4}]))`,
          rule: "同级排序按名称字母顺序",
        },
      },
      {
        name: "拒绝优先级下界和上界",
        expression: `_raises_value_error(lambda: plan([{"name":"low","priority":0}])) and _raises_value_error(lambda: plan([{"name":"high","priority":6}]))`,
        failure: "priority 为 0 或 6 时都应抛出 ValueError。",
        feedback: {
          expected: "(True, True)",
          actualExpression: `(_raises_value_error(lambda: plan([{"name":"low","priority":0}])), _raises_value_error(lambda: plan([{"name":"high","priority":6}]))`,
          rule: "完整验证 1–5 的两侧边界",
        },
      },
      {
        name: "不修改输入",
        expression: `_plan_preserves_input(plan)`,
        failure: "请返回新结果，不要原地修改 tasks。",
        feedback: {
          expected: "True",
          actualExpression: "_plan_preserves_input(plan)",
          rule: "调用前后比较原列表及内部字典",
        },
      },
    ],
  },
  {
    id: "agent-tool-registry",
    module: "Agent 核心范式",
    number: 16,
    title: "给 Agent 装上工具箱",
    kicker: "Hello-Agents · Tool Registry",
    minutes: 26,
    goal: "用统一注册表管理工具，让 Agent 通过名字和参数字典安全调用 Python 函数。",
    source: { label: "Hello-Agents 第七章：构建 Agent 框架", url: HELLO_AGENTS_CHAPTER_7 },
    concepts: [
      {
        title: "工具是 Agent 的手脚",
        body: "模型只负责决定调用什么；注册表负责找到真实函数、传入参数并返回观察结果。两者分离后，工具更容易测试和扩展。",
        example: 'registry.register("weather", get_weather)\nregistry.execute("weather", {"city": "成都"})',
      },
      {
        title: "失败必须清晰",
        body: "重复名称通常是配置错误，未知工具通常是决策错误。分别抛出 ValueError 与 KeyError，调用方才能准确处理。",
        example: 'if name in self.tools:\n    raise ValueError("duplicate tool")',
      },
    ],
    requirements: [
      "实现 ToolRegistry 类，实例内维护 tools 字典",
      "register(name, func) 注册工具；重复名称抛出 ValueError",
      "execute(name, payload) 使用 func(**payload) 调用；未知名称抛出 KeyError",
      "原样返回工具结果，不打印、不伪造成功",
    ],
    starterCode: "class ToolRegistry:\n    def __init__(self):\n        self.tools = {}\n\n    def register(self, name, func):\n        pass\n\n    def execute(self, name, payload):\n        pass\n",
    hints: ["先检查 name 是否已经存在，再保存 func。", "执行时从 self.tools[name] 取函数，并用 **payload 展开关键字参数。"],
    tests: [
      {
        name: "注册、转发参数并返回真实结果",
        expression: `_tool_registry_contract(ToolRegistry)`,
        failure: "注册表应把两组不同参数完整转发给工具，并原样返回结果。",
        feedback: {
          expected: "两次结果正确，调用参数完整",
          actualExpression: `_tool_registry_observation(ToolRegistry)`,
          rule: "使用记录型工具验证真实调用次数、位置和关键字参数",
        },
      },
      {
        name: "重复与未知工具边界",
        expression: `_tool_registry_errors(ToolRegistry) == (True, True)`,
        failure: "重复注册应抛 ValueError，执行未知工具应抛 KeyError。",
        feedback: {
          expected: "(True, True)",
          actualExpression: `_tool_registry_errors(ToolRegistry)`,
          rule: "不吞掉注册和路由错误",
        },
      },
    ],
  },
  {
    id: "agent-action-parser",
    module: "Agent 核心范式",
    number: 17,
    title: "读懂模型的 Action",
    kicker: "Hello-Agents · ReAct 输出解析",
    minutes: 22,
    goal: "把模型输出的 tool[input] 或 Finish[answer] 解析为稳定的结构化数据。",
    source: { label: "Hello-Agents 第四章：ReAct 输出解析", url: HELLO_AGENTS_CHAPTER_4 },
    concepts: [
      {
        title: "文本协议是模型与代码的边界",
        body: "LLM 返回文本，Python 需要把动作名与参数拆开。解析失败应返回明确的空结果，而不是猜测模型意图。",
        example: 'parse_action("weather[北京]")  # ("weather", "北京")',
      },
      {
        title: "Finish 也是一种动作",
        body: "工具动作继续循环，Finish 表示已经收集到足够信息，可以结束并交付答案。",
        example: 'parse_action("Finish[行程已生成]")',
      },
    ],
    requirements: [
      "实现 parse_action(text)",
      "忽略整段文本首尾空白，解析第一个 [ 与最后一个 ] 之间的完整内容",
      "合法输入返回 (name, payload)，payload 可以包含换行",
      "缺少动作名、方括号不完整或括号后还有内容时返回 (None, None)",
    ],
    starterCode: "def parse_action(text):\n    # 返回 (action_name, payload)\n    pass\n",
    hints: ["先用 strip() 清理整段文本。", "可检查 '[' 的位置和字符串是否以 ']' 结尾，再用 split('[', 1)。"],
    tests: [
      {
        name: "解析工具与 Finish",
        expression: `parse_action("  weather[成都]  ") == ("weather", "成都") and parse_action("Finish[安排完成]") == ("Finish", "安排完成")`,
        failure: "应正确解析工具动作和 Finish 动作。",
        feedback: {
          expected: `(("weather", "成都"), ("Finish", "安排完成"))`,
          actualExpression: `(parse_action("  weather[成都]  "), parse_action("Finish[安排完成]"))`,
          rule: "只忽略整段文本首尾空白，不改写 payload",
        },
      },
      {
        name: "保留多行 payload",
        expression: `parse_action("search[line 1\\nline 2]") == ("search", "line 1\\nline 2")`,
        failure: "方括号中的换行应作为 payload 原样保留。",
        feedback: {
          expected: `("search", "line 1\\nline 2")`,
          actualExpression: `parse_action("search[line 1\\nline 2]")`,
          rule: "payload 可跨行",
        },
      },
      {
        name: "拒绝模糊格式",
        expression: `parse_action("weather 成都") == (None, None) and parse_action("[成都]") == (None, None) and parse_action("weather[成都] extra") == (None, None)`,
        failure: "格式不完整或括号后有多余内容时不要猜测。",
        feedback: {
          expected: "((None, None), (None, None), (None, None))",
          actualExpression: `(parse_action("weather 成都"), parse_action("[成都]"), parse_action("weather[成都] extra"))`,
          rule: "无法确定时返回明确空结果",
        },
      },
    ],
  },
  {
    id: "agent-react-loop",
    module: "Agent 核心范式",
    number: 18,
    title: "跑通 ReAct 循环",
    kicker: "Hello-Agents · Thought → Action → Observation",
    minutes: 34,
    goal: "实现一个离线 ReAct 执行器，掌握动作解析、工具调用、观察记录与最大步数安全阀。",
    source: { label: "Hello-Agents 第四章：ReAct 智能体", url: HELLO_AGENTS_CHAPTER_4 },
    concepts: [
      {
        title: "Agent 是持续与环境交互的循环",
        body: "每一步读取一个动作，调用工具获得 Observation，再把观察写入历史，直到 Finish。真实项目中动作来自 LLM，本关用固定响应隔离网络变量。",
        example: "Action → Tool → Observation → 下一步 Action",
      },
      {
        title: "max_steps 是必要安全阀",
        body: "模型可能重复调用工具。达到最大步数必须停止，避免无限循环和不可控成本。",
        example: "for action in actions[:max_steps]: ...",
      },
    ],
    requirements: [
      "实现 run_react(actions, tools, max_steps=5)",
      "工具动作通过 tools[name](payload) 执行，并把 action、input、observation 写入 history",
      "遇到 Finish 返回其中答案；未遇到则 answer 为 None",
      "返回 {'answer': ..., 'history': [...], 'steps': 实际读取动作数}",
      "未知工具保留真实 KeyError；最多处理 max_steps 个动作",
    ],
    starterCode: "def parse_action(text):\n    text = text.strip()\n    if '[' not in text or not text.endswith(']'):\n        return None, None\n    name, payload = text[:-1].split('[', 1)\n    return (name, payload) if name else (None, None)\n\ndef run_react(actions, tools, max_steps=5):\n    history = []\n    # 完成 Action → Observation 循环\n    pass\n",
    hints: ["遍历 actions[:max_steps]，每读一个动作就更新 steps。", "先处理 Finish；否则从 tools 字典取函数并记录 observation。"],
    tests: [
      {
        name: "旅行助手式工具链",
        expression: `_react_travel_observation(run_react) == {"answer":"安排完成","history":[{"action":"weather","input":"成都","observation":"成都:晴"},{"action":"attraction","input":"成都|晴","observation":"成都|晴:熊猫基地"}],"steps":3}`,
        failure: "应按顺序执行天气与景点工具，记录观察，并在 Finish 时返回答案。",
        feedback: {
          expected: `{"answer": "安排完成", "history": 2 条真实观察, "steps": 3}`,
          actualExpression: `_react_travel_observation(run_react)`,
          rule: "对应 Hello-Agents 旅行助手的 Thought-Action-Observation 主循环",
        },
      },
      {
        name: "最大步数安全停止",
        expression: `_react_limit_observation(run_react) == {"answer":None,"history":[{"action":"echo","input":"one","observation":"ONE"}],"steps":1}`,
        failure: "max_steps=1 时只能处理第一个动作，不能继续读到 Finish。",
        feedback: {
          expected: `{"answer": None, "history": 1 条, "steps": 1}`,
          actualExpression: `_react_limit_observation(run_react)`,
          rule: "最大步数是硬限制，不伪造完成状态",
        },
      },
      {
        name: "未知工具暴露真实错误",
        expression: `_raises_key_error(lambda: run_react(["missing[x]"], {}, 2))`,
        failure: "未知工具应抛出 KeyError，不能返回模拟观察。",
        feedback: {
          expected: "KeyError",
          actualExpression: `_raises_key_error(lambda: run_react(["missing[x]"], {}, 2))`,
          rule: "工具路由失败不伪装为成功",
        },
      },
    ],
  },
  {
    id: "agent-plan-solve",
    module: "Agent 核心范式",
    number: 19,
    title: "先规划，再逐步求解",
    kicker: "Hello-Agents · Plan-and-Solve",
    minutes: 30,
    goal: "把复杂目标拆成有序步骤，并让后续步骤读取之前的结果上下文。",
    source: { label: "Hello-Agents 第四章：Plan-and-Solve", url: HELLO_AGENTS_CHAPTER_4 },
    concepts: [
      {
        title: "规划与执行分离",
        body: "Planner 负责生成步骤，Solver 负责逐步执行。分离后更容易检查计划、重试单步和复用执行器。",
        example: 'steps = [{"id": "weather", "task": "查询天气"}]',
      },
      {
        title: "上下文只包含已完成结果",
        body: "执行当前步骤时，把之前的结果快照交给 executor；不要让未来步骤提前污染上下文。",
        example: "result = executor(step['task'], context.copy())",
      },
    ],
    requirements: [
      "实现 execute_plan(steps, executor)",
      "按输入顺序执行每个 {'id', 'task'} 步骤",
      "executor(task, context) 中的 context 是此前 id 到 result 的新字典",
      "返回 [{'id': id, 'result': result}, ...]；空计划返回 []",
    ],
    starterCode: "def execute_plan(steps, executor):\n    context = {}\n    results = []\n    # 逐步求解并更新 context\n    return results\n",
    hints: ["每步调用 executor(step['task'], context.copy())。", "先把结果加入 results，再用当前 id 更新 context。"],
    tests: [
      {
        name: "后续步骤看到已完成上下文",
        expression: `_plan_solve_observation(execute_plan) == [{"id":"weather","result":"查天气|"},{"id":"route","result":"排行程|weather=查天气|"}]`,
        failure: "第二步应读取第一步结果，但第一步不应看到未来上下文。",
        feedback: {
          expected: "weather 无前置上下文；route 看到 weather 结果",
          actualExpression: `_plan_solve_observation(execute_plan)`,
          rule: "按计划顺序增量构建上下文",
        },
      },
      {
        name: "空计划不调用执行器",
        expression: `execute_plan([], lambda task, context: 1 / 0) == []`,
        failure: "空计划应直接返回空结果，不调用 executor。",
        feedback: {
          expected: "[]",
          actualExpression: `execute_plan([], lambda task, context: 1 / 0)`,
          rule: "没有步骤就没有执行副作用",
        },
      },
    ],
  },
  {
    id: "agent-reflection",
    module: "Agent 核心范式",
    number: 20,
    title: "让 Agent 反思后再改进",
    kicker: "Hello-Agents · Reflection",
    minutes: 28,
    goal: "实现执行—评估—改进闭环，并在质量达标或达到轮次上限时准确停止。",
    source: { label: "Hello-Agents 第四章：Reflection", url: HELLO_AGENTS_CHAPTER_4 },
    concepts: [
      {
        title: "Reflection 不是无限重写",
        body: "每轮先 evaluate；达标立即返回，不达标才 revise。max_rounds 控制最多改进次数。",
        example: "if evaluate(draft):\n    return draft",
      },
      {
        title: "把评估器和改写器注入函数",
        body: "高阶函数让循环独立于具体模型，测试时可以用确定性函数替代真实 LLM。",
        example: "reflection_loop(draft, evaluate, revise, max_rounds=3)",
      },
    ],
    requirements: [
      "实现 reflection_loop(draft, evaluate, revise, max_rounds=3)",
      "每轮先调用 evaluate(draft)；True 时立即返回当前 draft",
      "False 时调用 revise(draft) 并计为一次改进，最多改进 max_rounds 次",
      "max_rounds < 0 时抛出 ValueError；达到上限返回最后版本",
    ],
    starterCode: "def reflection_loop(draft, evaluate, revise, max_rounds=3):\n    # 执行 → 评估 → 改进\n    pass\n",
    hints: ["先验证 max_rounds，再用 range(max_rounds) 控制改进次数。", "循环后还未达标时，返回最后一次 revise 的结果。"],
    tests: [
      {
        name: "达标后提前停止",
        expression: `reflection_loop("a", lambda text: len(text) >= 3, lambda text: text + "!", 5) == "a!!"`,
        failure: "应改进到首次达标的 a!! 后停止，不能继续追加。",
        feedback: {
          expected: "'a!!'",
          actualExpression: `reflection_loop("a", lambda text: len(text) >= 3, lambda text: text + "!", 5)`,
          rule: "每轮先评估，质量达标立即停止",
        },
      },
      {
        name: "轮次上限不伪造达标",
        expression: `reflection_loop("draft", lambda text: False, lambda text: text + "+", 2) == "draft++"`,
        failure: "始终未达标时只能改进两次，然后返回真实最后版本。",
        feedback: {
          expected: "'draft++'",
          actualExpression: `reflection_loop("draft", lambda text: False, lambda text: text + "+", 2)`,
          rule: "达到上限后停止，不声称已经通过评估",
        },
      },
      {
        name: "拒绝负轮次",
        expression: `_raises_value_error(lambda: reflection_loop("x", lambda text: True, lambda text: text, -1))`,
        failure: "max_rounds 为负数时应抛出 ValueError。",
        feedback: {
          expected: "ValueError",
          actualExpression: `_raises_value_error(lambda: reflection_loop("x", lambda text: True, lambda text: text, -1))`,
          rule: "配置错误显式失败",
        },
      },
    ],
  },
  {
    id: "agent-memory-retrieval",
    module: "Agent 系统能力",
    number: 21,
    title: "实现最小记忆检索",
    kicker: "Hello-Agents · Memory / Naive RAG",
    minutes: 36,
    goal: "用关键词重叠、重要度和稳定排序构建可解释的本地记忆检索器。",
    source: { label: "Hello-Agents 第八章：记忆与检索", url: HELLO_AGENTS_CHAPTER_8 },
    concepts: [
      {
        title: "先检索，再生成",
        body: "RAG 在回答前从外部知识中找相关内容。本关先实现无需向量库的关键词检索，理解召回、排序与 limit。",
        example: "overlap = len(query_words & content_words)",
      },
      {
        title: "排序规则必须可解释",
        body: "先按关键词重叠数降序，再按 importance 降序；仍同分时保留原始顺序。",
        example: "sorted(scored, key=lambda item: (-item[0], -item[1], item[2]))",
      },
    ],
    requirements: [
      "实现 retrieve_memories(memories, query, limit=2)",
      "memory 含 content 与 importance；按空白分词并忽略大小写",
      "只保留至少命中一个查询词的记忆",
      "依次按命中词数、importance 降序，最后按原始顺序；返回 content 列表",
      "limit <= 0 或没有命中时返回 []",
    ],
    starterCode: "def retrieve_memories(memories, query, limit=2):\n    # 计算关键词重叠并排序\n    pass\n",
    hints: ["用 set(query.lower().split()) 得到查询词集合。", "把 (命中数, importance, 原索引, content) 放进列表后统一排序。"],
    tests: [
      {
        name: "相关度、重要度与稳定顺序",
        expression: `_memory_retrieval_observation(retrieve_memories) == ["python agent tools", "agent memory design", "python basics"]`,
        failure: "应先按命中词数，再按重要度排序；完全无关内容不能返回。",
        feedback: {
          expected: `["python agent tools", "agent memory design", "python basics"]`,
          actualExpression: `_memory_retrieval_observation(retrieve_memories)`,
          rule: "可解释的 Naive RAG 排序，不依赖外部模型",
        },
      },
      {
        name: "limit 与空命中边界",
        expression: `retrieve_memories([{"content":"agent tools","importance":1}], "python", 2) == [] and retrieve_memories([{"content":"agent tools","importance":1}], "agent", 0) == []`,
        failure: "没有关键词命中或 limit <= 0 时应返回空列表。",
        feedback: {
          expected: "([], [])",
          actualExpression: `(retrieve_memories([{"content":"agent tools","importance":1}], "python", 2), retrieve_memories([{"content":"agent tools","importance":1}], "agent", 0))`,
          rule: "不返回无关记忆，不绕过数量上限",
        },
      },
    ],
  },
  {
    id: "agent-handoff",
    module: "Agent 系统能力",
    number: 22,
    title: "设计多 Agent 交接",
    kicker: "Hello-Agents · Multi-Agent Handoff",
    minutes: 30,
    goal: "根据能力选择协作者，并用稳定消息信封传递来源、目标和任务。",
    source: { label: "Hello-Agents：从单智能体到多智能体系统", url: HELLO_AGENTS_REPO },
    concepts: [
      {
        title: "交接必须有明确契约",
        body: "多 Agent 协作不是随意聊天。消息至少要说明谁发起、交给谁、要完成什么，方便追踪和评估。",
        example: '{"from": "planner", "to": "weather", "task": "查询成都天气"}',
      },
      {
        title: "路由失败不能静默",
        body: "找不到具备所需 capability 的 Agent 时抛出 LookupError，让上层决定重规划或告知用户。",
        example: 'raise LookupError(f"no agent for {capability}")',
      },
    ],
    requirements: [
      "实现 handoff(sender, task, agents)",
      "task 含 capability 与 description；agents 按顺序含 name 与 capabilities 列表",
      "选择第一个具备能力的 Agent，返回 {'from', 'to', 'task'}",
      "找不到匹配 Agent 时抛出 LookupError，不修改 task 或 agents",
    ],
    starterCode: "def handoff(sender, task, agents):\n    # 找到第一个具备 task['capability'] 的 Agent\n    pass\n",
    hints: ["按 agents 原顺序遍历。", "命中时只构造新字典；遍历结束仍未命中再 raise LookupError。"],
    tests: [
      {
        name: "按能力选择第一个协作者",
        expression: `_handoff_contract(handoff)`,
        failure: "应选择第一个具备 weather 能力的 Agent，并生成稳定信封。",
        feedback: {
          expected: `{"from": "planner", "to": "weather-agent", "task": "查询成都天气"}`,
          actualExpression: `_handoff_observation(handoff)`,
          rule: "按输入顺序选择，不依赖固定 Agent 名称",
        },
      },
      {
        name: "无匹配能力时明确失败",
        expression: `_raises_lookup_error(lambda: handoff("planner", {"capability":"code","description":"写代码"}, [{"name":"weather","capabilities":["weather"]}]))`,
        failure: "没有匹配能力时应抛出 LookupError。",
        feedback: {
          expected: "LookupError",
          actualExpression: `_raises_lookup_error(lambda: handoff("planner", {"capability":"code","description":"写代码"}, [{"name":"weather","capabilities":["weather"]}]))`,
          rule: "不能伪造接收方或假装交接成功",
        },
      },
    ],
  },
  {
    id: "agent-travel-project",
    module: "Agent 案例实战",
    number: 23,
    title: "智能旅行助手",
    kicker: "Hello-Agents 案例 · 天气与景点协作",
    minutes: 45,
    goal: "复现 Hello-Agents 旅行助手的工具链：先查天气，再基于天气选择景点，并保留完整调用轨迹。",
    project: true,
    source: { label: "Hello-Agents：智能旅行助手案例", url: `${HELLO_AGENTS_REPO}/blob/main/docs/chapter1/%E7%AC%AC%E4%B8%80%E7%AB%A0%20%E5%88%9D%E8%AF%86%E6%99%BA%E8%83%BD%E4%BD%93.md` },
    concepts: [
      {
        title: "工具结果决定下一步参数",
        body: "景点工具不只需要城市，还要读取天气工具返回的 condition。这是 Agent 根据 Observation 调整后续 Action 的最小示例。",
        example: "weather = tools['weather'](city)\nattractions = tools['attraction'](city, weather['condition'])",
      },
      {
        title: "Trace 让结果可检查",
        body: "最终答案之外，还要保存调用了哪个工具、输入什么、观察到什么；没有轨迹就很难调试 Agent。",
        example: '{"tool": "weather", "input": "成都", "observation": {...}}',
      },
    ],
    requirements: [
      "实现 build_trip(city, tools)",
      "先调用 tools['weather'](city)，再调用 tools['attraction'](city, weather['condition'])",
      "返回 city、weather、attractions 与 trace；trace 按真实调用顺序保存两条记录",
      "使用工具真实返回值，不写死城市、天气或景点",
    ],
    starterCode: "def build_trip(city, tools):\n    trace = []\n    # 1. 查询天气并记录\n    # 2. 根据天气查询景点并记录\n    # 3. 返回结构化行程\n    pass\n",
    hints: ["先把 weather 结果保存下来，第二个工具需要其中的 condition。", "trace 的 observation 应保存工具原始返回值。"],
    tests: [
      {
        name: "成都晴天工具链",
        expression: `_travel_project_observation(build_trip, "成都", "晴", ["熊猫基地", "锦里"]) == {"city":"成都","weather":{"condition":"晴","temperature":26},"attractions":["熊猫基地","锦里"],"trace":[{"tool":"weather","input":"成都","observation":{"condition":"晴","temperature":26}},{"tool":"attraction","input":{"city":"成都","condition":"晴"},"observation":["熊猫基地","锦里"]}]}`,
        failure: "应先查天气，再把真实天气条件交给景点工具，并保存两条轨迹。",
        feedback: {
          expected: "成都、晴、两处景点及两条顺序正确的 trace",
          actualExpression: `_travel_project_observation(build_trip, "成都", "晴", ["熊猫基地", "锦里"])`,
          rule: "工具由测试注入，不能写死 Hello-Agents 示例值",
        },
      },
      {
        name: "另一城市仍可复用",
        expression: `_travel_project_observation(build_trip, "厦门", "雨", ["鼓浪屿室内馆"]) ["attractions"] == ["鼓浪屿室内馆"] and _travel_project_observation(build_trip, "厦门", "雨", ["鼓浪屿室内馆"]) ["trace"][1]["input"] == {"city":"厦门","condition":"雨"}`,
        failure: "旅行助手必须根据传入城市与天气工具结果工作。",
        feedback: {
          expected: "厦门 / 雨 / 鼓浪屿室内馆",
          actualExpression: `_travel_project_observation(build_trip, "厦门", "雨", ["鼓浪屿室内馆"])`,
          rule: "用第二组城市和天气防止样例写死",
        },
      },
    ],
  },
  {
    id: "agent-deep-research-project",
    module: "Agent 案例实战",
    number: 24,
    title: "自动化 DeepResearch",
    kicker: "Hello-Agents 案例 · 规划、检索、报告",
    minutes: 52,
    goal: "把研究主题拆成子任务，逐项收集资料，并生成带去重来源的结构化研究报告。",
    project: true,
    source: { label: "Hello-Agents 第十四章：DeepResearch Agent", url: HELLO_AGENTS_CHAPTER_14 },
    concepts: [
      {
        title: "研究 Agent 有三段流水线",
        body: "问题分析负责子任务，信息收集负责调用 search，报告阶段负责整合 findings 与 sources。",
        example: "Plan → Search each task → Report with citations",
      },
      {
        title: "来源必须去重并保序",
        body: "同一资料可能被多个子任务命中。报告保留第一次出现的位置，既避免重复，也保持可追溯顺序。",
        example: "if url not in sources:\n    sources.append(url)",
      },
    ],
    requirements: [
      "实现 build_research_report(topic, tasks, search)",
      "按 tasks 顺序调用 search(task)，结果项含 snippet 与 url",
      "每个 section 返回 title、findings（snippet 列表）与 sources（该节 url 列表）",
      "报告顶层返回 topic、sections、sources；顶层 sources 全局去重并保持首次出现顺序",
      "空 tasks 返回空 sections 与 sources，不能伪造研究结果",
    ],
    starterCode: "def build_research_report(topic, tasks, search):\n    sections = []\n    sources = []\n    # 逐个检索子任务并汇总引用\n    return {\"topic\": topic, \"sections\": sections, \"sources\": sources}\n",
    hints: ["每个 task 的 search 结果先生成本节 findings 与 section_sources。", "顶层 sources 用成员检查去重，但不要改变各 section 的来源。"],
    tests: [
      {
        name: "多子任务与引用去重",
        expression: `_research_project_observation(build_research_report) == {"topic":"Agent 学习路线","sections":[{"title":"基础","findings":["先学 Python","理解工具调用"],"sources":["source-a","source-shared"]},{"title":"实践","findings":["实现 ReAct","加入评估"],"sources":["source-shared","source-b"]}],"sources":["source-a","source-shared","source-b"]}`,
        failure: "应按任务生成完整章节，并在顶层去重来源同时保持顺序。",
        feedback: {
          expected: "2 个完整 section；顶层来源为 a、shared、b",
          actualExpression: `_research_project_observation(build_research_report)`,
          rule: "对应 Hello-Agents DeepResearch 的规划—收集—报告链路",
        },
      },
      {
        name: "空研究计划不伪造结果",
        expression: `build_research_report("空主题", [], lambda task: 1 / 0) == {"topic":"空主题","sections":[],"sources":[]}`,
        failure: "空任务时不应调用 search，也不能生成虚假章节。",
        feedback: {
          expected: `{"topic": "空主题", "sections": [], "sources": []}`,
          actualExpression: `build_research_report("空主题", [], lambda task: 1 / 0)`,
          rule: "没有检索就没有研究结论",
        },
      },
    ],
  },
  {
    id: "agent-framework-capstone",
    module: "Agent 案例实战",
    number: 25,
    title: "毕业设计：Mini Agent 框架",
    kicker: "Hello-Agents 第七章 · 从零造轮子",
    minutes: 65,
    goal: "把工具注册、ReAct 循环、步数限制和运行状态整合成一个可复用的 Agent 类。",
    project: true,
    source: { label: "Hello-Agents 第七章：构建你的 Agent 框架", url: HELLO_AGENTS_CHAPTER_7 },
    concepts: [
      {
        title: "Agent 是稳定入口，能力来自 Tools",
        body: "Hello-Agents 的教学架构强调核心 Agent 加工具系统。run 提供统一入口，具体外部能力通过 register_tool 扩展。",
        example: "agent.register_tool('echo', echo)\nagent.run(actions)",
      },
      {
        title: "一次 run 就是一个独立会话",
        body: "每次运行都必须重置 history，避免上一位用户或上一项任务的观察污染新任务。",
        example: "def run(self, actions):\n    self.history = []",
      },
    ],
    requirements: [
      "实现 Agent(name, max_steps=5)，保存 name、max_steps、tools 与 history",
      "register_tool(name, func) 注册工具；重复名称抛 ValueError",
      "run(actions) 支持 tool[payload] 与 Finish[answer]，每次运行先重置 history",
      "工具记录格式为 {'action', 'input', 'observation'}；返回 {'answer', 'history'}",
      "最多处理 max_steps 个动作；未知工具抛 KeyError；未 Finish 时 answer 为 None",
    ],
    starterCode: "class Agent:\n    def __init__(self, name, max_steps=5):\n        pass\n\n    def register_tool(self, name, func):\n        pass\n\n    def run(self, actions):\n        pass\n",
    hints: ["把解析 action 的小逻辑放成类内私有方法会更清晰。", "run 开头重置 self.history；遍历 actions[:self.max_steps]。"],
    tests: [
      {
        name: "完整框架契约",
        expression: `_mini_agent_contract(Agent)`,
        failure: "Agent 应注册工具、执行动作、记录观察、处理 Finish，并在第二次 run 前重置历史。",
        feedback: {
          expected: "第一次执行工具后 Finish；第二次只有全新 Finish 且 history 为空",
          actualExpression: `_mini_agent_observation(Agent)`,
          rule: "用两个连续会话验证框架状态隔离",
        },
      },
      {
        name: "框架错误边界",
        expression: `_mini_agent_errors(Agent) == (True, True)`,
        failure: "重复工具应抛 ValueError，未知工具应抛 KeyError。",
        feedback: {
          expected: "(True, True)",
          actualExpression: `_mini_agent_errors(Agent)`,
          rule: "框架不吞错、不伪造 Observation",
        },
      },
      {
        name: "最大步数不伪造完成",
        expression: `_mini_agent_limit(Agent) == {"answer":None,"history":[{"action":"echo","input":"one","observation":"ONE"}]}`,
        failure: "max_steps=1 时不能继续读取第二个 Finish。",
        feedback: {
          expected: `{"answer": None, "history": 1 条真实观察}`,
          actualExpression: `_mini_agent_limit(Agent)`,
          rule: "达到安全上限后真实停止",
        },
      },
    ],
  },
];

export const lessonsByModule = MODULE_ORDER.map((module) => ({
  module,
  lessons: lessons.filter((lesson) => lesson.module === module),
}));

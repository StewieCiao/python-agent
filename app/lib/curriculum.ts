export type LessonTest = {
  name: string;
  expression: string;
  failure: string;
  feedback?: {
    expected: string;
    actualLine: number;
    rule: string;
  };
};

export type Lesson = {
  id: string;
  module: "基础语法" | "基础编程" | "高级编程" | "项目实战";
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
};

export const MODULE_ORDER = ["基础语法", "基础编程", "高级编程", "项目实战"] as const;

export const lessons: Lesson[] = [
  {
    id: "first-output",
    module: "基础语法",
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
      "第二行用乘法表达式输出 56；8*7、7*8，以及运算符两侧加空格都可以",
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
        name: "第二行是乘法结果（乘数顺序不限）",
        expression: `_uses_multiplication(_source) and len(_output_lines) >= 2 and _output_lines[1].strip() == "56"`,
        failure: "第二行应输出乘法计算得到的 56；8*7 与 7*8 都会通过。",
        feedback: {
          expected: "56（由乘法表达式计算）",
          actualLine: 1,
          rule: "允许 8*7、7*8，以及运算符两侧任意空格",
        },
      },
    ],
  },
  {
    id: "variables",
    module: "基础语法",
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
      { name: "name 保存正确", expression: `name == "小派"`, failure: "变量 name 应保存字符串“小派”。" },
      { name: "level 是数字 1", expression: `level == 1 and isinstance(level, int)`, failure: "level 应是整数 1，而不是字符串。" },
      {
        name: "输出完全匹配",
        expression: `_stdout.strip() == "小派正在挑战第 1 关"`,
        failure: "输出应为“小派正在挑战第 1 关”，请检查空格。",
      },
    ],
  },
  {
    id: "strings",
    module: "基础语法",
    number: 3,
    title: "处理真实文本",
    kicker: "字符串方法",
    minutes: 12,
    goal: "清理用户输入，并提取文本中的有效信息。",
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
    requirements: ['变量 raw 的值保持为 "  PyThOn 学习  "', "生成 clean：去除两端空格并转为小写", "输出 clean 和它的前 6 个字符"],
    starterCode: 'raw = "  PyThOn 学习  "\n\n# 生成 clean\n\n# 分两行输出\n',
    hints: ["可以连续调用 .strip().lower()。", "前 6 个字符的切片是 clean[:6]。"],
    tests: [
      { name: "清理结果正确", expression: `clean == "python 学习"`, failure: "clean 应同时完成去空格和小写转换。" },
      {
        name: "两行输出正确",
        expression: `_stdout.strip().splitlines() == ["python 学习", "python"]`,
        failure: "第一行输出 clean，第二行输出它的前 6 个字符。",
      },
    ],
  },
  {
    id: "branches",
    module: "基础语法",
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
    requirements: ["实现函数 grade(score)", "90 分及以上返回 A；60–89 返回 B；低于 60 返回 C", "不要使用三个互相独立的 if"],
    starterCode: 'def grade(score):\n    # 在这里完成分支\n    pass\n',
    hints: ["先判断 score >= 90，再判断 score >= 60。", "每个分支直接 return，就不需要额外变量。"],
    tests: [
      { name: "高分段", expression: `grade(90) == "A" and grade(100) == "A"`, failure: "90 和 100 都应返回 A。" },
      { name: "中间分段", expression: `grade(60) == "B" and grade(89) == "B"`, failure: "60 到 89 应返回 B。" },
      { name: "低分段", expression: `grade(0) == "C" and grade(59) == "C"`, failure: "低于 60 应返回 C。" },
    ],
  },
  {
    id: "loops",
    module: "基础编程",
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
    requirements: ["遍历 numbers", "只累加其中的偶数", "最后输出总和 18"],
    starterCode: "numbers = [3, 4, 7, 6, 8, 1]\ntotal = 0\n\n# 写一个循环\n\nprint(total)\n",
    hints: ["偶数满足 number % 2 == 0。", "只有条件成立时才执行 total += number。"],
    tests: [
      { name: "偶数和正确", expression: `total == 18`, failure: "4 + 6 + 8 的结果应为 18。" },
      { name: "使用循环", expression: `"for " in _source`, failure: "请使用 for 循环，而不是直接写出答案。" },
      { name: "输出结果", expression: `_stdout.strip() == "18"`, failure: "循环结束后输出 total。" },
    ],
  },
  {
    id: "functions",
    module: "基础编程",
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
      { name: "会员免运费", expression: `shipping_fee(20, True) == 0`, failure: "会员无论金额多少都应返回 0。" },
      { name: "满额免运费", expression: `shipping_fee(99, False) == 0`, failure: "非会员满 99 元也应返回 0。" },
      { name: "普通运费", expression: `shipping_fee(98, False) == 10`, failure: "非会员且未满 99 元应返回 10。" },
      { name: "函数不打印", expression: `_stdout == ""`, failure: "函数应 return 结果，不要在函数内 print。" },
    ],
  },
  {
    id: "lists",
    module: "基础编程",
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
    requirements: ["从 scores 中选出及格分数（>= 60）", "给每个及格分数加 5 分，但最高不超过 100", "结果保存为 improved"],
    starterCode: "scores = [48, 60, 77, 98, 35]\n\nimproved = []\n",
    hints: ["先筛选 score >= 60。", "min(score + 5, 100) 可以限制上限。"],
    tests: [
      { name: "结果内容正确", expression: `improved == [65, 82, 100]`, failure: "期望得到 [65, 82, 100]。" },
      { name: "使用推导式", expression: `"[" in _source and " for " in _source`, failure: "请尝试用一个列表推导式完成。" },
    ],
  },
  {
    id: "dictionaries",
    module: "基础编程",
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
    requirements: ["统计 words 中每个单词出现次数", "保存到 counts 字典", "不要提前写死任何单词键"],
    starterCode: 'words = ["py", "go", "py", "js", "py", "go"]\ncounts = {}\n\n# 遍历并统计\n',
    hints: ["每轮用 word 作为 counts 的键。", "右侧可以写 counts.get(word, 0) + 1。"],
    tests: [
      {
        name: "频次统计正确",
        expression: `counts == {"py": 3, "go": 2, "js": 1}`,
        failure: "py、go、js 的次数应分别为 3、2、1。",
      },
      { name: "结果是字典", expression: `isinstance(counts, dict)`, failure: "counts 应保持为字典。" },
    ],
  },
  {
    id: "exceptions",
    module: "高级编程",
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
      { name: "有效年龄", expression: `parse_age("18") == 18`, failure: "字符串“18”应转换为整数 18。" },
      { name: "无效年龄", expression: `parse_age("十八") is None`, failure: "无法转换时应返回 None。" },
      {
        name: "捕获范围清晰",
        expression: `"except ValueError" in _source and "except Exception" not in _source and "except BaseException" not in _source`,
        failure: "请只捕获 ValueError。",
      },
    ],
  },
  {
    id: "classes",
    module: "高级编程",
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
      },
      {
        name: "存款更新并返回",
        expression: `(lambda w: w.deposit(30) == 30 and w.balance == 30)(Wallet())`,
        failure: "deposit(30) 后应返回 30，余额也应为 30。",
      },
      {
        name: "拒绝非法金额",
        expression: `(lambda: _raises_value_error(lambda: Wallet().deposit(0)))()`,
        failure: "amount <= 0 时应抛出 ValueError。",
      },
    ],
  },
  {
    id: "generators",
    module: "高级编程",
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
      { name: "边界与顺序", expression: `list(even_numbers(6)) == [0, 2, 4, 6]`, failure: "limit=6 时应依次产生 0、2、4、6。" },
      { name: "确实是生成器", expression: `inspect.isgenerator(even_numbers(2))`, failure: "请使用 yield，让函数返回生成器。" },
      { name: "无中间列表", expression: `"yield" in _source and "return [" not in _source`, failure: "使用 yield 按需产生值。" },
    ],
  },
  {
    id: "decorators",
    module: "高级编程",
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
      { name: "返回第二次结果", expression: `add(2, 3) == 5`, failure: "装饰后的 add(2, 3) 应返回 5。" },
      {
        name: "确实调用两次",
        expression: `_decorator_called_twice(twice)`,
        failure: "包装器应调用原函数两次。",
      },
      { name: "转发任意参数", expression: `"*args" in _source and "**kwargs" in _source`, failure: "包装函数应接收并转发 *args、**kwargs。" },
    ],
  },
  {
    id: "project-text",
    module: "项目实战",
    number: 13,
    title: "文本分析器",
    kicker: "项目 · 数据清洗",
    minutes: 35,
    goal: "组合字符串、列表和字典，完成一个可复用的文本统计函数。",
    project: true,
    concepts: [
      {
        title: "先定义输入输出契约",
        body: "函数接收文本，返回结构稳定的字典，测试才有明确目标。",
        example: '{"words": 4, "unique": 3, "top": "python"}',
      },
      {
        title: "让数据逐步变干净",
        body: "先统一大小写，再分词，再统计；每一步只做一件事。",
        example: "words = text.lower().split()",
      },
    ],
    requirements: ["实现 analyze(text)", "忽略大小写并按空白分词", "返回 words、unique、top 三个字段", "top 为出现最多的单词"],
    starterCode: "def analyze(text):\n    # 1. 清洗并分词\n    # 2. 统计次数\n    # 3. 返回结果\n    pass\n",
    hints: ["words 数量是 len(words)，unique 是 len(counts)。", "max(counts, key=counts.get) 能找到次数最高的键。"],
    tests: [
      {
        name: "基本统计",
        expression: `analyze("Py py code") == {"words": 3, "unique": 2, "top": "py"}`,
        failure: "“Py py code” 应得到 words=3、unique=2、top=py。",
      },
      {
        name: "按任意空白分词",
        expression: `analyze("one\\n two\\tone")["top"] == "one"`,
        failure: "split() 应能处理换行和制表符。",
      },
    ],
  },
  {
    id: "project-expense",
    module: "项目实战",
    number: 14,
    title: "消费汇总器",
    kicker: "项目 · 结构化数据",
    minutes: 40,
    goal: "从记录列表中计算总额和分类汇总，形成常见业务数据处理能力。",
    project: true,
    concepts: [
      {
        title: "记录列表是常见输入",
        body: "每条字典是一条记录，循环把记录累积成汇总结果。",
        example: '{"category": "餐饮", "amount": 28}',
      },
      {
        title: "金额计算要集中",
        body: "同一个循环同时更新总额与分类，但不要重复遍历。",
        example: "by_category[key] = by_category.get(key, 0) + amount",
      },
    ],
    requirements: ["实现 summarize(records)", "返回 total 和 by_category", "空列表也返回 total=0 与空字典", "只遍历 records 一次"],
    starterCode: "def summarize(records):\n    total = 0\n    by_category = {}\n    # 完成一次遍历\n    return {\"total\": total, \"by_category\": by_category}\n",
    hints: ["每条 record 用 record['amount'] 和 record['category'] 取值。", "在同一个 for 循环中更新 total 与 by_category。"],
    tests: [
      {
        name: "汇总正确",
        expression: `summarize([{"category":"餐饮","amount":28},{"category":"交通","amount":12},{"category":"餐饮","amount":20}]) == {"total":60,"by_category":{"餐饮":48,"交通":12}}`,
        failure: "总额应为 60，餐饮 48，交通 12。",
      },
      { name: "空输入", expression: `summarize([]) == {"total": 0, "by_category": {}}`, failure: "空列表应返回零总额和空分类。" },
      { name: "一次遍历", expression: `_source.count("for ") == 1`, failure: "这个项目只需要一个 for 循环。" },
    ],
  },
  {
    id: "project-tasks",
    module: "项目实战",
    number: 15,
    title: "任务优先级引擎",
    kicker: "毕业项目 · 综合建模",
    minutes: 50,
    goal: "综合函数、排序、异常边界与清晰数据契约，完成可扩展的小型项目。",
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
      },
      {
        name: "拒绝非法优先级",
        expression: `_raises_value_error(lambda: plan([{"name":"bad","priority":0}]))`,
        failure: "priority 不在 1–5 时应抛出 ValueError。",
      },
      {
        name: "不修改输入",
        expression: `_plan_preserves_input(plan)`,
        failure: "请返回新结果，不要原地修改 tasks。",
      },
    ],
  },
];

export const lessonsByModule = MODULE_ORDER.map((module) => ({
  module,
  lessons: lessons.filter((lesson) => lesson.module === module),
}));

import type { CourseLesson, CourseStage, CourseTrack } from "./schema.ts";

type Expansion = { targetLessons: number; stageCount: number; projectCount: number; stageTitles: string[] };

const SOURCES: Record<CourseTrack["id"], { label: string; url: string }> = {
  python: { label: "Python 官方教程", url: "https://docs.python.org/3/tutorial/" },
  "langchain-rag": { label: "LangChain 官方文档", url: "https://docs.langchain.com/oss/python/langchain/overview" },
  langgraph: { label: "LangGraph 官方文档", url: "https://docs.langchain.com/oss/python/langgraph/overview" },
};

const TOPICS: Record<CourseTrack["id"], string[]> = {
  python: ["变量与类型", "字符串处理", "条件分支", "循环与迭代", "函数参数", "作用域", "列表与切片", "字典聚合", "集合运算", "异常边界", "类与对象", "生成器", "装饰器", "模块拆分", "文件读写", "测试设计", "数据清洗", "命令行工具", "并发基础", "Agent 工具契约"],
  "langchain-rag": ["消息角色", "Prompt 模板", "结构化输出", "Runnable 组合", "模型配置", "文档加载", "文本切分", "Embedding", "向量存储", "相似度检索", "混合检索", "重排", "引用生成", "无答案边界", "RAG 评估", "追踪与观测", "工具调用", "Agent 循环", "多查询检索", "RAG 项目"],
  langgraph: ["StateGraph", "节点与边", "状态更新", "条件路由", "循环终止", "Reducer", "Checkpoint", "thread_id", "短期记忆", "Store", "长期记忆", "Interrupt", "恢复执行", "流式事件", "子图", "并行分支", "Supervisor", "多 Agent 协作", "人工审核", "Graph 项目"],
};

const PROJECT_BRIEFS: Record<"langchain-rag" | "langgraph", Array<{ title: string; summary: string }>> = {
  "langchain-rag": [
    { title: "可引用文档问答系统", summary: "为团队建立可追溯的文档问答入口，回答始终带真实来源。" },
    { title: "混合检索评估台", summary: "为检索调优提供关键词、向量召回和命中率对比。" },
    { title: "带工具调用的知识助手", summary: "为业务助手连接受约束的工具，并保留每次调用结果。" },
    { title: "RAG 质量观测面板", summary: "为 RAG 流程记录召回、引用和无答案边界，定位质量回归。" },
  ],
  langgraph: [
    { title: "可恢复研究工作流", summary: "为研究任务建立可暂停、可恢复且按 thread 隔离的工作流。" },
    { title: "人工审核 Agent 流程", summary: "为高风险动作加入人工审核节点，拒绝时留下明确状态。" },
    { title: "多 Agent 协作调度器", summary: "为多角色 Agent 设计可观察的交接和 supervisor 路由。" },
    { title: "带长期记忆的任务图", summary: "为用户偏好建立跨 thread 的 Store，并与短期状态分离。" },
  ],
};

type TopicSpec = {
  summary: string;
  prompt: string;
  starterCode: string;
  solution: string;
  hints: string[];
  checks: CourseLesson["browserChecks"];
};

const PYTHON_TOPIC_SPECS: Record<string, TopicSpec> = {
  "变量与类型": {
    summary: "用明确的值和类型转换表达数据契约，避免把字符串误当数字。",
    prompt: "实现 parse_price(text)，把带空白的数字文本转换为 float；空文本或非数字输入返回 None。",
    starterCode: "def parse_price(text):\n    pass\n",
    solution: "def parse_price(text):\n    text = text.strip()\n    if not text:\n        return None\n    try:\n        return float(text)\n    except ValueError:\n        return None\n",
    hints: ["先清理输入两端空白。", "空文本不应交给 float。", "只把转换失败当作无效价格。"],
    checks: [
      { name: "转换数字", expression: "parse_price(\" 12.5 \") == 12.5", failure: "数字文本应转换为 float。", kind: "behavior" },
      { name: "拒绝无效值", expression: "parse_price(\"\") is None and parse_price(\"x\") is None", failure: "空文本和非数字应返回 None。", kind: "behavior" },
    ],
  },
  "字符串处理": {
    summary: "组合字符串方法完成清洗，同时保留输入语义和顺序。",
    prompt: "实现 slugify(title)，去掉两端空白、转小写，并把连续空格替换为一个连字符。",
    starterCode: "def slugify(title):\n    pass\n",
    solution: "def slugify(title):\n    return \"-\".join(title.strip().lower().split())\n",
    hints: ["strip 处理两端空白。", "split 不带参数可以合并连续空白。", "用 join 重新组合清洗后的片段。"],
    checks: [
      { name: "清洗文本", expression: "slugify(\"  Hello   Python  \") == \"hello-python\"", failure: "应同时清理两端和连续空白。", kind: "behavior" },
      { name: "中文保持", expression: "slugify(\" RAG 学习 \") == \"rag-学习\"", failure: "清洗不应破坏非 ASCII 文字。", kind: "behavior" },
    ],
  },
  "条件分支": {
    summary: "用互斥边界表达业务分类，让每个输入只落入一个结果。",
    prompt: "实现 shipping_level(weight)：weight <= 0 返回 invalid；小于 1 返回 light；1–5 返回 standard；大于 5 返回 heavy。",
    starterCode: "def shipping_level(weight):\n    pass\n",
    solution: "def shipping_level(weight):\n    if weight <= 0:\n        return \"invalid\"\n    if weight < 1:\n        return \"light\"\n    if weight <= 5:\n        return \"standard\"\n    return \"heavy\"\n",
    hints: ["先处理无效输入，避免它落入正常区间。", "按边界从小到大检查。", "测试 0、0.5、1、5 和 5.1。"],
    checks: [
      { name: "边界分类", expression: "[shipping_level(x) for x in [0, 0.5, 1, 5, 6]] == [\"invalid\", \"light\", \"standard\", \"standard\", \"heavy\"]", failure: "各重量边界应进入正确分类。", kind: "behavior" },
      { name: "负数", expression: "shipping_level(-2) == \"invalid\"", failure: "负重量必须被拒绝。", kind: "behavior" },
    ],
  },
  "循环与迭代": {
    summary: "用一次清晰遍历完成筛选和汇总，并处理空输入。",
    prompt: "实现 longest_word(words)，返回最长单词；空列表返回 None，长度相同返回先出现的单词。",
    starterCode: "def longest_word(words):\n    pass\n",
    solution: "def longest_word(words):\n    if not words:\n        return None\n    longest = words[0]\n    for word in words[1:]:\n        if len(word) > len(longest):\n            longest = word\n    return longest\n",
    hints: ["先定义空列表的结果。", "把第一个元素作为当前最佳值。", "只在严格更长时替换，保持同长度的先后顺序。"],
    checks: [
      { name: "最长值", expression: "longest_word([\"api\", \"langchain\", \"rag\"]) == \"langchain\"", failure: "应返回实际最长单词。", kind: "behavior" },
      { name: "空与并列", expression: "longest_word([]) is None and longest_word([\"ab\", \"cd\"]) == \"ab\"", failure: "应明确处理空输入和并列长度。", kind: "behavior" },
    ],
  },
  "作用域": {
    summary: "区分局部与全局名字，写出不依赖隐式全局状态的函数。",
    prompt: "实现 make_counter(start)，每次调用返回递增 1 的数字；不同计数器之间不能互相影响。",
    starterCode: "def make_counter(start):\n    pass\n",
    solution: "def make_counter(start):\n    current = start\n    def next_value():\n        nonlocal current\n        current += 1\n        return current\n    return next_value\n",
    hints: ["先找出需要跨调用保留的值。", "把状态放在外层函数的局部作用域。", "内部函数修改外层变量时需要声明 nonlocal。"],
    checks: [
      { name: "连续调用递增", expression: "((lambda counter: [counter(), counter(), counter()])(make_counter(4))) == [5, 6, 7]", failure: "同一个计数器应连续递增。", kind: "behavior" },
      { name: "实例彼此隔离", expression: "((lambda a, b: (a(), b(), a(), b()))(make_counter(0), make_counter(10))) == (1, 11, 2, 12)", failure: "两个计数器不能共享可变全局状态。", kind: "behavior" },
    ],
  },
  "列表与切片": {
    summary: "用切片和步长提取数据，不修改调用者传入的原列表。",
    prompt: "实现 take_every_other(items)，返回从第一个元素开始每隔一个元素的新列表。",
    starterCode: "def take_every_other(items):\n    pass\n",
    solution: "def take_every_other(items):\n    return items[::2]\n",
    hints: ["切片格式是 start:stop:step。", "步长为 2 可以跳过一个元素。", "切片会产生新列表，检查空列表和单元素输入。"],
    checks: [
      { name: "保留顺序", expression: "take_every_other([10, 20, 30, 40, 50]) == [10, 30, 50]", failure: "应从首元素开始每隔一个取值。", kind: "behavior" },
      { name: "不修改原列表", expression: "((lambda items: (take_every_other(items), items))([10, 20, 30])) == ([10, 30], [10, 20, 30])", failure: "函数不应就地修改输入列表。", kind: "behavior" },
    ],
  },
  "字典聚合": {
    summary: "通过键动态聚合记录，支持题目示例之外的新类别。",
    prompt: "实现 count_categories(records)，统计每条记录的 category，返回新的字典；不能预先写死键。",
    starterCode: "def count_categories(records):\n    counts = {}\n    return counts\n",
    solution: "def count_categories(records):\n    counts = {}\n    for record in records:\n        category = record[\"category\"]\n        counts[category] = counts.get(category, 0) + 1\n    return counts\n",
    hints: ["每条记录都提供一个 category。", "用 get(category, 0) 处理第一次出现。", "用未在示例出现的 category 验证动态建键。"],
    checks: [
      { name: "动态统计", expression: "count_categories([{\"category\": \"rust\"}, {\"category\": \"py\"}, {\"category\": \"rust\"}]) == {\"rust\": 2, \"py\": 1}", failure: "应按输入记录动态统计每个类别。", kind: "behavior" },
      { name: "空输入", expression: "count_categories([]) == {}", failure: "空输入应返回空字典。", kind: "behavior" },
    ],
  },
  "异常边界": {
    summary: "只处理契约允许的异常，把真正的编程错误继续抛出。",
    prompt: "实现 parse_positive_int(text)：文本不是整数时返回 None，整数小于等于 0 时也返回 None；不要吞掉 TypeError。",
    starterCode: "def parse_positive_int(text):\n    pass\n",
    solution: "def parse_positive_int(text):\n    try:\n        value = int(text)\n    except ValueError:\n        return None\n    return value if value > 0 else None\n",
    hints: ["int(text) 可能抛出 ValueError。", "捕获范围只覆盖允许恢复的转换错误。", "用 None 与 TypeError 探针分别验证两种边界。"],
    checks: [
      { name: "有效值", expression: "parse_positive_int(\"12\") == 12", failure: "合法正整数应返回 int。", kind: "behavior" },
      { name: "无效值", expression: "parse_positive_int(\"0\") is None and parse_positive_int(\"x\") is None", failure: "零和非数字文本应返回 None。", kind: "behavior" },
      { name: "TypeError 外溢", expression: "_raises_type_error(lambda: parse_positive_int(None))", failure: "不要把 None 这类编程错误静默吞掉。", kind: "behavior" },
    ],
  },
  "类与对象": {
    summary: "把不变量和行为封装在对象中，让每个实例拥有独立状态。",
    prompt: "实现 Wallet 类：初始余额为 0，deposit(amount) 只接受正数并增加余额，balance() 返回当前余额。",
    starterCode: "class Wallet:\n    pass\n",
    solution: "class Wallet:\n    def __init__(self):\n        self._amount = 0\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError(\"amount must be positive\")\n        self._amount += amount\n\n    def balance(self):\n        return self._amount\n",
    hints: ["把余额放在实例属性，而不是类属性。", "存款前先验证边界。", "分别测试两个 Wallet，确认状态不共享。"],
    checks: [
      { name: "连续存款", expression: "((lambda wallet: (wallet.deposit(5), wallet.deposit(7), wallet.balance()))(Wallet()))[-1] == 12", failure: "连续存款应累加余额。", kind: "behavior" },
      { name: "拒绝非正数", expression: "_raises_value_error(lambda: Wallet().deposit(0)) and _raises_value_error(lambda: Wallet().deposit(-1))", failure: "零和负数存款应抛出 ValueError。", kind: "behavior" },
    ],
  },
  "生成器": {
    summary: "用 yield 延迟产生值，处理大输入时只保留当前元素。",
    prompt: "实现 positive_numbers(values)，按原顺序逐个 yield 大于 0 的数字，不返回预先构造的列表。",
    starterCode: "def positive_numbers(values):\n    pass\n",
    solution: "def positive_numbers(values):\n    for value in values:\n        if value > 0:\n            yield value\n",
    hints: ["函数中使用 yield 就会得到生成器。", "在循环中判断每个值。", "用 list() 只在测试时收集结果，函数本身不要建立结果列表。"],
    checks: [
      { name: "延迟遍历", expression: "_is_generator_function(positive_numbers) and list(positive_numbers([-2, 0, 3, 5])) == [3, 5]", failure: "应以生成器形式按需产生正数。", kind: "behavior" },
      { name: "空与负数", expression: "list(positive_numbers([])) == [] and list(positive_numbers([-3, -1])) == []", failure: "没有正数时应自然结束。", kind: "behavior" },
    ],
  },
  "装饰器": {
    summary: "在不改变被装饰函数签名的前提下记录调用次数与结果。",
    prompt: "实现 twice(func) 装饰器：保留位置参数和关键字参数，每次调用原函数两次并返回第二次结果。",
    starterCode: "def twice(func):\n    pass\n",
    solution: "from functools import wraps\n\ndef twice(func):\n    @wraps(func)\n    def wrapper(*positional, **named):\n        func(*positional, **named)\n        return func(*positional, **named)\n    return wrapper\n",
    hints: ["包装器需要接收任意位置和关键字参数。", "第一次调用的返回值可以丢弃。", "第二次调用的返回值才是装饰器结果。"],
    checks: [
      { name: "位置参数", expression: "_decorator_probe(twice)", failure: "两次调用的参数和结果必须保持一致。", kind: "behavior" },
      { name: "关键字参数", expression: "_decorator_kwargs_probe(twice)", failure: "不能丢失关键字参数。", kind: "behavior" },
    ],
  },
  "文件读写": {
    summary: "用上下文管理器可靠地打开、读取和关闭文件。",
    prompt: "实现 read_nonempty_lines(path)，读取文件并返回去除换行的非空行列表；文件必须由 with 管理。",
    starterCode: "def read_nonempty_lines(path):\n    pass\n",
    solution: "def read_nonempty_lines(path):\n    with open(path, encoding=\"utf-8\") as file:\n        return [line.strip() for line in file if line.strip()]\n",
    hints: ["with open 可以保证离开代码块时关闭文件。", "逐行处理比一次性猜测格式更清楚。", "先 strip，再过滤空行。"],
    checks: [
      { name: "保留非空行", expression: "_file_probe(read_nonempty_lines, [\" a \", \"\\n\", \"b\\n\"]) == [\"a\", \"b\"]", failure: "应清理换行并跳过空行。", kind: "behavior" },
      { name: "不存在文件报错", expression: "_raises_file_not_found(read_nonempty_lines)", failure: "不要把真实文件错误伪装成空列表。", kind: "behavior" },
    ],
  },
  "函数参数": {
    summary: "用默认值和关键字参数表达可选配置，保持调用意图清楚。",
    prompt: "实现 describe_task(name, priority=\"normal\")，返回包含任务名和优先级的字典；调用者可用关键字覆盖默认值。",
    starterCode: "def describe_task(name, priority=\"normal\"):\n    pass\n",
    solution: "def describe_task(name, priority=\"normal\"):\n    return {\"name\": name, \"priority\": priority}\n",
    hints: ["默认参数只在调用者未提供时生效。", "返回结构应由参数组成，不要写死任务名。", "分别用位置和关键字调用验证。"],
    checks: [
      { name: "默认参数", expression: "describe_task(\"整理笔记\") == {\"name\": \"整理笔记\", \"priority\": \"normal\"}", failure: "省略 priority 时应使用 normal。", kind: "behavior" },
      { name: "关键字覆盖", expression: "describe_task(\"修复测试\", priority=\"high\")[\"priority\"] == \"high\"", failure: "关键字参数应覆盖默认值。", kind: "behavior" },
    ],
  },
  "集合运算": {
    summary: "用集合表达去重与成员关系，明确是否保留顺序。",
    prompt: "实现 common_tags(left, right)，返回两个列表共有标签的排序后列表，重复标签只保留一次。",
    starterCode: "def common_tags(left, right):\n    pass\n",
    solution: "def common_tags(left, right):\n    return sorted(set(left) & set(right))\n",
    hints: ["先把列表转换为集合去重。", "交集运算符是 &。", "排序让返回结果稳定、便于测试。"],
    checks: [
      { name: "交集去重", expression: "common_tags([\"rag\", \"python\", \"rag\"], [\"graph\", \"rag\"]) == [\"rag\"]", failure: "应只返回共有且去重后的标签。", kind: "behavior" },
      { name: "无交集", expression: "common_tags([\"a\"], [\"b\"]) == []", failure: "没有共有标签时应返回空列表。", kind: "behavior" },
    ],
  },
  "测试设计": {
    summary: "用小而明确的测试锁定行为和边界，而不是只测试一条成功路径。",
    prompt: "实现 is_valid_username(name)：长度 3–12 且只含字母、数字或下划线时返回 True，否则 False。",
    starterCode: "def is_valid_username(name):\n    pass\n",
    solution: "def is_valid_username(name):\n    return 3 <= len(name) <= 12 and name.replace(\"_\", \"\").isalnum()\n",
    hints: ["先检查长度的两个边界。", "replace 后用 isalnum 检查允许字符。", "测试空串、3 个字符、12 个字符和非法符号。"],
    checks: [
      { name: "合法边界", expression: "is_valid_username(\"abc\") and is_valid_username(\"a\" * 12)", failure: "长度边界内的合法名字应通过。", kind: "behavior" },
      { name: "非法输入", expression: "not is_valid_username(\"ab\") and not is_valid_username(\"bad-name\")", failure: "过短或含非法符号的名字应拒绝。", kind: "behavior" },
    ],
  },
  "数据清洗": {
    summary: "把脏输入的清洗规则写成可复用步骤，并保留有效记录。",
    prompt: "实现 clean_scores(values)，把可转换为整数且在 0–100 的值返回为整数列表，忽略其他值。",
    starterCode: "def clean_scores(values):\n    pass\n",
    solution: "def clean_scores(values):\n    scores = []\n    for value in values:\n        try:\n            score = int(value)\n        except (TypeError, ValueError):\n            continue\n        if 0 <= score <= 100:\n            scores.append(score)\n    return scores\n",
    hints: ["转换失败和范围不合法是两类不同边界。", "只把通过两层检查的值加入结果。", "使用字符串、数字、None 和超范围值混合测试。"],
    checks: [
      { name: "混合输入", expression: "clean_scores([\"80\", 95, \"x\", -1, 101]) == [80, 95]", failure: "应保留可转换且在范围内的分数。", kind: "behavior" },
      { name: "空输入", expression: "clean_scores([]) == []", failure: "空输入应返回空列表。", kind: "behavior" },
    ],
  },
  "Agent 工具契约": {
    summary: "把工具输入、输出和失败状态写成稳定契约，供 Agent 安全调用。",
    prompt: "实现 weather_tool(city)，返回包含 city 和 condition 的字典；空城市名应抛出 ValueError，不返回伪造天气。",
    starterCode: "def weather_tool(city):\n    pass\n",
    solution: "def weather_tool(city):\n    if not isinstance(city, str) or not city.strip():\n        raise ValueError(\"city is required\")\n    return {\"city\": city.strip(), \"condition\": \"unknown\"}\n",
    hints: ["工具先验证输入契约，再执行实际工作。", "错误输入不能返回看似成功的默认结果。", "输出字段要稳定，便于模型和测试读取。"],
    checks: [
      { name: "输出契约", expression: "weather_tool(\" 成都 \") == {\"city\": \"成都\", \"condition\": \"unknown\"}", failure: "工具应返回稳定字段并清理城市名。", kind: "behavior" },
      { name: "输入失败", expression: "_raises_value_error(lambda: weather_tool(\"\"))", failure: "空城市名应明确失败，不能伪造结果。", kind: "behavior" },
    ],
  },
  "模块拆分": {
    summary: "把可复用逻辑放进模块，并通过公开函数边界传递数据。",
    prompt: "实现 make_slug_module()，返回一个包含 slugify 函数的字典；slugify 应清洗空白并转小写。",
    starterCode: "def make_slug_module():\n    pass\n",
    solution: "def make_slug_module():\n    def slugify(text):\n        return \"-\".join(text.strip().lower().split())\n    return {\"slugify\": slugify}\n",
    hints: ["先定义模块对外暴露的函数名。", "把实现放在局部作用域，返回公开接口。", "通过字典取出函数后再调用验证。"],
    checks: [
      { name: "公开接口", expression: "callable(make_slug_module()[\"slugify\"])", failure: "模块应暴露可调用的 slugify。", kind: "behavior" },
      { name: "模块行为", expression: "make_slug_module()[\"slugify\"](\" Hello Python \") == \"hello-python\"", failure: "公开函数应清洗并规范化文本。", kind: "behavior" },
    ],
  },
  "命令行工具": {
    summary: "把命令行参数解析与业务函数分开，让入口可测试且错误明确。",
    prompt: "实现 parse_args(argv)，读取 --name 后的值并返回字典；缺少值或参数名错误时抛出 ValueError。",
    starterCode: "def parse_args(argv):\n    pass\n",
    solution: "def parse_args(argv):\n    if len(argv) != 2 or argv[0] != \"--name\" or not argv[1]:\n        raise ValueError(\"expected --name VALUE\")\n    return {\"name\": argv[1]}\n",
    hints: ["先验证参数数量和开关位置。", "空值也属于缺少参数。", "错误输入应抛出 ValueError 而不是伪造默认名。"],
    checks: [
      { name: "解析参数", expression: "parse_args([\"--name\", \"Stewie\"]) == {\"name\": \"Stewie\"}", failure: "应按约定读取 --name 的值。", kind: "behavior" },
      { name: "参数错误", expression: "_raises_value_error(lambda: parse_args([\"--name\"])) and _raises_value_error(lambda: parse_args([\"--other\", \"x\"]))", failure: "缺少值或未知参数应明确失败。", kind: "behavior" },
    ],
  },
  "并发基础": {
    summary: "用可观察的任务结果理解并发，不共享未经保护的可变状态。",
    prompt: "实现 run_tasks(tasks)，按输入顺序调用每个无参函数并返回结果列表；空任务列表返回空列表。",
    starterCode: "def run_tasks(tasks):\n    pass\n",
    solution: "def run_tasks(tasks):\n    return [task() for task in tasks]\n",
    hints: ["先明确任务是可调用对象。", "结果顺序应与输入任务顺序一致。", "不要用共享全局列表保存结果。"],
    checks: [
      { name: "按序执行", expression: "run_tasks([lambda: \"a\", lambda: 2]) == [\"a\", 2]", failure: "应返回每个任务的真实结果并保持顺序。", kind: "behavior" },
      { name: "空任务", expression: "run_tasks([]) == []", failure: "空任务列表应返回空结果。", kind: "behavior" },
    ],
  },
};

const FRAMEWORK_TOPIC_SPECS: Record<string, TopicSpec> = {
  "langgraph:StateGraph": {
    summary: "把状态模式、节点和入口组织成可读的图结构。",
    prompt: "实现 graph_shape(state, nodes)，返回包含 state_keys 与 node_count 的字典；不修改输入。",
    starterCode: "def graph_shape(state, nodes):\n    pass\n",
    solution: "def graph_shape(state, nodes):\n    return {\"state_keys\": sorted(state), \"node_count\": len(nodes)}\n",
    hints: ["StateGraph 先关心状态形状。", "节点数量来自输入列表。", "返回新字典，别在 state 上添加字段。"],
    checks: [
      { name: "描述图形状", expression: "graph_shape({\"messages\": []}, [\"start\", \"end\"]) == {\"state_keys\": [\"messages\"], \"node_count\": 2}", failure: "应同时返回状态键和节点数量。", kind: "behavior" },
      { name: "保持输入", expression: "((lambda state: (graph_shape(state, []), state))({\"count\": 1}))[1] == {\"count\": 1}", failure: "描述图结构不应修改输入状态。", kind: "behavior" },
    ],
  },
  "langgraph:节点与边": {
    summary: "用节点输出和边目标描述图的下一步，而不是隐藏控制流。",
    prompt: "实现 next_edge(edges, current)，返回 edges 中 current 的目标；未知节点抛出 KeyError。",
    starterCode: "def next_edge(edges, current):\n    pass\n",
    solution: "def next_edge(edges, current):\n    return edges[current]\n",
    hints: ["把边表当作 current 到目标的映射。", "字典索引会保留未知节点错误。", "不要为未知节点猜测默认目标。"],
    checks: [
      { name: "选择目标", expression: "next_edge({\"start\": \"review\", \"review\": \"end\"}, \"start\") == \"review\"", failure: "应返回当前节点配置的目标。", kind: "behavior" },
      { name: "未知节点", expression: "_raises_key_error(lambda: next_edge({\"start\": \"end\"}, \"missing\"))", failure: "未知节点应明确失败。", kind: "behavior" },
    ],
  },
  "langgraph:Reducer": {
    summary: "把多个节点更新合并成确定的状态，明确追加与覆盖语义。",
    prompt: "实现 merge_updates(state, update)，返回新状态；messages 列表追加，其余字段由 update 覆盖。",
    starterCode: "def merge_updates(state, update):\n    pass\n",
    solution: "def merge_updates(state, update):\n    merged = {**state, **update}\n    merged[\"messages\"] = [*state.get(\"messages\", []), *update.get(\"messages\", [])]\n    return merged\n",
    hints: ["先复制顶层状态。", "messages 使用追加 reducer。", "普通字段采用最新 update 的值。"],
    checks: [
      { name: "追加消息", expression: "merge_updates({\"messages\": [\"a\"], \"count\": 1}, {\"messages\": [\"b\"], \"count\": 2}) == {\"messages\": [\"a\", \"b\"], \"count\": 2}", failure: "消息应追加，普通字段应覆盖。", kind: "behavior" },
      { name: "不修改状态", expression: "((lambda state: (merge_updates(state, {\"messages\": [\"b\"]}), state))({\"messages\": [\"a\"]}))[1] == {\"messages\": [\"a\"]}", failure: "合并更新不应原地修改旧状态。", kind: "behavior" },
    ],
  },
  "langgraph:短期记忆": {
    summary: "把会话上下文放在当前 thread 状态中，并在边界处明确隔离。",
    prompt: "实现 append_message(threads, thread_id, message)，返回新字典并只追加到指定线程。",
    starterCode: "def append_message(threads, thread_id, message):\n    pass\n",
    solution: "def append_message(threads, thread_id, message):\n    updated = {key: list(value) for key, value in threads.items()}\n    updated.setdefault(thread_id, []).append(message)\n    return updated\n",
    hints: ["先复制每个线程的消息列表。", "setdefault 只为新线程创建列表。", "检查另一个 thread 的历史没有被污染。"],
    checks: [
      { name: "追加线程消息", expression: "append_message({\"a\": [\"hi\"]}, \"a\", \"there\") == {\"a\": [\"hi\", \"there\"]}", failure: "消息应追加到指定 thread。", kind: "behavior" },
      { name: "线程隔离", expression: "append_message({\"a\": [\"a\"], \"b\": [\"b\"]}, \"a\", \"x\")[\"b\"] == [\"b\"]", failure: "其他 thread 的历史必须保持不变。", kind: "behavior" },
    ],
  },
  "langgraph:Store": {
    summary: "用 namespace 和 key 保存跨线程资料，把长期数据与运行状态分开。",
    prompt: "实现 put_store(store, namespace, key, value)，返回新字典并只更新 namespace/key；不修改原 store。",
    starterCode: "def put_store(store, namespace, key, value):\n    pass\n",
    solution: "def put_store(store, namespace, key, value):\n    updated = {name: dict(values) for name, values in store.items()}\n    updated.setdefault(namespace, {})[key] = value\n    return updated\n",
    hints: ["先复制已有 namespace。", "key 只在目标 namespace 下生效。", "用两个 namespace 检查数据隔离。"],
    checks: [
      { name: "写入命名空间", expression: "put_store({}, \"user-1\", \"theme\", \"dark\") == {\"user-1\": {\"theme\": \"dark\"}}", failure: "值应保存到指定 namespace 和 key。", kind: "behavior" },
      { name: "保留原存储", expression: "((lambda store: (put_store(store, \"u\", \"k\", 1), store))({}))[1] == {}", failure: "写入 Store 不应修改原字典。", kind: "behavior" },
    ],
  },
  "langgraph:长期记忆": {
    summary: "按用户身份读取跨 thread 的偏好，避免把会话 id 当作用户 id。",
    prompt: "实现 read_preference(store, user_id, key)，从 user_id 命名空间读取 key；不存在返回 None。",
    starterCode: "def read_preference(store, user_id, key):\n    pass\n",
    solution: "def read_preference(store, user_id, key):\n    return store.get(user_id, {}).get(key)\n",
    hints: ["先按 user_id 找 namespace。", "再按 key 读取偏好。", "未知用户或 key 都返回 None，不读取其他用户。"],
    checks: [
      { name: "读取偏好", expression: "read_preference({\"u1\": {\"theme\": \"dark\"}}, \"u1\", \"theme\") == \"dark\"", failure: "应读取指定用户的长期偏好。", kind: "behavior" },
      { name: "用户隔离", expression: "read_preference({\"u1\": {\"theme\": \"dark\"}}, \"u2\", \"theme\") is None", failure: "未知用户不能拿到其他用户数据。", kind: "behavior" },
    ],
  },
  "langchain-rag:消息角色": {
    summary: "区分 system、user、assistant 消息，让提示上下文保持可预测。",
    prompt: "实现 split_messages(messages)，返回按 role 分组的字典；未知 role 抛出 ValueError，不能静默归类。",
    starterCode: "def split_messages(messages):\n    pass\n",
    solution: "def split_messages(messages):\n    grouped = {\"system\": [], \"user\": [], \"assistant\": []}\n    for message in messages:\n        role = message[\"role\"]\n        if role not in grouped:\n            raise ValueError(\"unknown role\")\n        grouped[role].append(message[\"content\"])\n    return grouped\n",
    hints: ["先定义三种允许的 role。", "按输入顺序把 content 放入对应列表。", "未知 role 应保留真实错误，不要放进默认桶。"],
    checks: [
      { name: "角色分组", expression: "split_messages([{\"role\": \"system\", \"content\": \"rules\"}, {\"role\": \"user\", \"content\": \"hi\"}]) == {\"system\": [\"rules\"], \"user\": [\"hi\"], \"assistant\": []}", failure: "消息应按真实 role 分组。", kind: "behavior" },
      { name: "拒绝未知角色", expression: "_raises_value_error(lambda: split_messages([{\"role\": \"tool\", \"content\": \"x\"}]))", failure: "未知角色不能被静默归类。", kind: "behavior" },
    ],
  },
  "langchain-rag:Prompt 模板": {
    summary: "把变量插值与模板文本分开，缺少变量时尽早暴露错误。",
    prompt: "实现 render_prompt(template, values)，替换模板中的 {name} 占位符；缺少变量时抛出 KeyError。",
    starterCode: "def render_prompt(template, values):\n    pass\n",
    solution: "def render_prompt(template, values):\n    return template.format(**values)\n",
    hints: ["Python 的 format 支持命名占位符。", "用 values 作为关键字参数传入。", "不要用 replace 猜测缺失变量的默认文本。"],
    checks: [
      { name: "插入变量", expression: "render_prompt(\"你好，{name}\", {\"name\": \"Stewie\"}) == \"你好，Stewie\"", failure: "模板应使用传入变量渲染。", kind: "behavior" },
      { name: "缺少变量", expression: "_raises_key_error(lambda: render_prompt(\"{name}/{topic}\", {\"name\": \"S\"}))", failure: "缺少模板变量应明确失败。", kind: "behavior" },
    ],
  },
  "langchain-rag:结构化输出": {
    summary: "在模型输出进入业务逻辑前验证字段和类型，拒绝模糊结果。",
    prompt: "实现 validate_answer(value)，仅接受包含 answer 字符串和 confidence 0–1 数字的字典，否则抛出 ValueError。",
    starterCode: "def validate_answer(value):\n    pass\n",
    solution: "def validate_answer(value):\n    if not isinstance(value, dict) or not isinstance(value.get(\"answer\"), str) or not isinstance(value.get(\"confidence\"), (int, float)) or not 0 <= value[\"confidence\"] <= 1:\n        raise ValueError(\"invalid answer schema\")\n    return value\n",
    hints: ["先检查容器和 answer 类型。", "confidence 必须落在闭区间 0 到 1。", "校验通过后返回原字典，失败不要伪造字段。"],
    checks: [
      { name: "通过结构", expression: "validate_answer({\"answer\": \"ok\", \"confidence\": 0.8})[\"answer\"] == \"ok\"", failure: "合法结构应原样通过。", kind: "behavior" },
      { name: "拒绝越界", expression: "_raises_value_error(lambda: validate_answer({\"answer\": \"ok\", \"confidence\": 2})) and _raises_value_error(lambda: validate_answer({\"answer\": 1, \"confidence\": 0.5}))", failure: "字段类型或置信度越界应失败。", kind: "behavior" },
    ],
  },
  "langchain-rag:Runnable 组合": {
    summary: "用清晰的数据形状串联步骤，并在每步返回可观察结果。",
    prompt: "实现 compose_steps(first, second, value)，先调用 first 再把结果传给 second；返回 second 的结果并保留调用顺序。",
    starterCode: "def compose_steps(first, second, value):\n    pass\n",
    solution: "def compose_steps(first, second, value):\n    return second(first(value))\n",
    hints: ["先计算 first(value)。", "把中间结果作为 second 的唯一输入。", "不要交换顺序或吞掉任一步异常。"],
    checks: [
      { name: "数据流", expression: "compose_steps(lambda x: x + 1, lambda x: x * 2, 3) == 8", failure: "结果应按 first → second 传递。", kind: "behavior" },
      { name: "顺序可观察", expression: "((lambda seen: (compose_steps(lambda x: seen.append(\"first\") or x, lambda x: seen.append(\"second\") or x, 1), seen))([]))[1] == [\"first\", \"second\"]", failure: "步骤调用顺序必须稳定。", kind: "behavior" },
    ],
  },
  "langchain-rag:模型配置": {
    summary: "把模型参数集中成可验证配置，避免把超时和随机性散落在调用点。",
    prompt: "实现 normalize_model_config(config)，返回 temperature 与 timeout；缺省分别为 0 和 30，参数必须为非负数字，否则抛出 ValueError。",
    starterCode: "def normalize_model_config(config):\n    pass\n",
    solution: "def normalize_model_config(config):\n    temperature = config.get(\"temperature\", 0)\n    timeout = config.get(\"timeout\", 30)\n    if not isinstance(temperature, (int, float)) or not isinstance(timeout, (int, float)) or temperature < 0 or timeout < 0:\n        raise ValueError(\"invalid model config\")\n    return {\"temperature\": temperature, \"timeout\": timeout}\n",
    hints: ["只读取题目约定的两个字段。", "默认值应集中在规范化函数。", "负数和非数字配置都应真实失败。"],
    checks: [
      { name: "默认配置", expression: "normalize_model_config({}) == {\"temperature\": 0, \"timeout\": 30}", failure: "缺省配置应使用明确默认值。", kind: "behavior" },
      { name: "覆盖与边界", expression: "normalize_model_config({\"temperature\": 0.2, \"timeout\": 10})[\"timeout\"] == 10 and _raises_value_error(lambda: normalize_model_config({\"timeout\": -1}))", failure: "合法覆盖应保留，负超时应拒绝。", kind: "behavior" },
    ],
  },
  "langchain-rag:文档加载": {
    summary: "把不同来源统一成带正文和来源 metadata 的文档记录。",
    prompt: "实现 normalize_documents(records)，把每条记录转换为 {text, metadata:{source}}，空文本记录应被跳过。",
    starterCode: "def normalize_documents(records):\n    return []\n",
    solution: "def normalize_documents(records):\n    documents = []\n    for record in records:\n        text = record[\"text\"].strip()\n        if text:\n            documents.append({\"text\": text, \"metadata\": {\"source\": record[\"source\"]}})\n    return documents\n",
    hints: ["先定义统一的 Document 形状。", "清洗正文后再判断是否为空。", "来源放入 metadata，而不是丢在正文里。"],
    checks: [
      { name: "保留来源", expression: "normalize_documents([{\"text\": \"  hello  \", \"source\": \"a.md\"}]) == [{\"text\": \"hello\", \"metadata\": {\"source\": \"a.md\"}}]", failure: "正文应清洗，来源应保留在 metadata。", kind: "behavior" },
      { name: "跳过空正文", expression: "normalize_documents([{\"text\": \" \", \"source\": \"empty.md\"}]) == []", failure: "空正文不能进入索引。", kind: "behavior" },
    ],
  },
  "langchain-rag:文本切分": {
    summary: "按可解释的边界切分长文，同时保留每个片段的来源信息。",
    prompt: "实现 split_text(text, size)，按 size 个字符切分并返回列表；空文本返回空列表，不产生空片段。",
    starterCode: "def split_text(text, size):\n    pass\n",
    solution: "def split_text(text, size):\n    if not text:\n        return []\n    return [text[start:start + size] for start in range(0, len(text), size)]\n",
    hints: ["先处理空文本边界。", "range 的步长就是片段大小。", "最后一个片段可以比 size 短，但不能凭空补字符。"],
    checks: [
      { name: "完整覆盖", expression: "split_text(\"abcdefgh\", 3) == [\"abc\", \"def\", \"gh\"]", failure: "片段应按顺序覆盖全部正文。", kind: "behavior" },
      { name: "空输入", expression: "split_text(\"\", 3) == []", failure: "空文本应返回空列表。", kind: "behavior" },
    ],
  },
  "langchain-rag:引用生成": {
    summary: "让回答中的引用只来自真实召回结果，并能回溯到来源。",
    prompt: "实现 format_citations(results)，为每个结果生成 [n] source 行；结果为空时返回‘没有找到相关资料’。",
    starterCode: "def format_citations(results):\n    pass\n",
    solution: "def format_citations(results):\n    if not results:\n        return \"没有找到相关资料\"\n    return \"\\n\".join(f\"[{index}] {item['source']}\" for index, item in enumerate(results, 1))\n",
    hints: ["先明确无检索结果的用户可见状态。", "编号由结果顺序产生，不要写死来源。", "只读取结果中的 source 字段。"],
    checks: [
      { name: "来源可追溯", expression: "format_citations([{\"source\": \"guide.md\"}, {\"source\": \"faq.md\"}]) == \"[1] guide.md\\n[2] faq.md\"", failure: "每条引用应对应实际结果来源。", kind: "behavior" },
      { name: "无结果边界", expression: "format_citations([]) == \"没有找到相关资料\"", failure: "无资料时应明确说明，而不是编造答案。", kind: "behavior" },
    ],
  },
  "langchain-rag:无答案边界": {
    summary: "在相似度不足时停止生成，区分无资料和资料不足。",
    prompt: "实现 choose_context(results, threshold)，只保留 score >= threshold 的结果；没有合格结果返回 None。",
    starterCode: "def choose_context(results, threshold):\n    pass\n",
    solution: "def choose_context(results, threshold):\n    selected = [item for item in results if item[\"score\"] >= threshold]\n    return selected or None\n",
    hints: ["阈值比较应包含等于边界。", "过滤后再判断是否为空。", "None 表示不能基于现有资料回答。"],
    checks: [
      { name: "阈值过滤", expression: "choose_context([{\"score\": 0.8}, {\"score\": 0.5}], 0.6) == [{\"score\": 0.8}]", failure: "只应保留达到阈值的结果。", kind: "behavior" },
      { name: "无答案", expression: "choose_context([{\"score\": 0.4}], 0.6) is None", failure: "没有合格资料时必须返回 None。", kind: "behavior" },
    ],
  },
  "langchain-rag:Embedding": {
    summary: "把文本映射为可比较的向量，并保持文本与向量的一一对应。",
    prompt: "实现 pair_embeddings(texts, vectors)，返回包含 text 和 embedding 的记录；长度不一致时抛出 ValueError。",
    starterCode: "def pair_embeddings(texts, vectors):\n    pass\n",
    solution: "def pair_embeddings(texts, vectors):\n    if len(texts) != len(vectors):\n        raise ValueError(\"texts and vectors must have equal length\")\n    return [{\"text\": text, \"embedding\": vector} for text, vector in zip(texts, vectors)]\n",
    hints: ["先验证两个输入长度相同。", "zip 能保持文本与向量位置对应。", "不要只返回向量而丢掉原文。"],
    checks: [
      { name: "保持对应关系", expression: "pair_embeddings([\"a\", \"b\"], [[1], [2]]) == [{\"text\": \"a\", \"embedding\": [1]}, {\"text\": \"b\", \"embedding\": [2]}]", failure: "每个向量必须对应原文本。", kind: "behavior" },
      { name: "长度边界", expression: "_raises_value_error(lambda: pair_embeddings([\"a\"], []))", failure: "输入数量不一致时应明确失败。", kind: "behavior" },
    ],
  },
  "langchain-rag:向量存储": {
    summary: "把向量和文档元数据一起保存，检索时不丢失可引用来源。",
    prompt: "实现 add_vector(store, vector, source)，返回新列表并保存 vector 与 source；不得修改传入 store。",
    starterCode: "def add_vector(store, vector, source):\n    pass\n",
    solution: "def add_vector(store, vector, source):\n    return [*store, {\"vector\": vector, \"source\": source}]\n",
    hints: ["先复制已有记录。", "每条记录同时保存向量和来源。", "比较调用前后的 store，确认没有原地修改。"],
    checks: [
      { name: "保留来源", expression: "add_vector([], [0.1, 0.2], \"guide.md\") == [{\"vector\": [0.1, 0.2], \"source\": \"guide.md\"}]", failure: "向量记录必须保留来源。", kind: "behavior" },
      { name: "不修改存储", expression: "((lambda store: (add_vector(store, [1], \"a\"), store))([]))[1] == []", failure: "添加向量不应改写调用者列表。", kind: "behavior" },
    ],
  },
  "langchain-rag:相似度检索": {
    summary: "按可解释的相似度排序返回文档，并保留分数与来源。",
    prompt: "实现 top_k(results, k)，按 score 从高到低返回最多 k 条；k <= 0 返回空列表。",
    starterCode: "def top_k(results, k):\n    pass\n",
    solution: "def top_k(results, k):\n    if k <= 0:\n        return []\n    return sorted(results, key=lambda item: item[\"score\"], reverse=True)[:k]\n",
    hints: ["先处理 k 的边界。", "排序键是 score，方向为降序。", "切片限制返回数量，不删除来源字段。"],
    checks: [
      { name: "排序与截断", expression: "top_k([{\"score\": 0.3, \"source\": \"a\"}, {\"score\": 0.9, \"source\": \"b\"}], 1) == [{\"score\": 0.9, \"source\": \"b\"}]", failure: "应返回分数最高的前 k 条。", kind: "behavior" },
      { name: "零数量", expression: "top_k([{\"score\": 1}], 0) == []", failure: "k 为零时不应返回结果。", kind: "behavior" },
    ],
  },
  "langchain-rag:混合检索": {
    summary: "合并关键词与向量召回并去重，避免单一检索信号遗漏结果。",
    prompt: "实现 merge_results(keyword, semantic)，按首次出现顺序合并 source，并为重复来源保留更高 score。",
    starterCode: "def merge_results(keyword, semantic):\n    pass\n",
    solution: "def merge_results(keyword, semantic):\n    merged = {}\n    for item in [*keyword, *semantic]:\n        source = item[\"source\"]\n        if source not in merged or item[\"score\"] > merged[source][\"score\"]:\n            merged[source] = item\n    return list(merged.values())\n",
    hints: ["两个列表按关键词结果在前的顺序合并。", "source 是去重键。", "重复来源比较 score，只替换为更高值。"],
    checks: [
      { name: "合并去重", expression: "merge_results([{\"source\": \"a\", \"score\": 0.4}], [{\"source\": \"a\", \"score\": 0.8}, {\"source\": \"b\", \"score\": 0.5}]) == [{\"source\": \"a\", \"score\": 0.8}, {\"source\": \"b\", \"score\": 0.5}]", failure: "重复来源应保留更高分数。", kind: "behavior" },
      { name: "保持顺序", expression: "[item[\"source\"] for item in merge_results([{\"source\": \"b\", \"score\": 0.5}], [{\"source\": \"a\", \"score\": 0.9}])] == [\"b\", \"a\"]", failure: "首次出现顺序应保持稳定。", kind: "behavior" },
    ],
  },
  "langchain-rag:重排": {
    summary: "对候选文档按最终相关性重新排序，并保留原始来源字段。",
    prompt: "实现 rerank(results, scores)，按 scores 中 source 的分数降序返回结果；缺少分数的来源抛出 KeyError。",
    starterCode: "def rerank(results, scores):\n    pass\n",
    solution: "def rerank(results, scores):\n    return sorted(results, key=lambda item: scores[item[\"source\"]], reverse=True)\n",
    hints: ["排序键来自独立的 scores 映射。", "按 source 关联候选文档。", "直接索引让缺少分数的来源保留 KeyError。"],
    checks: [
      { name: "重排候选", expression: "[item[\"source\"] for item in rerank([{\"source\": \"a\"}, {\"source\": \"b\"}], {\"a\": 0.2, \"b\": 0.9})] == [\"b\", \"a\"]", failure: "结果应按重排分数降序排列。", kind: "behavior" },
      { name: "分数缺失", expression: "_raises_key_error(lambda: rerank([{\"source\": \"a\"}], {}))", failure: "缺少重排分数应明确失败。", kind: "behavior" },
    ],
  },
  "langchain-rag:RAG 评估": {
    summary: "把检索命中和答案正确性拆开测量，避免只看最终文本。",
    prompt: "实现 evaluate_retrieval(expected, actual)，返回 hit、missing、unexpected 三个集合的排序列表。",
    starterCode: "def evaluate_retrieval(expected, actual):\n    pass\n",
    solution: "def evaluate_retrieval(expected, actual):\n    expected_set, actual_set = set(expected), set(actual)\n    return {\"hit\": sorted(expected_set & actual_set), \"missing\": sorted(expected_set - actual_set), \"unexpected\": sorted(actual_set - expected_set)}\n",
    hints: ["先把两组来源转换为集合。", "交集是命中，差集分别表示缺失和误召回。", "排序让评估输出确定且易读。"],
    checks: [
      { name: "评估结果", expression: "evaluate_retrieval([\"a\", \"b\"], [\"b\", \"c\"]) == {\"hit\": [\"b\"], \"missing\": [\"a\"], \"unexpected\": [\"c\"]}", failure: "应区分命中、缺失和误召回。", kind: "behavior" },
      { name: "完全命中", expression: "evaluate_retrieval([\"a\"], [\"a\"]) == {\"hit\": [\"a\"], \"missing\": [], \"unexpected\": []}", failure: "完全命中时缺失和误召回应为空。", kind: "behavior" },
    ],
  },
  "langchain-rag:追踪与观测": {
    summary: "为链路记录输入、步骤和错误，让失败可以定位而不是只剩最终文本。",
    prompt: "实现 record_event(events, name, payload)，返回新列表并追加事件字典；payload 必须是字典，否则抛出 TypeError。",
    starterCode: "def record_event(events, name, payload):\n    pass\n",
    solution: "def record_event(events, name, payload):\n    if not isinstance(payload, dict):\n        raise TypeError(\"payload must be a dict\")\n    return [*events, {\"name\": name, \"payload\": payload}]\n",
    hints: ["观测事件至少包含 name 和 payload。", "先验证 payload 形状。", "追加后返回新列表，不覆盖旧事件。"],
    checks: [
      { name: "记录事件", expression: "record_event([], \"retrieve\", {\"count\": 2}) == [{\"name\": \"retrieve\", \"payload\": {\"count\": 2}}]", failure: "事件应保留名称和真实 payload。", kind: "behavior" },
      { name: "拒绝畸形", expression: "_raises_type_error(lambda: record_event([], \"retrieve\", []))", failure: "非字典 payload 应明确失败。", kind: "behavior" },
    ],
  },
  "langchain-rag:工具调用": {
    summary: "把工具参数和返回值约束为稳定结构，避免 Agent 误调用。",
    prompt: "实现 call_tool(tool, arguments)，arguments 必须是字典并原样传给 tool；类型错误直接抛出。",
    starterCode: "def call_tool(tool, arguments):\n    pass\n",
    solution: "def call_tool(tool, arguments):\n    if not isinstance(arguments, dict):\n        raise TypeError(\"arguments must be a dict\")\n    return tool(**arguments)\n",
    hints: ["先检查工具参数容器。", "用关键字展开保持字段名称。", "不要在工具失败时返回默认结果。"],
    checks: [
      { name: "传递参数", expression: "call_tool(lambda city: city.upper(), {\"city\": \"成都\"}) == \"成都\"", failure: "工具应收到真实关键字参数并返回结果。", kind: "behavior" },
      { name: "参数类型", expression: "_raises_type_error(lambda: call_tool(lambda: 1, []))", failure: "非字典参数应明确失败。", kind: "behavior" },
    ],
  },
  "langchain-rag:Agent 循环": {
    summary: "让 Agent 循环在完成或达到上限时停止，并保留每一步轨迹。",
    prompt: "实现 run_agent(steps, limit)，依次执行最多 limit 个无参步骤；limit <= 0 返回空列表。",
    starterCode: "def run_agent(steps, limit):\n    pass\n",
    solution: "def run_agent(steps, limit):\n    if limit <= 0:\n        return []\n    return [step() for step in steps[:limit]]\n",
    hints: ["先处理步数上限边界。", "切片限制最多执行的步骤数。", "返回每一步的真实结果，不能伪造完成。"],
    checks: [
      { name: "限制步数", expression: "run_agent([lambda: 1, lambda: 2, lambda: 3], 2) == [1, 2]", failure: "循环最多执行 limit 个步骤。", kind: "behavior" },
      { name: "零上限", expression: "run_agent([lambda: 1], 0) == []", failure: "非正上限应停止执行。", kind: "behavior" },
    ],
  },
  "langchain-rag:多查询检索": {
    summary: "从一个问题生成互补查询，再合并结果并保留来源去重。",
    prompt: "实现 expand_queries(query, rewrites)，返回去重后的查询列表，原问题必须位于第一项。",
    starterCode: "def expand_queries(query, rewrites):\n    pass\n",
    solution: "def expand_queries(query, rewrites):\n    return list(dict.fromkeys([query, *rewrites]))\n",
    hints: ["原问题应优先保留。", "dict.fromkeys 可按首次出现顺序去重。", "不要用无关默认查询替换用户问题。"],
    checks: [
      { name: "扩展去重", expression: "expand_queries(\"状态保存\", [\"如何保存状态\", \"状态保存\"]) == [\"状态保存\", \"如何保存状态\"]", failure: "应保留原问题并去除重复查询。", kind: "behavior" },
      { name: "空改写", expression: "expand_queries(\"问题\", []) == [\"问题\"]", failure: "没有改写时仍应检索原问题。", kind: "behavior" },
    ],
  },
  "langchain-rag:RAG 项目": {
    summary: "把检索、来源和无答案状态组合成可演示的最小 RAG 流程。",
    prompt: "实现 answer_with_sources(contexts)，返回 answer 与 sources；contexts 为空时 answer 必须为‘资料不足’且来源为空。",
    starterCode: "def answer_with_sources(contexts):\n    pass\n",
    solution: "def answer_with_sources(contexts):\n    if not contexts:\n        return {\"answer\": \"资料不足\", \"sources\": []}\n    return {\"answer\": contexts[0][\"text\"], \"sources\": [item[\"source\"] for item in contexts]}\n",
    hints: ["先处理没有召回资料的分支。", "有资料时只使用真实 text 和 source。", "输出结构固定为 answer 与 sources。"],
    checks: [
      { name: "来源可追溯", expression: "answer_with_sources([{\"text\": \"答案\", \"source\": \"a.md\"}]) == {\"answer\": \"答案\", \"sources\": [\"a.md\"]}", failure: "回答必须带回真实来源。", kind: "behavior" },
      { name: "无资料", expression: "answer_with_sources([]) == {\"answer\": \"资料不足\", \"sources\": []}", failure: "无召回时不能伪造回答或来源。", kind: "behavior" },
    ],
  },
  "langgraph:恢复执行": {
    summary: "从检查点恢复时只继续同一 thread 的状态，不重复覆盖已完成步骤。",
    prompt: "实现 resume_state(checkpoints, thread_id, updates)，复制指定 thread 状态并应用 updates；未知 thread_id 抛出 KeyError。",
    starterCode: "def resume_state(checkpoints, thread_id, updates):\n    pass\n",
    solution: "def resume_state(checkpoints, thread_id, updates):\n    state = dict(checkpoints[thread_id])\n    state.update(updates)\n    return state\n",
    hints: ["先按 thread_id 读取检查点。", "复制状态后再合并恢复更新。", "未知线程应保留 KeyError，不要从别的线程猜测。"],
    checks: [
      { name: "恢复状态", expression: "resume_state({\"t1\": {\"step\": 2}}, \"t1\", {\"step\": 3}) == {\"step\": 3}", failure: "恢复应基于指定 thread 的检查点。", kind: "behavior" },
      { name: "线程缺失", expression: "_raises_key_error(lambda: resume_state({}, \"missing\", {}))", failure: "缺失 thread 不应静默创建错误状态。", kind: "behavior" },
    ],
  },
  "langgraph:流式事件": {
    summary: "按节点顺序发出状态事件，让长流程的中间结果可观察。",
    prompt: "实现 stream_events(nodes, state)，依次调用每个节点并返回 (节点名, 新状态) 元组列表。",
    starterCode: "def stream_events(nodes, state):\n    pass\n",
    solution: "def stream_events(nodes, state):\n    events = []\n    current = dict(state)\n    for name, node in nodes:\n        current = {**current, **node(current)}\n        events.append((name, dict(current)))\n    return events\n",
    hints: ["维护一个当前状态副本。", "每个节点返回局部更新后再合并。", "事件中复制状态，避免后续步骤改写历史。"],
    checks: [
      { name: "事件顺序", expression: `stream_events([("a", lambda state: {"count": state["count"] + 1}), ("b", lambda state: {"count": state["count"] + 1})], {"count": 0}) == [("a", {"count": 1}), ("b", {"count": 2})]`, failure: "应按节点顺序发出累计状态。", kind: "behavior" },
      { name: "空图", expression: "stream_events([], {\"count\": 1}) == []", failure: "没有节点时应没有事件。", kind: "behavior" },
    ],
  },
  "langgraph:子图": {
    summary: "把子图当作独立状态转换组合到父图，明确输入输出边界。",
    prompt: "实现 invoke_subgraph(subgraph, state)，复制 state 传给子图并返回其结果；不修改父状态。",
    starterCode: "def invoke_subgraph(subgraph, state):\n    pass\n",
    solution: "def invoke_subgraph(subgraph, state):\n    return subgraph(dict(state))\n",
    hints: ["子图只接收一份状态副本。", "返回子图真实结果，不在父层猜测字段。", "用调用前后比较确认父状态不变。"],
    checks: [
      { name: "传递边界", expression: "invoke_subgraph(lambda state: {\"done\": state[\"value\"] + 1}, {\"value\": 2}) == {\"done\": 3}", failure: "子图应接收状态并返回结果。", kind: "behavior" },
      { name: "隔离父状态", expression: "((lambda state: (invoke_subgraph(lambda value: {\"value\": 9}, state), state))({\"value\": 2}))[1] == {\"value\": 2}", failure: "子图调用不应修改父状态。", kind: "behavior" },
    ],
  },
  "langgraph:并行分支": {
    summary: "并行执行独立节点后合并结果，明确冲突字段的覆盖顺序。",
    prompt: "实现 merge_parallel(results)，按输入顺序合并字典；后出现的同名键覆盖前值，空输入返回空字典。",
    starterCode: "def merge_parallel(results):\n    pass\n",
    solution: "def merge_parallel(results):\n    merged = {}\n    for result in results:\n        merged.update(result)\n    return merged\n",
    hints: ["每个分支返回一个字典更新。", "按输入顺序合并以得到确定结果。", "不要为缺失字段猜测默认值。"],
    checks: [
      { name: "合并分支", expression: "merge_parallel([{\"a\": 1}, {\"b\": 2}]) == {\"a\": 1, \"b\": 2}", failure: "独立分支结果应合并到一个状态。", kind: "behavior" },
      { name: "冲突顺序", expression: "merge_parallel([{\"a\": 1}, {\"a\": 2}]) == {\"a\": 2} and merge_parallel([]) == {}", failure: "冲突键应按声明顺序覆盖，空输入应为空。", kind: "behavior" },
    ],
  },
  "langgraph:Supervisor": {
    summary: "由 supervisor 根据任务类型选择专长节点，并拒绝未知角色。",
    prompt: "实现 choose_worker(task_type, workers)，返回 workers 中对应的可调用对象；未知类型抛出 KeyError。",
    starterCode: "def choose_worker(task_type, workers):\n    pass\n",
    solution: "def choose_worker(task_type, workers):\n    return workers[task_type]\n",
    hints: ["任务类型就是路由键。", "返回已注册 worker，不要执行它。", "未知类型应保留 KeyError。"],
    checks: [
      { name: "选择 worker", expression: "choose_worker(\"search\", {\"search\": \"S\"}) == \"S\"", failure: "应返回任务类型对应的 worker。", kind: "behavior" },
      { name: "未知任务", expression: "_raises_key_error(lambda: choose_worker(\"write\", {\"search\": \"S\"}))", failure: "未注册任务不能静默路由。", kind: "behavior" },
    ],
  },
  "langgraph:多 Agent 协作": {
    summary: "让多个 Agent 通过明确消息协议交接，不共享隐式可变状态。",
    prompt: "实现 handoff(agent, message)，返回包含 recipient 和 content 的字典；message 必须为字符串。",
    starterCode: "def handoff(agent, message):\n    pass\n",
    solution: "def handoff(agent, message):\n    if not isinstance(message, str):\n        raise TypeError(\"message must be a string\")\n    return {\"recipient\": agent, \"content\": message}\n",
    hints: ["交接消息至少包含接收者和内容。", "先验证内容类型。", "不要把对象 repr 当作自然语言消息。"],
    checks: [
      { name: "交接协议", expression: "handoff(\"researcher\", \"完成检索\") == {\"recipient\": \"researcher\", \"content\": \"完成检索\"}", failure: "交接输出应符合稳定协议。", kind: "behavior" },
      { name: "拒绝非文本", expression: "_raises_type_error(lambda: handoff(\"researcher\", {\"x\": 1}))", failure: "消息内容必须是字符串。", kind: "behavior" },
    ],
  },
  "langgraph:人工审核": {
    summary: "在高风险动作前把待审核状态显式交给人，而不是自动继续。",
    prompt: "实现 review_gate(action, decision)，decision 为 approve 返回 action，为 reject 返回 rejected，其他值抛出 ValueError。",
    starterCode: "def review_gate(action, decision):\n    pass\n",
    solution: "def review_gate(action, decision):\n    if decision == \"approve\":\n        return action\n    if decision == \"reject\":\n        return \"rejected\"\n    raise ValueError(\"unknown decision\")\n",
    hints: ["批准和拒绝是两个显式状态。", "未知决定不能当作批准。", "保留 action 原值以便后续节点执行。"],
    checks: [
      { name: "审核决定", expression: "review_gate(\"send\", \"approve\") == \"send\" and review_gate(\"send\", \"reject\") == \"rejected\"", failure: "批准与拒绝应产生不同结果。", kind: "behavior" },
      { name: "未知决定", expression: "_raises_value_error(lambda: review_gate(\"send\", \"later\"))", failure: "未知审核状态应明确失败。", kind: "behavior" },
    ],
  },
  "langgraph:Graph 项目": {
    summary: "把状态、路由、检查点和人工边界组合成可演示的图项目。",
    prompt: "实现 project_step(state)，返回新的状态副本；state 必须包含 thread_id 和 step，否则抛出 KeyError，并将 step 加一。",
    starterCode: "def project_step(state):\n    pass\n",
    solution: "def project_step(state):\n    updated = dict(state)\n    updated[\"step\"] = state[\"step\"] + 1\n    return updated\n",
    hints: ["先读取题目要求的两个状态字段。", "复制状态后只推进 step。", "缺失字段应保留 KeyError，便于定位图契约问题。"],
    checks: [
      { name: "推进项目状态", expression: "project_step({\"thread_id\": \"t1\", \"step\": 1}) == {\"thread_id\": \"t1\", \"step\": 2}", failure: "项目步骤应在同一 thread 上推进。", kind: "behavior" },
      { name: "契约缺失", expression: "_raises_key_error(lambda: project_step({\"step\": 1}))", failure: "缺失 thread_id 的状态不能继续。", kind: "behavior" },
    ],
  },
  "langgraph:Checkpoint": {
    summary: "把每次图运行的状态按 thread 保存，支持读取最近检查点。",
    prompt: "实现 save_checkpoint(checkpoints, thread_id, state)，返回新的字典并只更新指定 thread；不要修改原字典。",
    starterCode: "def save_checkpoint(checkpoints, thread_id, state):\n    pass\n",
    solution: "def save_checkpoint(checkpoints, thread_id, state):\n    updated = dict(checkpoints)\n    updated[thread_id] = dict(state)\n    return updated\n",
    hints: ["先复制外层字典。", "thread_id 是隔离状态的键。", "复制 state，避免调用者之后修改检查点。"],
    checks: [
      { name: "写入线程", expression: "save_checkpoint({\"a\": {\"step\": 1}}, \"b\", {\"step\": 2}) == {\"a\": {\"step\": 1}, \"b\": {\"step\": 2}}", failure: "应只新增或更新指定 thread。", kind: "behavior" },
      { name: "不修改原值", expression: "((lambda original: (save_checkpoint(original, \"a\", {\"step\": 2}), original))({\"a\": {\"step\": 1}}))[1][\"a\"][\"step\"] == 1", failure: "保存检查点不应改写调用者字典。", kind: "behavior" },
    ],
  },
  "langgraph:Interrupt": {
    summary: "在高风险节点前暂停，把明确的待确认动作交还给人。",
    prompt: "实现 approval_route(approved)，approved 为 True 返回 execute，否则返回 cancel；不要用默认分支掩盖未知值。",
    starterCode: "def approval_route(approved):\n    pass\n",
    solution: "def approval_route(approved):\n    if approved is True:\n        return \"execute\"\n    if approved is False:\n        return \"cancel\"\n    raise ValueError(\"approval must be boolean\")\n",
    hints: ["批准和拒绝是两个明确状态。", "不要把 None 当成批准或拒绝。", "未知输入应留下真实错误。"],
    checks: [
      { name: "批准与拒绝", expression: "approval_route(True) == \"execute\" and approval_route(False) == \"cancel\"", failure: "批准与拒绝必须走不同分支。", kind: "behavior" },
      { name: "未知状态", expression: "_raises_value_error(lambda: approval_route(None))", failure: "未知确认值不能静默继续。", kind: "behavior" },
    ],
  },
  "langgraph:状态更新": {
    summary: "让节点返回局部更新，由图运行时统一合并状态。",
    prompt: "实现 add_observation(state, text)，返回只包含 observations 更新的字典，不直接修改输入 state。",
    starterCode: "def add_observation(state, text):\n    pass\n",
    solution: "def add_observation(state, text):\n    return {\"observations\": [*state.get(\"observations\", []), text]}\n",
    hints: ["节点输出是更新，不是完整状态副本。", "用新列表保留旧观察。", "比较调用前后的 state，确认没有原地修改。"],
    checks: [
      { name: "追加观察", expression: "add_observation({\"observations\": [\"a\"]}, \"b\") == {\"observations\": [\"a\", \"b\"]}", failure: "节点应保留历史并追加新观察。", kind: "behavior" },
      { name: "不修改输入", expression: "((lambda state: (add_observation(state, \"b\"), state))({\"observations\": [\"a\"]}))[1] == {\"observations\": [\"a\"]}", failure: "节点不应直接修改传入状态。", kind: "behavior" },
    ],
  },
  "langgraph:条件路由": {
    summary: "把状态判断和图的下一步名称分开，确保每个分支都可解释。",
    prompt: "实现 route_review(state)：score >= 0.8 返回 finish，否则返回 revise；不要修改 state。",
    starterCode: "def route_review(state):\n    pass\n",
    solution: "def route_review(state):\n    return \"finish\" if state[\"score\"] >= 0.8 else \"revise\"\n",
    hints: ["路由函数只返回有限的名称。", "先处理达到阈值的情况。", "用 0.8 和略低于 0.8 的输入分别验证。"],
    checks: [
      { name: "完成分支", expression: "route_review({\"score\": 0.8}) == \"finish\"", failure: "达到阈值应路由到 finish。", kind: "behavior" },
      { name: "修订分支", expression: "route_review({\"score\": 0.79}) == \"revise\"", failure: "低于阈值应路由到 revise。", kind: "behavior" },
    ],
  },
  "langgraph:循环终止": {
    summary: "为循环同时设置业务完成条件和步数上限，避免图无限运行。",
    prompt: "实现 should_continue(state)：完成或 attempts >= 3 时返回 end，否则返回 revise。",
    starterCode: "def should_continue(state):\n    pass\n",
    solution: "def should_continue(state):\n    if state[\"done\"] or state[\"attempts\"] >= 3:\n        return \"end\"\n    return \"revise\"\n",
    hints: ["两个终止原因都要覆盖。", "先判断 done，再检查 attempts 上限。", "测试 0、2、3 次尝试以及 done=True。"],
    checks: [
      { name: "完成即停", expression: "should_continue({\"done\": True, \"attempts\": 0}) == \"end\"", failure: "业务完成后不能继续循环。", kind: "behavior" },
      { name: "上限即停", expression: "should_continue({\"done\": False, \"attempts\": 3}) == \"end\" and should_continue({\"done\": False, \"attempts\": 2}) == \"revise\"", failure: "循环必须在三次尝试后停止。", kind: "behavior" },
    ],
  },
  "langgraph:thread_id": {
    summary: "用 thread_id 隔离不同会话的短期状态，恢复时只读取同一线程。",
    prompt: "实现 get_thread_state(store, thread_id)，返回该线程的 state；未知 thread_id 返回 None，不能返回其他线程数据。",
    starterCode: "def get_thread_state(store, thread_id):\n    pass\n",
    solution: "def get_thread_state(store, thread_id):\n    return store.get(thread_id)\n",
    hints: ["把 thread_id 当作唯一键。", "不要遍历后猜测最相近的会话。", "用两个线程和一个未知 id 验证隔离。"],
    checks: [
      { name: "线程隔离", expression: "get_thread_state({\"a\": {\"count\": 1}, \"b\": {\"count\": 2}}, \"b\") == {\"count\": 2}", failure: "应只返回指定 thread_id 的状态。", kind: "behavior" },
      { name: "未知线程", expression: "get_thread_state({\"a\": {\"count\": 1}}, \"missing\") is None", failure: "未知 thread_id 应明确返回 None。", kind: "behavior" },
    ],
  },
};

function generatedLesson(track: CourseTrack, index: number, stageId: string, project: boolean): CourseLesson {
  const source = SOURCES[track.id];
  const id = `${track.id}-lesson-${String(index).padStart(2, "0")}`;
  const previous = track.lessons[index - 1]?.id;
  const baseTopic = TOPICS[track.id][index % TOPICS[track.id].length];
  const variant = Math.floor(index / TOPICS[track.id].length) + 1;
  const topic = variant === 1 ? baseTopic : `${baseTopic}迁移练习 ${variant}`;
  const topicSpec = track.id === "python" ? PYTHON_TOPIC_SPECS[baseTopic] : FRAMEWORK_TOPIC_SPECS[`${track.id}:${baseTopic}`];
  if (!topicSpec) throw new Error(`缺少 ${track.id} 主题的作者练习规格：${baseTopic}`);
  const guideSummary = topicSpec.summary;
  const guidePrompt = topicSpec.prompt;
  return {
    id, stageId, order: index + 1, title: `${topic}：写出可验证的实现`,
    kicker: `${track.shortTitle} 学习`, summary: guideSummary, minutes: 35,
    prerequisites: previous ? [previous] : [], difficulty: index < 3 ? "beginner" : index < 8 ? "intermediate" : "advanced",
    tags: [track.id, `stage-${stageId}`], guide: [
      { kind: "概念入门", title: `${baseTopic}要解决什么问题`, body: guideSummary, bullets: ["找出输入契约", "标出核心状态", "说清输出形状"], example: guidePrompt },
      { kind: "逐步拆解", title: `把${baseTopic}拆成步骤`, body: `先实现题目要求的最小路径，再逐项验证：${guidePrompt}`, bullets: topicSpec.hints, example: "输入 → 处理 → 输出" },
      { kind: "常见误区", title: `${baseTopic}的边界检查`, body: `不要只复现示例；使用未出现在题面中的输入，观察失败属于行为不符还是缺少教学构造。`, bullets: ["换一组输入", "保留真实输出", "解释期望与实际"], example: "assert actual == expected" },
    ], videos: [], officialSources: [{ ...source, kind: "official-doc", verifiedAt: "2026-09-02" }], migrations: [], project,
    projectLinks: [], exercise: { prompt: `${topicSpec.prompt}${variant > 1 ? `\n迁移要求：改用第 ${variant} 组未在示例出现的输入，说明实现为何仍成立。` : ""}`, starterCode: topicSpec.starterCode, hints: topicSpec.hints, solution: topicSpec.solution },
    browserChecks: topicSpec.checks,
  };
}

export function expandCourseTrack(track: CourseTrack, expansion: Expansion): CourseTrack {
  if (track.lessons.length >= expansion.targetLessons && track.stages.length === expansion.stageCount) return track;
  const stages: CourseStage[] = expansion.stageTitles.map((title, index) => ({ id: `${track.id}-stage-${index + 1}`, order: index + 1, title, description: `${title} 的核心概念与实践。`, lessonIds: [] }));
  const lessons = [...track.lessons];
  while (lessons.length < expansion.targetLessons) {
    const nextLesson = generatedLesson(track, lessons.length, stages[lessons.length % stages.length].id, false);
    const previousLesson = lessons[lessons.length - 1];
    if (previousLesson) nextLesson.prerequisites = [previousLesson.id];
    lessons.push(nextLesson);
  }
  if (track.id === "langchain-rag") lessons[0].prerequisites = ["functions", "dictionaries", "exceptions"];
  if (track.id === "langgraph") lessons[0].prerequisites = ["functions", "model-messages-prompts", "runnable-pipeline"];
  let projects = lessons.filter(({ project }) => project).length;
  for (const lesson of lessons) {
    while (lesson.guide.length < 3) lesson.guide.push({ kind: "常见误区", title: "验证边界", body: "用一个没有出现在示例中的输入复查理解。", bullets: ["改变输入", "记录实际结果", "说明失败原因"], example: "assert result == expected" });
    while ((lesson.exercise.hints ?? []).length < 3) lesson.exercise.hints = [...(lesson.exercise.hints ?? []), "用边界输入复测"];
    const stage = stages[(lesson.order - 1) % stages.length];
    lesson.stageId = stage.id;
    lesson.order = lessons.indexOf(lesson) + 1;
    stage.lessonIds.push(lesson.id);
  }
  const stageProjectCandidates = stages.map((stage) => [...lessons].reverse().find((lesson) => lesson.stageId === stage.id && !lesson.project)).filter((lesson): lesson is CourseLesson => Boolean(lesson));
  let generatedProjectIndex = 0;
  for (const lesson of stageProjectCandidates) {
    if (projects >= expansion.projectCount) break;
    lesson.project = true;
    if (lesson.id.includes("-lesson-")) {
      const briefs = track.id === "langchain-rag" || track.id === "langgraph" ? PROJECT_BRIEFS[track.id] : [];
      const brief = briefs[generatedProjectIndex];
      if (brief) {
        lesson.title = brief.title;
        lesson.summary = brief.summary;
      }
      generatedProjectIndex += 1;
    }
    projects += 1;
  }
  if (projects < expansion.projectCount) {
    for (const lesson of [...lessons].reverse()) {
      if (projects >= expansion.projectCount) break;
      if (!lesson.project) { lesson.project = true; projects += 1; }
    }
  }
  for (const lesson of lessons) {
    if (!lesson.project || !lesson.id.includes("-lesson-")) continue;
    const brief = (track.id === "langchain-rag" || track.id === "langgraph")
      ? PROJECT_BRIEFS[track.id][lessons.filter(({ project }) => project).indexOf(lesson)]
      : undefined;
    const projectStory = brief?.summary ?? "把已学能力组合成一个可演示的本地工具。";
    lesson.exercise.prompt = `阶段项目：${lesson.title}\n用户场景：${projectStory}\n用户故事：交付一个能被真实使用者复现和演示的最小版本。\n输入与输出：先写清数据契约；失败状态：保留真实异常或无结果状态；验收：补充典型、变化和边界测试，并在 README 记录运行方式、取舍与限制。`;
    lesson.exercise.hints = ["先拆成一个能独立运行的最小里程碑。", "让每个中间结果可观察，并为失败保留真实原因。", "最后用未出现在示例中的输入和边界情况回归。"];
  }
  const projectIdsByStage = new Map<string, string>();
  for (const project of lessons.filter(({ project }) => project)) {
    if (!projectIdsByStage.has(project.stageId)) projectIdsByStage.set(project.stageId, project.id);
  }
  for (const lesson of lessons) {
    if (!lesson.project && lesson.projectLinks.length === 0) {
      const sameStageProject = projectIdsByStage.get(lesson.stageId);
      if (sameStageProject) lesson.projectLinks = [sameStageProject];
    }
  }
  return { ...track, stages, lessons };
}

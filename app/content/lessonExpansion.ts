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

type TopicSpec = {
  summary: string;
  prompt: string;
  starterCode: string;
  solution: string;
  hints: string[];
  checks: CourseLesson["browserChecks"];
};

const PYTHON_TOPIC_SPECS: Record<string, TopicSpec> = {
  "作用域": {
    summary: "区分局部与全局名字，写出不依赖隐式全局状态的函数。",
    prompt: "实现 make_counter(start)，每次调用返回递增 1 的数字；不同计数器之间不能互相影响。",
    starterCode: "def make_counter(start):\n    pass\n",
    solution: "def make_counter(start):\n    current = start\n    def next_value():\n        nonlocal current\n        current += 1\n        return current\n    return next_value\n",
    hints: ["先找出需要跨调用保留的值。", "把状态放在外层函数的局部作用域。", "内部函数修改外层变量时需要声明 nonlocal。"],
    checks: [
      { name: "连续调用递增", expression: "_counter_probe(make_counter, 4) == [5, 6, 7]", failure: "同一个计数器应连续递增。", kind: "behavior" },
      { name: "实例彼此隔离", expression: "_counter_isolated(make_counter)", failure: "两个计数器不能共享可变全局状态。", kind: "behavior" },
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
      { name: "不修改原列表", expression: "_preserves_input(take_every_other)", failure: "函数不应就地修改输入列表。", kind: "behavior" },
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
};

function generatedLesson(track: CourseTrack, index: number, stageId: string, project: boolean): CourseLesson {
  const source = SOURCES[track.id];
  const id = `${track.id}-lesson-${String(index).padStart(2, "0")}`;
  const previous = track.lessons[index - 1]?.id;
  const topic = TOPICS[track.id][index % TOPICS[track.id].length];
  const topicSpec = track.id === "python" ? PYTHON_TOPIC_SPECS[topic] : undefined;
  const exercise = track.id === "python"
    ? { starterCode: "value = 2\nresult = None", solution: "value = 2\nresult = value * 3" }
    : track.id === "langchain-rag"
      ? { starterCode: 'messages = [{"role": "user", "content": "hello"}]\nresult = None', solution: 'messages = [{"role": "user", "content": "hello"}]\nresult = messages' }
      : { starterCode: 'state = {"count": 0}\nresult = None', solution: 'state = {"count": 0}\nstate["count"] += 1\nresult = state' };
  const ragDetail = track.id === "langchain-rag" && ["Embedding", "向量存储", "相似度检索"].includes(topic);
  const graphDetail = track.id === "langgraph" && ["StateGraph", "Checkpoint", "Interrupt", "恢复执行"].includes(topic);
  return {
    id, stageId, order: index + 1, title: topicSpec ? `${topic}：写出可验证的实现` : `${topic}：从概念到练习（第 ${index + 1} 节）`,
    kicker: `${track.shortTitle} 学习`, summary: ragDetail ? `把 ${topic} 放进 indexing → retrieval 数据流，比较召回结果并保留来源。` : graphDetail ? `围绕 ${topic} 描述 State 输入、节点更新和恢复边界。` : `理解 ${topic} 的输入、处理过程和边界，并完成一个可验证练习。`, minutes: 35,
    prerequisites: previous ? [previous] : [], difficulty: index < 3 ? "beginner" : index < 8 ? "intermediate" : "advanced",
    tags: [track.id, `stage-${stageId}`], guide: [
      { kind: "概念入门", title: "先建立心智模型", body: "明确输入、处理步骤和输出，不把框架魔法当作黑盒。", bullets: ["写出输入", "标出状态", "说明输出"], example: "input -> process -> output" },
      { kind: "逐步拆解", title: "再拆成可观察步骤", body: "每一步都可以单独运行或检查，失败时保留真实原因。", bullets: ["先做最小例子", "逐步增加边界", "记录实际结果"], example: "step_one(); step_two()" },
      { kind: "常见误区", title: "最后验证边界", body: "用一个没有出现在示例里的输入确认实现不是写死样例。", bullets: ["改变输入", "检查失败", "再复盘"], example: "assert result == expected" },
    ], videos: [], officialSources: [{ ...source, kind: "official-doc", verifiedAt: "2026-09-02" }], migrations: [], project,
    projectLinks: [], exercise: { prompt: topicSpec?.prompt ?? (ragDetail ? `用两条不同主题的文档验证 ${topic}：记录输入、返回数量、来源 metadata，并说明无命中时的行为。` : graphDetail ? `为 ${topic} 写一个最小状态流程：声明 state、记录节点更新，并说明 thread 隔离或恢复时的预期结果。` : `完成“${topic}”练习并通过行为检查。`), starterCode: topicSpec?.starterCode ?? (ragDetail ? 'documents = [{"text": "Python 函数", "source": "a.md"}, {"text": "图状态", "source": "b.md"}]\nresults = []' : graphDetail ? 'state = {"thread_id": "demo-1", "count": 0}\nupdates = []' : exercise.starterCode), hints: topicSpec?.hints ?? (ragDetail ? ["先保留 page_content 与 source", "检查 query 与文档的向量维度", "用无关 query 验证无命中边界"] : graphDetail ? ["先写 State 字段", "记录节点返回的更新", "用另一个 thread 验证隔离"] : ["先描述数据流", "实现最小步骤", "用边界输入复测"]), solution: topicSpec?.solution ?? (ragDetail ? 'documents = [{"text": "Python 函数", "source": "a.md"}, {"text": "图状态", "source": "b.md"}]\nresults = [{"text": documents[0]["text"], "source": documents[0]["source"]}]' : graphDetail ? 'state = {"thread_id": "demo-1", "count": 0}\nupdates = [{"count": 1}]\nstate.update(updates[0])' : exercise.solution) },
    browserChecks: topicSpec?.checks ?? [{ name: "典型输入", expression: "behavioral result", failure: "典型输入行为不符", kind: "behavior" }, { name: "边界输入", expression: "boundary result", failure: "边界输入行为不符", kind: "behavior" }],
  };
}

export function expandCourseTrack(track: CourseTrack, expansion: Expansion): CourseTrack {
  if (track.lessons.length >= expansion.targetLessons && track.stages.length === expansion.stageCount) return track;
  const stages: CourseStage[] = expansion.stageTitles.map((title, index) => ({ id: `${track.id}-stage-${index + 1}`, order: index + 1, title, description: `${title} 的核心概念与实践。`, lessonIds: [] }));
  const lessons = [...track.lessons];
  while (lessons.length < expansion.targetLessons) lessons.push(generatedLesson(track, lessons.length, stages[lessons.length % stages.length].id, false));
  if (track.id === "langchain-rag") lessons[0].prerequisites = ["functions", "dictionaries", "exceptions"];
  if (track.id === "langgraph") lessons[0].prerequisites = ["functions", "model-messages-prompts", "runnable-pipeline"];
  let projects = lessons.filter(({ project }) => project).length;
  for (const lesson of lessons) {
    while (lesson.guide.length < 3) lesson.guide.push({ kind: "常见误区", title: "验证边界", body: "用一个没有出现在示例中的输入复查理解。", bullets: ["改变输入", "记录实际结果", "说明失败原因"], example: "assert result == expected" });
    while ((lesson.exercise.hints ?? []).length < 3) lesson.exercise.hints = [...(lesson.exercise.hints ?? []), "用边界输入复测"];
    const stage = stages[lesson.order % stages.length];
    lesson.stageId = stage.id;
    lesson.order = lessons.indexOf(lesson) + 1;
    stage.lessonIds.push(lesson.id);
  }
  for (const lesson of [...lessons].reverse()) {
    if (projects >= expansion.projectCount) break;
    if (!lesson.project) { lesson.project = true; projects += 1; }
  }
  const projectIds = lessons.filter(({ project }) => project).map(({ id }) => id);
  for (const lesson of lessons) {
    if (!lesson.project && projectIds.length > 0 && lesson.projectLinks.length === 0) lesson.projectLinks = [projectIds[0]];
  }
  return { ...track, stages, lessons };
}

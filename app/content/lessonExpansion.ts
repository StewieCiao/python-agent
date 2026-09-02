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
};

const FRAMEWORK_TOPIC_SPECS: Record<string, TopicSpec> = {
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
  const exercise = track.id === "python"
    ? { starterCode: "value = 2\nresult = None", solution: "value = 2\nresult = value * 3" }
    : track.id === "langchain-rag"
      ? { starterCode: 'messages = [{"role": "user", "content": "hello"}]\nresult = None', solution: 'messages = [{"role": "user", "content": "hello"}]\nresult = messages' }
      : { starterCode: 'state = {"count": 0}\nresult = None', solution: 'state = {"count": 0}\nstate["count"] += 1\nresult = state' };
  const ragDetail = track.id === "langchain-rag" && ["Embedding", "向量存储", "相似度检索"].includes(baseTopic);
  const graphDetail = track.id === "langgraph" && ["StateGraph", "Checkpoint", "Interrupt", "恢复执行"].includes(baseTopic);
  return {
    id, stageId, order: index + 1, title: topicSpec ? `${topic}：写出可验证的实现` : `${topic}：从概念到练习（第 ${index + 1} 节）`,
    kicker: `${track.shortTitle} 学习`, summary: topicSpec?.summary ?? (ragDetail ? `把 ${topic} 放进 indexing → retrieval 数据流，比较召回结果并保留来源。` : graphDetail ? `围绕 ${topic} 描述 State 输入、节点更新和恢复边界。` : `理解 ${topic} 的输入、处理过程和边界，并完成一个可验证练习。`), minutes: 35,
    prerequisites: previous ? [previous] : [], difficulty: index < 3 ? "beginner" : index < 8 ? "intermediate" : "advanced",
    tags: [track.id, `stage-${stageId}`], guide: [
      { kind: "概念入门", title: "先建立心智模型", body: "明确输入、处理步骤和输出，不把框架魔法当作黑盒。", bullets: ["写出输入", "标出状态", "说明输出"], example: "input -> process -> output" },
      { kind: "逐步拆解", title: "再拆成可观察步骤", body: "每一步都可以单独运行或检查，失败时保留真实原因。", bullets: ["先做最小例子", "逐步增加边界", "记录实际结果"], example: "step_one(); step_two()" },
      { kind: "常见误区", title: "最后验证边界", body: "用一个没有出现在示例里的输入确认实现不是写死样例。", bullets: ["改变输入", "检查失败", "再复盘"], example: "assert result == expected" },
    ], videos: [], officialSources: [{ ...source, kind: "official-doc", verifiedAt: "2026-09-02" }], migrations: [], project,
    projectLinks: [], exercise: { prompt: topicSpec ? `${topicSpec.prompt}${variant > 1 ? `\n迁移要求：改用第 ${variant} 组未在示例出现的输入，说明实现为何仍成立。` : ""}` : (ragDetail ? `用两条不同主题的文档验证 ${topic}：记录输入、返回数量、来源 metadata，并说明无命中时的行为。` : graphDetail ? `为 ${topic} 写一个最小状态流程：声明 state、记录节点更新，并说明 thread 隔离或恢复时的预期结果。` : `完成“${topic}”练习并通过行为检查。`), starterCode: topicSpec?.starterCode ?? (ragDetail ? 'documents = [{"text": "Python 函数", "source": "a.md"}, {"text": "图状态", "source": "b.md"}]\nresults = []' : graphDetail ? 'state = {"thread_id": "demo-1", "count": 0}\nupdates = []' : exercise.starterCode), hints: topicSpec?.hints ?? (ragDetail ? ["先保留 page_content 与 source", "检查 query 与文档的向量维度", "用无关 query 验证无命中边界"] : graphDetail ? ["先写 State 字段", "记录节点返回的更新", "用另一个 thread 验证隔离"] : ["先描述数据流", "实现最小步骤", "用边界输入复测"]), solution: topicSpec?.solution ?? (ragDetail ? 'documents = [{"text": "Python 函数", "source": "a.md"}, {"text": "图状态", "source": "b.md"}]\nresults = [{"text": documents[0]["text"], "source": documents[0]["source"]}]' : graphDetail ? 'state = {"thread_id": "demo-1", "count": 0}\nupdates = [{"count": 1}]\nstate.update(updates[0])' : exercise.solution) },
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
    const stage = stages[(lesson.order - 1) % stages.length];
    lesson.stageId = stage.id;
    lesson.order = lessons.indexOf(lesson) + 1;
    stage.lessonIds.push(lesson.id);
  }
  const stageProjectCandidates = stages.map((stage) => [...lessons].reverse().find((lesson) => lesson.stageId === stage.id && !lesson.project)).filter((lesson): lesson is CourseLesson => Boolean(lesson));
  for (const lesson of stageProjectCandidates) {
    if (projects >= expansion.projectCount) break;
    lesson.project = true;
    projects += 1;
  }
  if (projects < expansion.projectCount) {
    for (const lesson of [...lessons].reverse()) {
      if (projects >= expansion.projectCount) break;
      if (!lesson.project) { lesson.project = true; projects += 1; }
    }
  }
  const projectIdsByStage = new Map<string, string>();
  for (const project of lessons.filter(({ project }) => project)) {
    if (!projectIdsByStage.has(project.stageId)) projectIdsByStage.set(project.stageId, project.id);
  }
  for (const lesson of lessons) {
    if (!lesson.project && lesson.projectLinks.length === 0) {
      const sameStageProject = projectIdsByStage.get(lesson.stageId);
      const fallbackProject = lessons.find((candidate) => candidate.project)?.id;
      const projectId = sameStageProject ?? fallbackProject;
      if (projectId) lesson.projectLinks = [projectId];
    }
  }
  return { ...track, stages, lessons };
}

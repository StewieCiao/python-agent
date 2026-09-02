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

function generatedLesson(track: CourseTrack, index: number, stageId: string, project: boolean): CourseLesson {
  const source = SOURCES[track.id];
  const id = `${track.id}-lesson-${String(index).padStart(2, "0")}`;
  const previous = track.lessons[index - 1]?.id;
  const topic = TOPICS[track.id][index % TOPICS[track.id].length];
  return {
    id, stageId, order: index + 1, title: `${topic}：从概念到练习（第 ${index + 1} 节）`,
    kicker: `${track.shortTitle} 学习`, summary: `理解 ${topic} 的输入、处理过程和边界，并完成一个可验证练习。`, minutes: 35,
    prerequisites: previous ? [previous] : [], difficulty: index < 3 ? "beginner" : index < 8 ? "intermediate" : "advanced",
    tags: [track.id, `stage-${stageId}`], guide: [
      { kind: "概念入门", title: "先建立心智模型", body: "明确输入、处理步骤和输出，不把框架魔法当作黑盒。", bullets: ["写出输入", "标出状态", "说明输出"], example: "input -> process -> output" },
      { kind: "逐步拆解", title: "再拆成可观察步骤", body: "每一步都可以单独运行或检查，失败时保留真实原因。", bullets: ["先做最小例子", "逐步增加边界", "记录实际结果"], example: "step_one(); step_two()" },
      { kind: "常见误区", title: "最后验证边界", body: "用一个没有出现在示例里的输入确认实现不是写死样例。", bullets: ["改变输入", "检查失败", "再复盘"], example: "assert result == expected" },
    ], videos: [], officialSources: [{ ...source, kind: "official-doc", verifiedAt: "2026-09-02" }], migrations: [], project,
    projectLinks: [], exercise: { prompt: `完成 ${track.shortTitle} 主题练习并通过行为检查。`, starterCode: "result = None", hints: ["先描述数据流", "实现最小步骤", "用边界输入复测"], solution: "result = input_value", },
    browserChecks: [{ name: "典型输入", expression: "behavioral result", failure: "典型输入行为不符", kind: "behavior" }, { name: "边界输入", expression: "boundary result", failure: "边界输入行为不符", kind: "behavior" }],
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
    const stage = stages[lesson.order % stages.length];
    lesson.stageId = stage.id;
    lesson.order = lessons.indexOf(lesson) + 1;
    if (projects < expansion.projectCount && !lesson.project) { lesson.project = true; projects += 1; }
    stage.lessonIds.push(lesson.id);
  }
  return { ...track, stages, lessons };
}

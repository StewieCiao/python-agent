import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const schema = await import("../app/content/schema.ts");
const { buildAuthoredTrack } = await import("../app/content/authoring/buildTrack.ts");

const validCatalog = {
  schemaVersion: "stewie-catalog-v1",
  verifiedAt: "2026-09-02",
  runtimeVersions: {
    python: "3.13.15",
    pyodide: "314.0.3",
    langchain: "1.2.12",
    langgraph: "1.1.2",
    langgraphCheckpointSqlite: "2.0.6",
  },
  tracks: [
    {
      id: "python",
      title: "Python",
      shortTitle: "Python",
      description: "基础路线",
      accent: "#000000",
      currentLessonId: "python-1",
      stages: [
        {
          id: "python-start",
          order: 1,
          title: "起步",
          description: "先建立基础",
          lessonIds: ["python-1"],
        },
      ],
      lessons: [
        {
          id: "python-1",
          stageId: "python-start",
          order: 1,
          title: "第一课",
          kicker: "输出",
          summary: "认识输出",
          minutes: 10,
          prerequisites: [],
          difficulty: "beginner",
          tags: ["output"],
          guide: [
            {
              kind: "概念入门",
              title: "概念",
              body: "说明",
              bullets: ["要点"],
              example: "print(1)",
            },
            { kind: "逐步拆解", title: "步骤", body: "拆开", bullets: ["步骤"], example: "x = 1" },
            { kind: "常见误区", title: "边界", body: "检查", bullets: ["边界"], example: "assert x == 1" },
          ],
          videos: [],
          officialSources: [
            {
              kind: "official-doc",
              label: "Python",
              url: "https://docs.python.org/3/tutorial/",
              verifiedAt: "2026-09-02",
            },
          ],
          migrations: [],
          project: false,
          projectLinks: [],
          exercise: {
            prompt: "输出 1",
            starterCode: "print()",
            hints: ["调用 print", "检查参数", "运行验证"],
            solution: "print(1)",
          },
          browserChecks: [
            {
              name: "输出正确",
              expression: "_output == '1'",
              failure: "应输出 1",
              kind: "behavior",
            },
          ],
        },
      ],
    },
  ],
};

for (const [id, title] of [["langchain-rag", "LangChain"], ["langgraph", "LangGraph"]]) {
  const track = structuredClone(validCatalog.tracks[0]);
  track.id = id;
  track.title = title;
  track.shortTitle = title;
  track.currentLessonId = `${id}-1`;
  track.stages[0].id = `${id}-start`;
  track.stages[0].lessonIds = [`${id}-1`];
  track.lessons[0].id = `${id}-1`;
  track.lessons[0].stageId = `${id}-start`;
  validCatalog.tracks.push(track);
}

test("schema validator accepts a complete catalog", () => {
  assert.doesNotThrow(() => schema.validateAuthoredCatalog(validCatalog));
});

test("schema validator rejects duplicate lesson ids and broken stage references", () => {
  const duplicate = structuredClone(validCatalog);
  duplicate.tracks[0].lessons.push(structuredClone(duplicate.tracks[0].lessons[0]));
  assert.throws(
    () => schema.validateAuthoredCatalog(duplicate),
    /重复 lesson id/,
  );

  const brokenStage = structuredClone(validCatalog);
  brokenStage.tracks[0].lessons[0].stageId = "missing-stage";
  assert.throws(
    () => schema.validateAuthoredCatalog(brokenStage),
    /未知阶段/,
  );

  const brokenPrerequisite = structuredClone(validCatalog);
  brokenPrerequisite.tracks[0].lessons[0].prerequisites = ["future-lesson"];
  assert.throws(
    () => schema.validateAuthoredCatalog(brokenPrerequisite),
    /先修课程必须存在且早于当前课程/,
  );

  const brokenOrder = structuredClone(validCatalog);
  brokenOrder.tracks[0].lessons[0].order = 2;
  assert.throws(() => schema.validateAuthoredCatalog(brokenOrder), /课程 order 必须连续/);

  const brokenStageIndex = structuredClone(validCatalog);
  brokenStageIndex.tracks[0].stages[0].lessonIds = [];
  assert.throws(() => schema.validateAuthoredCatalog(brokenStageIndex), /未收录课程/);
});

test("schema validator rejects unsafe video domains and incomplete migrations", () => {
  const unsafeVideo = structuredClone(validCatalog);
  unsafeVideo.tracks[0].lessons[0].videos.push({
    title: "bad",
    url: "https://example.com/video",
    provider: "LangChain Academy",
    language: "英文",
    duration: "10m",
    note: "bad",
  });
  assert.throws(
    () => schema.validateAuthoredCatalog(unsafeVideo),
    /不允许的视频域名/,
  );

  const missingGuide = structuredClone(validCatalog);
  missingGuide.tracks[0].lessons[0].guide = [];
  assert.throws(
    () => schema.validateAuthoredCatalog(missingGuide),
    /guide/,
  );

  const missingSource = structuredClone(validCatalog);
  missingSource.tracks[0].lessons[0].officialSources = [];
  assert.throws(
    () => schema.validateAuthoredCatalog(missingSource),
    /官方来源/,
  );
});

test("正式作者路线保留讲解、提示、判题和项目关系", () => {
  const track = {
    id: "langchain-rag",
    title: "LangChain",
    shortTitle: "LC",
    description: "路线",
    accent: "#000000",
    currentLessonId: "rich-lesson",
    lessons: [{
      id: "rich-lesson",
      familyId: "rich-family",
      title: "可观察练习",
      summary: "能根据输入返回结果",
      minutes: 20,
      guide: [
        { title: "概念", body: "概念", bullets: ["要点"], example: "例子" },
        { title: "拆解", body: "拆解", bullets: ["步骤"], example: "步骤" },
        { title: "误区", body: "误区", bullets: ["边界"], example: "边界" },
      ],
      videos: [],
      officialSources: [{ label: "官方", url: "https://docs.langchain.com/oss/python/learn" }],
      migrations: [],
      exercise: { prompt: "完成", starterCode: "", hints: ["定位", "拆解", "修正"], solution: "完成" },
      browserChecks: [{ name: "行为", expression: "True", failure: "失败", kind: "behavior" }],
      project: true,
      projectLinks: ["rich-lesson"],
    }],
  };

  const authored = buildAuthoredTrack(track, [{ id: "langchain-stage-1", title: "起步", description: "建立基础" }]);
  const [lesson] = authored.lessons;
  assert.equal(lesson.guide.length, 3);
  assert.deepEqual(lesson.exercise.hints, ["定位", "拆解", "修正"]);
  assert.equal(lesson.browserChecks.length, 1);
  assert.equal(lesson.project, true);
  assert.deepEqual(lesson.projectLinks, ["rich-lesson"]);
  assert.equal(lesson.familyId, "rich-family");
});

test("正式作者转换器不会静默补写缺失讲解卡", async () => {
  const { buildAuthoredTrack } = await import("../app/content/authoring/buildTrack.ts");
  const track = {
    id: "langgraph",
    title: "LangGraph",
    shortTitle: "Graph",
    description: "路线",
    accent: "#000000",
    currentLessonId: "lesson",
    lessons: [{
      id: "lesson",
      title: "缺卡课程",
      summary: "测试",
      minutes: 10,
      guide: [{ title: "概念", body: "说明", bullets: ["要点"], example: "x" }],
      videos: [], officialSources: [{ label: "官方", url: "https://docs.langchain.com/oss/python/learn" }], migrations: [],
      exercise: { prompt: "完成", starterCode: "", hints: ["定位", "拆解", "修正"], solution: "完成" },
    }],
  };
  assert.throws(() => buildAuthoredTrack(track, [{ id: "stage", title: "阶段", description: "说明" }]), /必须正好包含三张讲解卡/);
});

test("LangChain 草稿具备三段讲解、三层提示、先修与行为检查", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  for (const id of ["model-messages-prompts", "structured-output", "runnable-pipeline"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson, `缺少 ${id}`);
    assert.equal(lesson.guide.length, 3);
    assert.equal(lesson.exercise.hints.length, 3);
    assert.ok(lesson.prerequisites.length >= 1);
    assert.ok(lesson.browserChecks.length >= 2);
    assert.ok(lesson.browserChecks.every(({ expression }) => !["lesson behavior", "lesson structure"].includes(expression)));
    assert.ok(lesson.officialSources.length >= 1);
    assert.ok(lesson.videos.every((video) => ["www.bilibili.com", "academy.langchain.com", "www.deeplearning.ai"].includes(new URL(video.url).hostname)));
    assert.ok(lesson.guide[2].body.includes(lesson.title), `${lesson.id} 的误区卡未关联课程标题`);
  }
});

test("LangChain 三节草稿的官方来源直接对应所教语义", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  const expected = {
    "model-messages-prompts": "https://docs.langchain.com/oss/python/langchain/messages",
    "structured-output": "https://docs.langchain.com/oss/python/langchain/structured-output",
    "runnable-pipeline": "https://docs.langchain.com/oss/python/langchain/knowledge-base",
  };
  for (const [id, url] of Object.entries(expected)) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.ok(lesson.officialSources.some((source) => source.url === url), `${id} 缺少直接语义来源`);
  }
});

test("LangChain/RAG 十节原始课程的 id 顺序保持稳定", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  const expected = [
    "memory-modernization",
    "document-loaders",
    "indexing-vector-store",
    "retrieval-chain",
    "rag-project",
    "agent-v1",
    "agent-rag-project",
    "model-messages-prompts",
    "structured-output",
    "runnable-pipeline",
  ];
  assert.deepEqual(track.lessons.map(({ id }) => id), expected);
});

test("框架作者模块不反向依赖旧学习目录", async () => {
  for (const path of ["../app/content/langchain-rag/index.ts", "../app/content/langchain-rag/source.ts", "../app/content/langgraph/index.ts", "../app/content/langgraph/source.ts"]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from ["'][^"']*learningCatalog(?:\.ts)?["']/);
  }
});

test("LangGraph 基础代表课明确输入输出和可运行最小骨架", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const lesson = authoredCatalog.tracks.find(({ id }) => id === "langgraph").lessons.find(({ id }) => id === "graph-foundations");
  assert.match(lesson.exercise.prompt, /输入.*topic/);
  assert.match(lesson.exercise.prompt, /输出.*node_update/);
  assert.match(lesson.exercise.starterCode, /def draft\(state\)/);
  assert.match(lesson.exercise.solution, /node_update = draft\(/);
  assert.match(lesson.exercise.solution, /graph_edges = \["START", "draft", "END"\]/);
});

test("LangChain 消息代表课先验证可观察的数据契约", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const lesson = authoredCatalog.tracks.find(({ id }) => id === "langchain-rag").lessons.find(({ id }) => id === "model-messages-prompts");
  assert.match(lesson.exercise.prompt, /输入是.*topic/);
  assert.match(lesson.exercise.prompt, /输出是.*messages/);
  assert.match(lesson.exercise.starterCode, /prompt_variables/);
  assert.match(lesson.exercise.solution, /messages = \[/);
  assert.match(lesson.exercise.solution, /prompt_variables = \["topic"\]/);
});

test("LangChain 检索代表课明确召回输入、上限和无命中状态", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const lesson = authoredCatalog.tracks.find(({ id }) => id === "langchain-rag").lessons.find(({ id }) => id === "retrieval-chain");
  assert.match(lesson.exercise.prompt, /输入是.*question.*documents.*top_k/);
  assert.match(lesson.exercise.prompt, /输出是.*retrieved/);
  assert.match(lesson.exercise.prompt, /无命中/);
  assert.match(lesson.exercise.starterCode, /def retrieve\(question, documents, top_k\)/);
  assert.match(lesson.exercise.solution, /retrieved = retrieve\(/);
  assert.match(lesson.exercise.solution, /context = /);
});

test("LangGraph 路由代表课明确状态输入、分支输出和循环上限", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const lesson = authoredCatalog.tracks.find(({ id }) => id === "langgraph").lessons.find(({ id }) => id === "state-reducers-routing");
  assert.match(lesson.exercise.prompt, /输入是.*score.*attempts/);
  assert.match(lesson.exercise.prompt, /输出是.*route_result/);
  assert.match(lesson.exercise.starterCode, /def route\(state\)/);
  assert.match(lesson.exercise.solution, /route_result = route\(/);
  assert.match(lesson.exercise.solution, /attempts.*2/);
  assert.match(lesson.guide[1].example, /state =/);
  assert.match(lesson.guide[1].example, /route_result =/);
  assert.match(lesson.guide[1].example, /revise/);
});

test("课程视频只使用允许的视频域名，官方文档不会伪装成视频", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const allowedHosts = new Set(["www.bilibili.com", "academy.langchain.com", "www.deeplearning.ai"]);
  for (const track of learningTracks) {
    for (const lesson of track.lessons) {
      for (const video of lesson.videos) {
        assert.ok(allowedHosts.has(new URL(video.url).hostname), `${track.id}/${lesson.id} 使用了不允许的视频域名`);
      }
      for (const source of lesson.officialSources) {
        assert.equal(new URL(source.url).protocol, "https:");
      }
    }
  }
});

test("LangChain 草稿为旧 API 提供可核验迁移卡", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  for (const id of ["model-messages-prompts", "structured-output", "runnable-pipeline"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.ok(lesson.migrations.length >= 1, `${id} 缺少迁移卡`);
    assert.ok(lesson.migrations.every((item) => item.beforeCode && item.afterCode && item.officialSources.length >= 1));
  }
});

test("LangGraph 核心草稿标出旧记忆/图 API 的迁移边界", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langgraph");
  assert.ok(track);
  for (const id of ["graph-foundations", "persistence-short-memory", "long-term-store"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.ok(lesson.migrations.length >= 1, `${id} 缺少迁移卡`);
    assert.ok(lesson.migrations.every((item) => item.beforeCode && item.afterCode && item.officialSources.length >= 1));
  }
});

test("LangGraph 核心作者课直接提供三张关联讲解卡", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langgraph");
  assert.ok(track);
  for (const id of ["graph-foundations", "state-reducers-routing", "persistence-short-memory"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.equal(lesson.guide.length, 3);
    assert.ok(lesson.guide[2].body.includes(lesson.title), `${id} 的误区卡未关联课程标题`);
  }
});

test("LangGraph 其余核心作者课也直接提供三张讲解卡", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langgraph");
  assert.ok(track);
  for (const id of ["streaming-interrupts", "subgraphs-parallelism", "memory-research-project"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.equal(lesson.guide.length, 3);
    assert.ok(lesson.guide[2].body.includes(lesson.title), `${id} 的误区卡未关联课程标题`);
  }
});

test("框架作者源的每节课程都直接提供三张讲解卡", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  for (const track of learningTracks.filter(({ id }) => id !== "python")) {
    for (const lesson of track.lessons) {
      assert.equal(lesson.guide.length, 3, `${track.id}/${lesson.id} 仍依赖转换器补卡`);
      assert.ok(lesson.guide[2].body.includes(lesson.title), `${track.id}/${lesson.id} 的误区卡未关联标题`);
    }
  }
});

test("LangGraph 执行与项目课保留真实迁移边界", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langgraph");
  assert.ok(track);
  for (const id of ["streaming-interrupts", "subgraphs-parallelism", "memory-research-project"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.ok(lesson.migrations.length >= 1, `${id} 缺少迁移卡`);
    assert.ok(lesson.migrations.every((item) => item.beforeCode && item.afterCode && item.officialSources.length >= 1));
  }
});

test("LangChain 检索与 Agent 项目课保留旧写法迁移边界", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  const track = learningTracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  for (const id of ["document-loaders", "indexing-vector-store", "retrieval-chain", "rag-project", "agent-rag-project"]) {
    const lesson = track.lessons.find((item) => item.id === id);
    assert.ok(lesson);
    assert.ok(lesson.migrations.length >= 1, `${id} 缺少迁移卡`);
    assert.ok(lesson.migrations.every((item) => item.beforeCode && item.afterCode && item.officialSources.length >= 1));
  }
});

test("框架作者路线保留可解释的先修链", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  for (const trackId of ["langchain-rag", "langgraph"]) {
    const track = learningTracks.find(({ id }) => id === trackId);
    assert.ok(track);
    for (const [index, lesson] of track.lessons.entries()) {
      if (index === 0) continue;
      assert.ok(lesson.prerequisites?.length, `${trackId}/${lesson.id} 缺少先修关系`);
    }
  }
});

test("框架作者源的每节课程都直接提供三层提示", async () => {
  const { learningTracks } = await import("../app/content/learningCatalog.ts");
  for (const track of learningTracks.filter(({ id }) => id !== "python")) {
    for (const lesson of track.lessons) {
      assert.equal(lesson.exercise.hints?.length, 3, `${track.id}/${lesson.id} 仍依赖通用提示默认值`);
      assert.equal(new Set(lesson.exercise.hints).size, 3, `${track.id}/${lesson.id} 提示重复`);
    }
  }
});

test("Python 内容模块保留现有 25 个 lesson id 并合并讲义、答案和判题", async () => {
  const { pythonLessons } = await import("../app/content/python/index.ts");
  assert.equal(pythonLessons.length, 25);
  assert.deepEqual(
    pythonLessons.map(({ id }) => id),
    [
      "first-output", "variables", "strings", "branches", "loops", "functions",
      "lists", "dictionaries", "exceptions", "classes", "generators", "decorators",
      "project-text", "project-expense", "project-tasks", "agent-tool-registry",
      "agent-action-parser", "agent-react-loop", "agent-plan-solve", "agent-reflection",
      "agent-memory-retrieval", "agent-handoff", "agent-travel-project",
      "agent-deep-research-project", "agent-framework-capstone",
    ],
  );
  for (const lesson of pythonLessons) {
    assert.ok(lesson.guide.length >= 1);
    assert.ok(lesson.exercise.solution);
    assert.ok(lesson.browserChecks.length >= 1);
  }
});

test("作者目录聚合三条路线且 lesson id 不重复", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  assert.deepEqual(
    authoredCatalog.tracks.map(({ id }) => id),
    ["python", "langchain-rag", "langgraph"],
  );
  assert.deepEqual(
    authoredCatalog.tracks.map(({ lessons }) => lessons.length),
    [64, 48, 42],
  );
  const ids = authoredCatalog.tracks.flatMap(({ lessons }) => lessons.map(({ id }) => id));
  assert.equal(new Set(ids).size, ids.length);
});

test("完整课程地图达到三条路线的目标规模与项目数", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const expectations = { python: [64, 8, 6], "langchain-rag": [48, 7, 4], langgraph: [42, 7, 4] };
  for (const track of authoredCatalog.tracks) {
    const [lessonCount, stageCount, projectCount] = expectations[track.id];
    assert.equal(track.lessons.length, lessonCount, `${track.id} lesson 数量`);
    assert.equal(track.stages.length, stageCount, `${track.id} stage 数量`);
    assert.equal(track.lessons.filter(({ project }) => project).length, projectCount, `${track.id} project 数量`);
    const projectIds = new Set(track.lessons.filter(({ project }) => project).map(({ id }) => id));
    for (const lesson of track.lessons) assert.ok(lesson.projectLinks.every((id) => projectIds.has(id)), `${track.id}/${lesson.id} projectLinks 必须指向项目课`);
    const generated = track.lessons.filter(({ id }) => id.includes("-lesson-"));
    for (const lesson of generated) {
      const index = track.lessons.indexOf(lesson);
      assert.deepEqual(lesson.prerequisites, index > 0 ? [track.lessons[index - 1].id] : [], `${track.id}/${lesson.id} 扩展课先修应连续`);
    }
  }
});

test("每节课程都带有与主题对应的官方来源", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    for (const lesson of track.lessons) {
      assert.ok(lesson.officialSources.length >= 1, `${track.id}/${lesson.id} 缺少官方来源`);
    }
  }
});

test("Python 基础路线保留真实的先修关系", async () => {
  const { pythonLessons } = await import("../app/content/python/index.ts");
  const byId = new Map(pythonLessons.map((lesson) => [lesson.id, lesson]));
  assert.deepEqual(byId.get("variables").prerequisites, ["first-output"]);
  assert.deepEqual(byId.get("branches").prerequisites, ["strings"]);
  assert.deepEqual(byId.get("loops").prerequisites, ["branches"]);
  assert.deepEqual(byId.get("functions").prerequisites, ["loops"]);
  assert.deepEqual(byId.get("agent-tool-registry").prerequisites, ["project-tasks"]);
});

test("课程阶段按学习顺序连续分配，不交错基础与进阶课", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    const stageIndex = new Map(track.stages.map((stage, index) => [stage.id, index]));
    let last = 0;
    for (const lesson of track.lessons) {
      const current = stageIndex.get(lesson.stageId);
      assert.ok(current !== undefined);
      assert.ok(current >= last, `${track.id}/${lesson.id} 阶段顺序倒退`);
      last = current;
    }
  }
});

test("扩展课程把真实场景带入讲解卡和练习要求", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    for (const lesson of track.lessons.filter(({ id, project }) => id.includes("-lesson-") && !project)) {
      const match = lesson.exercise.prompt.match(/场景：([^。]+)/);
      if (!match) continue;
      assert.ok(lesson.guide.every(({ body }) => body.includes(match[1])), `${track.id}/${lesson.id} 讲解缺少场景上下文`);
    }
  }
});

test("三条路线的扩展课使用多种场景标签", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    const labels = new Set(
      track.lessons
        .filter(({ id, project }) => id.includes("-lesson-") && !project)
        .map((lesson) => lesson.exercise.prompt.match(/场景：([^。]+)/)?.[1])
        .filter((label) => label),
    );
    assert.ok(labels.size >= 2, `${track.id} 扩展课场景过于单一`);
  }
});

test("迁移卡核验版本与锁定运行时一致", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    for (const lesson of track.lessons) {
      for (const migration of lesson.migrations) {
        assert.equal(migration.verifiedVersions.langchain, authoredCatalog.runtimeVersions.langchain, `${lesson.id} LangChain 版本漂移`);
        assert.equal(migration.verifiedVersions.langgraph, authoredCatalog.runtimeVersions.langgraph, `${lesson.id} LangGraph 版本漂移`);
      }
    }
  }
});

test("项目标记不抢占路线开头的基础课", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    assert.equal(track.lessons[0].project, false, `${track.id} 第一节应保持基础课`);
    assert.ok(track.lessons.slice(1).some(({ project }) => project), `${track.id} 应包含项目课`);
  }
});

test("框架项目练习包含各自用户故事且保留真实检查", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks.filter(({ id }) => id !== "python")) {
    for (const lesson of track.lessons.filter(({ project }) => project)) {
      assert.match(lesson.exercise.prompt, /用户故事：/);
      assert.ok(lesson.exercise.prompt.length > 100, `${lesson.id} 项目契约过短`);
      assert.ok(lesson.browserChecks.length >= 2, `${lesson.id} 缺少真实验收检查`);
      assert.doesNotMatch(lesson.exercise.prompt, /为一个真实使用者交付可演示的最小版本。\n输入与输出/);
    }
  }
});

test("行为导向扩展课不使用占位判题表达式", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const expanded = authoredCatalog.tracks.flatMap(({ lessons }) => lessons.filter((lesson) => lesson.title.includes("写出可验证的实现")));
  assert.ok(expanded.length >= 10);
  for (const lesson of expanded) {
    assert.ok(lesson.browserChecks.every(({ expression }) => !["behavioral result", "boundary result"].includes(expression)), lesson.id);
    assert.ok(lesson.exercise.prompt.length >= 20, lesson.id);
  }
});

test("Python 进阶基础主题也有独立的可执行练习", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const python = authoredCatalog.tracks.find(({ id }) => id === "python");
  assert.ok(python);
  for (const topic of ["变量与类型", "模块拆分", "命令行工具", "并发基础"]) {
    const lesson = python.lessons.find(({ title }) => title.startsWith(topic));
    assert.ok(lesson, `缺少 ${topic} 课程`);
    assert.match(lesson.title, /写出可验证的实现/);
    assert.ok(lesson.browserChecks.every(({ kind }) => kind === "behavior"));
  }
});

test("LangChain/RAG 基础主题提供独立的可执行练习", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const track = authoredCatalog.tracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  for (const topic of ["消息角色", "Prompt 模板", "结构化输出", "Runnable 组合", "模型配置", "向量存储"]) {
    const lesson = track.lessons.find(({ title }) => title.startsWith(topic) && title.includes("写出可验证的实现"));
    assert.ok(lesson, `缺少 ${topic} 课程`);
    assert.match(lesson.title, /写出可验证的实现/);
    assert.ok(lesson.exercise.prompt.length >= 30);
    assert.ok(lesson.browserChecks.length >= 2 && lesson.browserChecks.every(({ kind }) => kind === "behavior"));
  }
});

test("LangGraph 基础主题提供独立的可执行练习", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const track = authoredCatalog.tracks.find(({ id }) => id === "langgraph");
  assert.ok(track);
  for (const topic of ["StateGraph", "节点与边", "Reducer", "短期记忆", "Store", "长期记忆"]) {
    const lesson = track.lessons.find(({ title }) => title.startsWith(topic) && title.includes("写出可验证的实现"));
    assert.ok(lesson, `缺少 ${topic} 课程`);
    assert.ok(lesson.exercise.prompt.length >= 30);
    assert.ok(lesson.browserChecks.length >= 2 && lesson.browserChecks.every(({ kind }) => kind === "behavior"));
  }
});

test("LangChain/RAG 进阶主题提供可诊断的行为练习", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const track = authoredCatalog.tracks.find(({ id }) => id === "langchain-rag");
  assert.ok(track);
  for (const topic of ["混合检索", "重排", "RAG 评估", "追踪与观测", "工具调用", "Agent 循环"]) {
    const lesson = track.lessons.find(({ title }) => title.startsWith(topic) && title.includes("写出可验证的实现"));
    assert.ok(lesson, `缺少 ${topic} 课程`);
    assert.ok(lesson.exercise.prompt.length >= 30);
    assert.ok(lesson.browserChecks.length >= 2 && lesson.browserChecks.every(({ kind }) => kind === "behavior"));
  }
});

test("LangGraph 执行主题提供恢复与组合练习", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const track = authoredCatalog.tracks.find(({ id }) => id === "langgraph");
  assert.ok(track);
  for (const topic of ["恢复执行", "流式事件", "子图"]) {
    const lesson = track.lessons.find(({ title }) => title.startsWith(topic) && title.includes("写出可验证的实现"));
    assert.ok(lesson, `缺少 ${topic} 课程`);
    assert.ok(lesson.exercise.prompt.length >= 30);
    assert.ok(lesson.browserChecks.length >= 2 && lesson.browserChecks.every(({ kind }) => kind === "behavior"));
  }
});

test("扩展路线的剩余主题不使用概念占位练习", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const cases = [
    ["langchain-rag", ["多查询检索", "RAG 项目"]],
    ["langgraph", ["并行分支", "Supervisor", "多 Agent 协作", "人工审核", "Graph 项目"]],
  ];
  for (const [trackId, topics] of cases) {
    const track = authoredCatalog.tracks.find(({ id }) => id === trackId);
    assert.ok(track);
    for (const topic of topics) {
      const lesson = track.lessons.find(({ title }) => title.startsWith(topic) && title.includes("写出可验证的实现"));
      assert.ok(lesson, `缺少 ${topic} 课程`);
      assert.ok(lesson.browserChecks.length >= 2);
    }
  }
});

test("框架项目课使用清晰的作品主题而不是迁移练习标题", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const trackId of ["langchain-rag", "langgraph"]) {
    const track = authoredCatalog.tracks.find(({ id }) => id === trackId);
    assert.ok(track);
    for (const lesson of track.lessons.filter(({ project }) => project)) {
      assert.doesNotMatch(lesson.title, /迁移练习/);
      assert.match(lesson.exercise.prompt, /用户场景/);
      assert.match(lesson.summary, /为/);
    }
  }
});

test("扩展后的框架课程每节都有允许域名的视频资源", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks.filter(({ id }) => id !== "python")) {
    for (const lesson of track.lessons) {
      assert.ok(lesson.videos.length > 0, `${lesson.id} 缺少配套视频`);
      assert.ok(lesson.videos.every((video) => ["www.bilibili.com", "academy.langchain.com", "www.deeplearning.ai"].includes(new URL(video.url).hostname)), `${lesson.id} 视频域名不允许`);
    }
  }
});

test("每节课程至少提供两项可解释的反馈检查", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    for (const lesson of track.lessons) {
      assert.ok(lesson.browserChecks.length >= 2, `${track.id}/${lesson.id}`);
      assert.ok(lesson.browserChecks.every(({ name, expression, failure }) => name && expression && failure));
    }
  }
});

test("项目节点覆盖多个阶段并优先连接同阶段项目", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  for (const track of authoredCatalog.tracks) {
    const projectStages = new Set(track.lessons.filter(({ project }) => project).map(({ stageId }) => stageId));
    assert.ok(projectStages.size >= 2, `${track.id} 项目应分布在多个阶段`);
    for (const lesson of track.lessons.filter(({ project }) => !project)) {
      const sameStageProject = track.lessons.find((candidate) => candidate.project && candidate.stageId === lesson.stageId);
      if (sameStageProject) assert.ok(lesson.projectLinks.includes(sameStageProject.id), `${track.id}/${lesson.id} 应连接同阶段项目`);
    }
  }
});

test("自动生成项目课包含可交付验收契约", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const generatedProjects = authoredCatalog.tracks.flatMap(({ lessons }) => lessons.filter(({ project, id }) => project && id.includes("-lesson-")));
  assert.ok(generatedProjects.length >= 5);
  for (const lesson of generatedProjects) {
    assert.match(lesson.exercise.prompt, /阶段项目/);
    assert.match(lesson.exercise.prompt, /失败状态/);
    assert.match(lesson.exercise.prompt, /边界测试/);
    assert.match(lesson.exercise.prompt, /README/);
    assert.equal(lesson.exercise.hints.length, 3);
  }
});

test("框架阶段项目提供真实领域契约而不是通用组合函数", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const projectTitles = new Set(["可引用文档问答系统", "混合检索评估台", "带工具调用的知识助手", "RAG 质量观测面板", "可恢复研究工作流", "人工审核 Agent 流程", "多 Agent 协作调度器", "带长期记忆的任务图"]);
  const projects = authoredCatalog.tracks.flatMap(({ lessons }) => lessons.filter(({ title }) => projectTitles.has(title)));
  assert.equal(projects.length, 8);
  assert.ok(projects.every((lesson) => lesson.exercise.prompt.includes("最小可运行里程碑")));
  assert.ok(projects.some((lesson) => lesson.exercise.prompt.includes("引用")));
  assert.ok(projects.some((lesson) => lesson.exercise.prompt.includes("thread")));
});

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

test("build-learning 生成两个带真实 catalog/family 哈希的确定性快照", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  execFileSync(process.execPath, ["--experimental-strip-types", "scripts/build-learning-bundle.mjs"], {
    cwd: root,
    stdio: "pipe",
  });
  const publicText = await readFile(new URL("../generated/course-public.json", import.meta.url), "utf8");
  const serviceText = await readFile(new URL("../generated/learning-service.json", import.meta.url), "utf8");
  const publicSnapshot = JSON.parse(publicText);
  const serviceSnapshot = JSON.parse(serviceText);
  assert.equal(publicSnapshot.schemaVersion, "stewie-catalog-v1");
  assert.equal(serviceSnapshot.schemaVersion, "stewie-catalog-v1");
  assert.deepEqual(serviceSnapshot.catalog, publicSnapshot.catalog);
  assert.equal(publicSnapshot.catalogHash, sha256(canonicalJson(publicSnapshot.catalog)));
  assert.equal(serviceSnapshot.catalogHash, publicSnapshot.catalogHash);
  assert.equal(publicSnapshot.familyHash, sha256(canonicalJson({ checks: serviceSnapshot.checks, families: serviceSnapshot.families })));
  assert.equal(serviceSnapshot.familyHash, publicSnapshot.familyHash);
  assert.deepEqual(
    serviceSnapshot.checks,
    Object.fromEntries(serviceSnapshot.catalog.tracks.flatMap((track) => track.lessons.map((lesson) => [lesson.id, lesson.browserChecks]))),
  );
  const secondPublic = await readFile(new URL("../generated/course-public.json", import.meta.url), "utf8");
  const secondService = await readFile(new URL("../generated/learning-service.json", import.meta.url), "utf8");
  assert.equal(secondPublic, publicText);
  assert.equal(secondService, serviceText);
});

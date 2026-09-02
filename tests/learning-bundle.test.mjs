import test from "node:test";
import assert from "node:assert/strict";

const schema = await import("../app/content/schema.ts");

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
            hints: ["调用 print"],
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
    [25, 7, 7],
  );
  const ids = authoredCatalog.tracks.flatMap(({ lessons }) => lessons.map(({ id }) => id));
  assert.equal(new Set(ids).size, ids.length);
});

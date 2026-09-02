import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const schema = await import("../app/content/schema.ts");
const { adaptLegacyTrack } = await import("../app/content/courseTrackAdapter.ts");

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

test("legacy track adapter preserves instructional fields instead of erasing them", () => {
  const track = {
    id: "langchain-rag",
    title: "LangChain",
    shortTitle: "LC",
    description: "路线",
    accent: "#000000",
    currentLessonId: "rich-lesson",
    lessons: [{
      id: "rich-lesson",
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

  const adapted = adaptLegacyTrack(track);
  const [lesson] = adapted.lessons;
  assert.equal(lesson.guide.length, 3);
  assert.deepEqual(lesson.exercise.hints, ["定位", "拆解", "修正"]);
  assert.equal(lesson.browserChecks.length, 1);
  assert.equal(lesson.project, true);
  assert.deepEqual(lesson.projectLinks, ["rich-lesson"]);
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
    assert.ok(lesson.officialSources.length >= 1);
    assert.ok(lesson.videos.every((video) => ["www.bilibili.com", "academy.langchain.com", "www.deeplearning.ai"].includes(new URL(video.url).hostname)));
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
  }
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

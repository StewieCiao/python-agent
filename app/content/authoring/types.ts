export type VideoResource = {
  title: string;
  url: string;
  provider: "黑马程序员" | "LangChain Academy" | "DeepLearning.AI";
  language: "中文" | "英文";
  duration: string;
  note: string;
};

export type MigrationNote = {
  title: string;
  status: "legacy" | "renamed" | "replaced";
  explanation: string;
  beforeCode: string;
  afterCode: string;
  officialSources: Array<{ label: string; url: string }>;
  verifiedAt: string;
  verifiedVersions: { langchain: string; langgraph: string };
};

export type LearningGuide = {
  title: string;
  body: string;
  bullets: string[];
  example: string;
};

export type LearningExercise = {
  prompt: string;
  starterCode: string;
  hints?: string[];
  solution: string;
};

export type LearningLesson = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  prerequisites?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  guide: LearningGuide[];
  videos: VideoResource[];
  officialSources: Array<{ label: string; url: string }>;
  migrations: MigrationNote[];
  project?: boolean;
  projectLinks?: string[];
  exercise: LearningExercise;
  browserChecks?: Array<{
    name: string;
    expression: string;
    failure: string;
    kind: "behavior" | "structure";
  }>;
  pythonLessonId?: string;
};

export type LearningTrack = {
  id: "python" | "langchain-rag" | "langgraph";
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  currentLessonId: string;
  lessons: LearningLesson[];
};

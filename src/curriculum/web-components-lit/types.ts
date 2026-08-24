import { ChallengeTest } from '../../types/scrim';

export interface ComponentCourseLessonSpec {
  number: number;
  module: number;
  title: string;
  appName: string;
  summary: string;
  concepts: { label: string; desc: string }[];
  skillsRequired: string[];
  skillsIntroduced: string[];
  reasoningSteps: [string, string, string, string];
  script: [string, string, string, string, string, string];
  html: string;
  supportFiles?: Record<string, string>;
  example: string;
  starter: string;
  challengeTitle: string;
  challengeInstructions: string;
  tests: ChallengeTest[];
  hints: [string, string, string];
  reading: {
    definition: string;
    mentalModel: string;
    secondExample: string;
    walkthrough: string;
    whenToUse: string;
    bestPractices: string;
    investigation: string;
    commonErrors: string;
    keyPoints: string[];
    questions: { question: string; answer: string }[];
    transfer: string;
    diagram: string;
    sources: { title: string; url: string; publisher: string; purpose: string }[];
  };
  debug: {
    title: string;
    expected: string;
    observed: string;
    starter: string;
    tests: ChallengeTest[];
    hints: [string, string, string];
  };
}

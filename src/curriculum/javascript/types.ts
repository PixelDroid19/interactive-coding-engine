import { ChallengeTest } from '../../types/scrim';

export interface JavaScriptLessonSpec {
  number: number;
  module: number;
  title: string;
  summary: string;
  concepts: { label: string; desc: string }[];
  skillsRequired: string[];
  skillsIntroduced: string[];
  script: [string, string, string, string];
  example: string;
  starter: string;
  challengeTitle: string;
  challengeInstructions: string;
  tests: ChallengeTest[];
  hints: [string, string, string];
  reading: {
    definition: string;
    secondExample: string;
    walkthrough: string;
    investigation: string;
    commonErrors: string;
    keyPoints: string[];
    questions: { question: string; answer: string }[];
    transfer: string;
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
  executionMode?: 'logic' | 'browser';
  html?: string;
}

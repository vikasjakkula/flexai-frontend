// Test data structure with support for HTML/LaTeX content
export interface Question {
  id: number;
  content: string; // Can contain HTML or LaTeX
  options: {
    id: string;
    content: string; // Can contain HTML or LaTeX
  }[];
  imageUrl?: string;
  correctAnswer?: string;
  section: 'Mathematics' | 'Physics' | 'Chemistry';
}

export interface TestInstructions {
  title: string;
  generalInstructions: string[];
  sectionInstructions: {
    name: string;
    questions: number;
    maxMarks: number;
    negativeMarks: number;
    positiveMarks: number;
  }[];
  duration: number; // in minutes
}

export interface TestData {
  id: string;
  title: string;
  type: 'previous' | 'mock';
  year?: string;
  set?: string;
  instructions: TestInstructions;
  questions: Question[];
}

// Static test data
export const testData: TestData = {
  id: "ts-eamcet-2023-set-a",
  title: "TS EAMCET Engineering Mock Test - 1",
  type: "mock",
  instructions: {
    title: "General Instructions",
    generalInstructions: [
      "Total duration of the examination is 180 Min",
      "Your clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.",
      "The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:",
      "However, this exam will be conducted with sectional timing. You need to complete a given section in the mentioned time. You will not be able to proceed to the next section unless you finish the current section in its allotted time frame."
    ],
    sectionInstructions: [
      {
        name: "Mathematics",
        questions: 80,
        maxMarks: 80,
        negativeMarks: 0,
        positiveMarks: 1
      },
      {
        name: "Physics",
        questions: 40,
        maxMarks: 40,
        negativeMarks: 0,
        positiveMarks: 1
      },
      {
        name: "Chemistry",
        questions: 40,
        maxMarks: 40,
        negativeMarks: 0,
        positiveMarks: 1
      }
    ],
    duration: 180
  },
  questions: [
    {
      id: 1,
      content: "Find the Cartesian equation of plane passing through the non-collinear points $(1, 2, 3), (1, 0, 3)$ and $(-1, 2, 0)$.",
      options: [
        { id: "A", content: "$6x + 2y + 4z + 6 = 0$" },
        { id: "B", content: "$6x + 4z + 6 = 0$" },
        { id: "C", content: "$6x - 4z + 6 = 0$" },
        { id: "D", content: "$6x + 2y - 4z + 6 = 0$" }
      ],
      correctAnswer: "A",
      section: "Mathematics"
    },
    {
      id: 2,
      content: "Let $R$ be the relation on the set $R$ of all real numbers, defined by $aRb$ if $f|a - b| \\leq 1$. Then, $R$ is:",
      options: [
        { id: "A", content: "Reflexive and symmetric only" },
        { id: "B", content: "Reflexive and transitive only" },
        { id: "C", content: "Equivalence" },
        { id: "D", content: "None of the above" }
      ],
      correctAnswer: "A",
      section: "Mathematics"
    },
    {
      id: 3,
      content: "An object is placed 15 cm in front of a concave mirror of focal length 10 cm. The position of the image is:",
      options: [
        { id: "A", content: "30 cm in front of the mirror" },
        { id: "B", content: "30 cm behind the mirror" },
        { id: "C", content: "6 cm behind the mirror" },
        { id: "D", content: "6 cm in front of the mirror" }
      ],
      correctAnswer: "B",
      section: "Physics"
    },
    {
      id: 4,
      content: "The hybridization of carbon in $CH_3-C\\equiv C-CH_3$ is:",
      options: [
        { id: "A", content: "$sp^3, sp, sp, sp^3$" },
        { id: "B", content: "$sp^3, sp^2, sp^2, sp^3$" },
        { id: "C", content: "$sp^2, sp, sp, sp^2$" },
        { id: "D", content: "$sp^3, sp^3, sp^3, sp^3$" }
      ],
      correctAnswer: "A",
      section: "Chemistry"
    }
  ]
};

// User's test progress state
export interface TestProgress {
  currentQuestionId: number;
  activeSection: string;
  answers: Record<number, string | null>;
  markedForReview: number[];
  answeredAndMarkedForReview: number[];
  visitedQuestions: number[];
  timeRemaining: number;
  sectionTimeRemaining?: number;
}

// Question status types for the sidebar
export const QuestionStatus = {
  NOT_VISITED: 'not-visited',
  ANSWERED: 'answered',
  VISITED_NOT_ANSWERED: 'visited-not-answered',
  MARKED_FOR_REVIEW: 'marked-for-review',
  ANSWERED_AND_MARKED_FOR_REVIEW: 'answered-and-marked-for-review'
} as const;

// Mock data for AIDU learning platform
// Realistic Indian CBSE Class 10 Science context

export interface LearningStyle {
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  personalityTraits: string[];
  preferredExplanationStyle: 'simple' | 'technical' | 'analogical' | 'socratic';
  attentionSpan: 'short' | 'medium' | 'long';
  motivationStyle: 'intrinsic' | 'extrinsic' | 'social';
  teachingGuidance: {
    recommendedApproach: string;
    preferredContentTypes: string[];
    engagementStrategies: string[];
    pacingRecommendations: string;
    effectiveInterventions: string[];
  };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: 'teal' | 'violet' | 'coral' | 'info' | 'slate';
  class: string;
  section: string;
  rollNumber: number;
  learningStyle?: LearningStyle;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: 'teal';
  subject: string;
  class: string;
  section: string;
}

export interface LessonProgress {
  lessonId: string;
  lessonName: string;
  topic: string;
  completedPercentage: number;
  timeSpent: string;
  lastAccessed: string;
}

export interface QuizScore {
  quizId: string;
  quizName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  feedback: string;
  date: string;
}

export interface Misconception {
  id: string;
  topic: string;
  description: string;
  questionsWrong: number;
  firstNoticed: string;
}

export interface EngagementMetric {
  questionsAsked: number;
  questionsAnswered: number;
  averageResponseTime: string;
  participationRate: number;
  streakDays: number;
  lastActive: string;
}

export interface MasteryLevel {
  topicId: string;
  topicName: string;
  masteryPercentage: number;
  trend: 'up' | 'down' | 'stable';
  estimatedMasteryDate: string;
}

export interface StudentDashboard {
  student: Student;
  currentLesson: LessonProgress;
  recentQuizzes: QuizScore[];
  misconceptions: Misconception[];
  engagement: EngagementMetric;
  masteryLevels: MasteryLevel[];
  overallMastery: number;
  streakDays: number;
  nextLesson: {
    lessonId: string;
    lessonName: string;
    topic: string;
    estimatedTime: string;
  };
  assignedHomework: {
    homeworkId: string;
    title: string;
    dueDate: string;
    estimatedTime: string;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  teachingGuidance: {
    recommendedApproach: string;
    preferredContentTypes: string[];
    engagementStrategies: string[];
    pacingRecommendations: string;
    effectiveInterventions: string[];
  };
}

export interface TeacherDashboard {
  teacher: Teacher;
  classOverview: {
    totalStudents: number;
    activeToday: number;
    averageMastery: number;
    masteryChange: number;
  };
  atRiskStudents: {
    student: Student;
    riskLevel: 'high' | 'medium' | 'low';
    reasons: string[];
    suggestedIntervention: string;
  }[];
  misconceptionClusters: {
    topic: string;
    affectedStudents: number;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  suggestedInterventions: {
    id: string;
    title: string;
    description: string;
    targetStudents: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  lessonEngagement: {
    lessonName: string;
    averageCompletion: number;
    peakEngagement: string;
    strugglingCount: number;
  }[];
  recentActivity: {
    student: Student;
    action: string;
    timestamp: string;
    type: 'question' | 'quiz' | 'lesson' | 'intervention';
  }[];
}

export interface ClassroomParticipant {
  id: string;
  name: string;
  role: 'professor' | 'skeptic' | 'builder' | 'examiner';
  avatar: string;
  color: 'teal' | 'violet' | 'coral' | 'info';
  isAI: boolean;
}

export interface ClassroomChatMessage {
  id: string;
  speaker: string;
  speakerRole: 'professor' | 'skeptic' | 'builder' | 'examiner' | 'student';
  message: string;
  timestamp: string;
  isAI: boolean;
}

export interface ClassroomData {
  sessionId: string;
  topic: string;
  subject: string;
  grade: string;
  duration: string;
  whiteboardContent: {
    equation: string;
    title: string;
  };
  participants: ClassroomParticipant[];
  chat: ClassroomChatMessage[];
  lessonProgress: {
    currentSection: string;
    completedSections: number;
    totalSections: number;
  };
}

// Teacher account
export const teacher: Teacher = {
  id: 'teacher-001',
  name: 'Prof. Priya Sharma',
  email: 'priya.sharma@aidu.tech',
  avatar: 'PS',
  color: 'teal',
  subject: 'Science',
  class: 'Class 10',
  section: 'A',
};

// Student accounts
export const students: Student[] = [
  {
    id: 'student-001',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@student.edu',
    avatar: 'AM',
    color: 'teal',
    class: 'Class 10',
    section: 'A',
    rollNumber: 1,
  },
  {
    id: 'student-002',
    name: 'Priya Patel',
    email: 'priya.patel@student.edu',
    avatar: 'PP',
    color: 'violet',
    class: 'Class 10',
    section: 'A',
    rollNumber: 2,
  },
  {
    id: 'student-003',
    name: 'Rahul Verma',
    email: 'rahul.verma@student.edu',
    avatar: 'RV',
    color: 'coral',
    class: 'Class 10',
    section: 'A',
    rollNumber: 3,
  },
  {
    id: 'student-004',
    name: 'Ananya Singh',
    email: 'ananya.singh@student.edu',
    avatar: 'AS',
    color: 'info',
    class: 'Class 10',
    section: 'A',
    rollNumber: 4,
  },
  {
    id: 'student-005',
    name: 'Vikram Rao',
    email: 'vikram.rao@student.edu',
    avatar: 'VR',
    color: 'teal',
    class: 'Class 10',
    section: 'A',
    rollNumber: 5,
  },
  {
    id: 'student-006',
    name: 'Kavya Nair',
    email: 'kavya.nair@student.edu',
    avatar: 'KN',
    color: 'violet',
    class: 'Class 10',
    section: 'A',
    rollNumber: 6,
  },
  {
    id: 'student-007',
    name: 'Aditya Kumar',
    email: 'aditya.kumar@student.edu',
    avatar: 'AK',
    color: 'coral',
    class: 'Class 10',
    section: 'A',
    rollNumber: 7,
  },
  {
    id: 'student-008',
    name: 'Sneha Gupta',
    email: 'sneha.gupta@student.edu',
    avatar: 'SG',
    color: 'info',
    class: 'Class 10',
    section: 'A',
    rollNumber: 8,
  },
  {
    id: 'student-009',
    name: 'Rohit Shah',
    email: 'rohit.shah@student.edu',
    avatar: 'RS',
    color: 'teal',
    class: 'Class 10',
    section: 'A',
    rollNumber: 9,
  },
  {
    id: 'student-010',
    name: 'Diya Sharma',
    email: 'diya.sharma@student.edu',
    avatar: 'DS',
    color: 'violet',
    class: 'Class 10',
    section: 'A',
    rollNumber: 10,
  },
];

// Mock student dashboard data
export const studentDashboards: Record<string, StudentDashboard> = {
  'student-001': {
    student: {
      ...students[0],
      learningStyle: {
        learningStyle: 'visual',
        personalityTraits: ['analytical', 'detail-oriented', 'methodical'],
        preferredExplanationStyle: 'technical',
        attentionSpan: 'medium',
        motivationStyle: 'intrinsic',
        teachingGuidance: {
          recommendedApproach: 'Use diagrams, flowcharts, and concept maps to illustrate relationships between ideas. Provide visual representations of processes.',
          preferredContentTypes: ['diagrams', 'charts', 'concept maps', 'visual simulations'],
          engagementStrategies: ['Give independent exploration time', 'Allow note-taking with visual aids', 'Present logical sequences'],
          pacingRecommendations: 'Standard pacing with brief visual breaks every 15-20 minutes',
          effectiveInterventions: ['Provide detailed diagrams for difficult concepts', 'Use color-coding for related concepts', 'Offer visual summaries after each section'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-003',
      lessonName: 'Cell Division: Mitosis and Meiosis',
      topic: 'Biology - Cell Biology',
      completedPercentage: 78,
      timeSpent: '32 minutes',
      lastAccessed: '2 hours ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-001',
        quizName: 'Cell Structure Fundamentals',
        score: 9,
        totalQuestions: 10,
        percentage: 90,
        feedback: 'Excellent understanding of cell organelles',
        date: '2026-04-28',
      },
      {
        quizId: 'quiz-002',
        quizName: 'Cell Division Basics',
        score: 7,
        totalQuestions: 10,
        percentage: 70,
        feedback: 'Good, but confuse phases of mitosis with meiosis',
        date: '2026-04-25',
      },
      {
        quizId: 'quiz-003',
        quizName: 'Photosynthesis Equation',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        feedback: 'Strong understanding of the equation balance',
        date: '2026-04-20',
      },
    ],
    misconceptions: [
      {
        id: 'misc-001',
        topic: 'Mitosis vs Meiosis',
        description: 'Confuses the purpose and outcomes of mitosis and meiosis',
        questionsWrong: 3,
        firstNoticed: '2026-04-25',
      },
    ],
    engagement: {
      questionsAsked: 12,
      questionsAnswered: 28,
      averageResponseTime: '45 seconds',
      participationRate: 85,
      streakDays: 7,
      lastActive: '2 hours ago',
    },
    masteryLevels: [
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 92, trend: 'up', estimatedMasteryDate: '2026-05-05' },
      { topicId: 'topic-002', topicName: 'Cell Division', masteryPercentage: 74, trend: 'up', estimatedMasteryDate: '2026-05-12' },
      { topicId: 'topic-003', topicName: 'Photosynthesis', masteryPercentage: 85, trend: 'stable', estimatedMasteryDate: '2026-05-08' },
      { topicId: 'topic-004', topicName: 'Atomic Structure', masteryPercentage: 68, trend: 'stable', estimatedMasteryDate: '2026-05-15' },
    ],
    overallMastery: 79,
    streakDays: 7,
    teachingGuidance: {
      recommendedApproach: 'Use diagrams, flowcharts, and concept maps to illustrate relationships between ideas. Provide visual representations of processes.',
      preferredContentTypes: ['diagrams', 'charts', 'concept maps', 'visual simulations'],
      engagementStrategies: ['Give independent exploration time', 'Allow note-taking with visual aids', 'Present logical sequences'],
      pacingRecommendations: 'Standard pacing with brief visual breaks every 15-20 minutes',
      effectiveInterventions: ['Provide detailed diagrams for difficult concepts', 'Use color-coding for related concepts', 'Offer visual summaries after each section'],
    },
    nextLesson: {
      lessonId: 'lesson-004',
      lessonName: 'Atomic Structure and Electron Configuration',
      topic: 'Chemistry - Atomic Structure',
      estimatedTime: '45 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-001',
        title: 'Cell Division Diagram Labeling',
        dueDate: '2026-05-03',
        estimatedTime: '25 minutes',
        status: 'in-progress',
      },
      {
        homeworkId: 'hw-002',
        title: 'Practice Problems on Photosynthesis',
        dueDate: '2026-05-05',
        estimatedTime: '30 minutes',
        status: 'pending',
      },
    ],
  },
  'student-002': {
    student: {
      ...students[1],
      learningStyle: {
        learningStyle: 'auditory',
        personalityTraits: ['social', 'collaborative', 'communicative'],
        preferredExplanationStyle: 'socratic',
        attentionSpan: 'long',
        motivationStyle: 'social',
        teachingGuidance: {
          recommendedApproach: 'Facilitate discussions and encourage verbal reasoning. Use Socratic questioning to guide learning through dialogue.',
          preferredContentTypes: ['discussions', 'debates', 'oral presentations', 'group problem-solving'],
          engagementStrategies: ['Pair with peers for group work', 'Encourage asking questions aloud', 'Use think-pair-share activities'],
          pacingRecommendations: 'Slower pacing with discussion pauses. Allow time for verbal processing.',
          effectiveInterventions: ['Schedule peer tutoring sessions', 'Use verbal quizzes', 'Incorporate group problem-solving activities'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-003',
      lessonName: 'Cell Division: Mitosis and Meiosis',
      topic: 'Biology - Cell Biology',
      completedPercentage: 92,
      timeSpent: '41 minutes',
      lastAccessed: '30 minutes ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-001',
        quizName: 'Cell Structure Fundamentals',
        score: 10,
        totalQuestions: 10,
        percentage: 100,
        feedback: 'Perfect score! Thorough understanding demonstrated',
        date: '2026-04-28',
      },
      {
        quizId: 'quiz-002',
        quizName: 'Cell Division Basics',
        score: 9,
        totalQuestions: 10,
        percentage: 90,
        feedback: 'Excellent grasp of cell division processes',
        date: '2026-04-25',
      },
    ],
    misconceptions: [],
    engagement: {
      questionsAsked: 18,
      questionsAnswered: 34,
      averageResponseTime: '38 seconds',
      participationRate: 94,
      streakDays: 14,
      lastActive: '30 minutes ago',
    },
    masteryLevels: [
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 98, trend: 'stable', estimatedMasteryDate: '2026-05-03' },
      { topicId: 'topic-002', topicName: 'Cell Division', masteryPercentage: 91, trend: 'up', estimatedMasteryDate: '2026-05-06' },
      { topicId: 'topic-003', topicName: 'Photosynthesis', masteryPercentage: 88, trend: 'up', estimatedMasteryDate: '2026-05-07' },
    ],
    overallMastery: 92,
    streakDays: 14,
    teachingGuidance: {
      recommendedApproach: 'Facilitate discussions and encourage verbal reasoning. Use Socratic questioning to guide learning through dialogue.',
      preferredContentTypes: ['discussions', 'debates', 'oral presentations', 'group problem-solving'],
      engagementStrategies: ['Pair with peers for group work', 'Encourage asking questions aloud', 'Use think-pair-share activities'],
      pacingRecommendations: 'Slower pacing with discussion pauses. Allow time for verbal processing.',
      effectiveInterventions: ['Schedule peer tutoring sessions', 'Use verbal quizzes', 'Incorporate group problem-solving activities'],
    },
    nextLesson: {
      lessonId: 'lesson-005',
      lessonName: 'Chemical Bonding and Ionic Compounds',
      topic: 'Chemistry - Chemical Bonding',
      estimatedTime: '50 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-003',
        title: 'Advanced Mitosis vs Meiosis Comparison',
        dueDate: '2026-05-02',
        estimatedTime: '35 minutes',
        status: 'pending',
      },
    ],
  },
  'student-003': {
    student: {
      ...students[2],
      learningStyle: {
        learningStyle: 'reading',
        personalityTraits: ['introverted', 'reflective', 'theoretical'],
        preferredExplanationStyle: 'analogical',
        attentionSpan: 'medium',
        motivationStyle: 'intrinsic',
        teachingGuidance: {
          recommendedApproach: 'Provide detailed written explanations with analogies that connect abstract concepts to familiar experiences.',
          preferredContentTypes: ['textbooks', 'reading assignments', 'written examples', 'analogy cards'],
          engagementStrategies: ['Assign reading before class', 'Provide written summaries', 'Allow independent reading time'],
          pacingRecommendations: 'Standard pacing with reading breaks. Pre-assign readings as preparation.',
          effectiveInterventions: ['Provide detailed reading material on electron configuration', 'Use relatable analogies for atomic structure', 'Offer written practice problems with step-by-step solutions'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-002',
      lessonName: 'Chemical Bonding Fundamentals',
      topic: 'Chemistry - Chemical Bonding',
      completedPercentage: 45,
      timeSpent: '18 minutes',
      lastAccessed: '1 day ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-004',
        quizName: 'Atomic Structure Quiz',
        score: 6,
        totalQuestions: 10,
        percentage: 60,
        feedback: 'Needs improvement in electron configuration',
        date: '2026-04-26',
      },
    ],
    misconceptions: [
      {
        id: 'misc-002',
        topic: 'Electron Configuration',
        description: 'Struggles with writing electron configurations for elements beyond Argon',
        questionsWrong: 4,
        firstNoticed: '2026-04-26',
      },
    ],
    engagement: {
      questionsAsked: 5,
      questionsAnswered: 12,
      averageResponseTime: '72 seconds',
      participationRate: 52,
      streakDays: 2,
      lastActive: '1 day ago',
    },
    masteryLevels: [
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 71, trend: 'stable', estimatedMasteryDate: '2026-05-18' },
      { topicId: 'topic-004', topicName: 'Atomic Structure', masteryPercentage: 58, trend: 'down', estimatedMasteryDate: '2026-05-20' },
    ],
    overallMastery: 64,
    streakDays: 2,
    teachingGuidance: {
      recommendedApproach: 'Provide detailed written explanations with analogies that connect abstract concepts to familiar experiences.',
      preferredContentTypes: ['textbooks', 'reading assignments', 'written examples', 'analogy cards'],
      engagementStrategies: ['Assign reading before class', 'Provide written summaries', 'Allow independent reading time'],
      pacingRecommendations: 'Standard pacing with reading breaks. Pre-assign readings as preparation.',
      effectiveInterventions: ['Provide detailed reading material on electron configuration', 'Use relatable analogies for atomic structure', 'Offer written practice problems with step-by-step solutions'],
    },
    nextLesson: {
      lessonId: 'lesson-002',
      lessonName: 'Chemical Bonding Fundamentals',
      topic: 'Chemistry - Chemical Bonding',
      estimatedTime: '45 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-004',
        title: 'Electron Configuration Practice Sheet',
        dueDate: '2026-05-03',
        estimatedTime: '40 minutes',
        status: 'pending',
      },
    ],
  },
  'student-004': {
    student: {
      ...students[3],
      learningStyle: {
        learningStyle: 'kinesthetic',
        personalityTraits: ['curious', 'hands-on', 'explorative'],
        preferredExplanationStyle: 'analogical',
        attentionSpan: 'short',
        motivationStyle: 'social',
        teachingGuidance: {
          recommendedApproach: 'Use hands-on activities, physical models, and tactile learning experiences. Connect concepts to real-world physical experiences.',
          preferredContentTypes: ['physical models', 'interactive simulations', 'lab activities', 'manipulatives'],
          engagementStrategies: ['Incorporate movement breaks', 'Use 3D models', 'Conduct simple experiments'],
          pacingRecommendations: 'Break into short 10-15 minute chunks with movement activities between',
          effectiveInterventions: ['Provide physical atom models', 'Use interactive simulation software', 'Assign hands-on lab activities for cell membrane transport'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-003',
      lessonName: 'Cell Division: Mitosis and Meiosis',
      topic: 'Biology - Cell Biology',
      completedPercentage: 65,
      timeSpent: '28 minutes',
      lastAccessed: '4 hours ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-001',
        quizName: 'Cell Structure Fundamentals',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        feedback: 'Good understanding, minor gaps in cell membrane function',
        date: '2026-04-27',
      },
      {
        quizId: 'quiz-002',
        quizName: 'Cell Division Basics',
        score: 7,
        totalQuestions: 10,
        percentage: 70,
        feedback: 'Understanding the basic concept, needs more practice',
        date: '2026-04-24',
      },
    ],
    misconceptions: [
      {
        id: 'misc-003',
        topic: 'Cell Membrane Function',
        description: 'Unclear about selective permeability and transport mechanisms',
        questionsWrong: 2,
        firstNoticed: '2026-04-27',
      },
    ],
    engagement: {
      questionsAsked: 9,
      questionsAnswered: 22,
      averageResponseTime: '55 seconds',
      participationRate: 78,
      streakDays: 5,
      lastActive: '4 hours ago',
    },
    masteryLevels: [
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 78, trend: 'up', estimatedMasteryDate: '2026-05-10' },
      { topicId: 'topic-002', topicName: 'Cell Division', masteryPercentage: 69, trend: 'stable', estimatedMasteryDate: '2026-05-14' },
    ],
    overallMastery: 74,
    streakDays: 5,
    teachingGuidance: {
      recommendedApproach: 'Use hands-on activities, physical models, and tactile learning experiences. Connect concepts to real-world physical experiences.',
      preferredContentTypes: ['physical models', 'interactive simulations', 'lab activities', 'manipulatives'],
      engagementStrategies: ['Incorporate movement breaks', 'Use 3D models', 'Conduct simple experiments'],
      pacingRecommendations: 'Break into short 10-15 minute chunks with movement activities between',
      effectiveInterventions: ['Provide physical atom models', 'Use interactive simulation software', 'Assign hands-on lab activities for cell membrane transport'],
    },
    nextLesson: {
      lessonId: 'lesson-004',
      lessonName: 'Atomic Structure and Electron Configuration',
      topic: 'Chemistry - Atomic Structure',
      estimatedTime: '45 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-005',
        title: 'Cell Membrane Transport Diagram',
        dueDate: '2026-05-04',
        estimatedTime: '20 minutes',
        status: 'pending',
      },
    ],
  },
  'student-005': {
    student: {
      ...students[4],
      learningStyle: {
        learningStyle: 'visual',
        personalityTraits: ['driven', 'competitive', 'goal-focused'],
        preferredExplanationStyle: 'simple',
        attentionSpan: 'long',
        motivationStyle: 'extrinsic',
        teachingGuidance: {
          recommendedApproach: 'Present clear goals with measurable milestones. Use charts and progress indicators to track achievement.',
          preferredContentTypes: ['progress charts', 'achievement badges', 'goal trackers', 'visual roadmaps'],
          engagementStrategies: ['Set clear targets for each session', 'Use achievement-based rewards', 'Show clear connections between effort and results'],
          pacingRecommendations: 'Fast-paced with clear milestones and reward checkpoints',
          effectiveInterventions: ['Set specific mastery targets', 'Use gamified progress tracking', 'Provide clear achievement criteria for each topic'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-005',
      lessonName: 'Force and Newton\'s Laws of Motion',
      topic: 'Physics - Motion and Forces',
      completedPercentage: 88,
      timeSpent: '38 minutes',
      lastAccessed: '1 hour ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-005',
        quizName: 'Newton\'s First Law',
        score: 9,
        totalQuestions: 10,
        percentage: 90,
        feedback: 'Excellent application of inertia concepts',
        date: '2026-04-28',
      },
      {
        quizId: 'quiz-006',
        quizName: 'Newton\'s Second Law',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        feedback: 'Good problem-solving, should practice more word problems',
        date: '2026-04-26',
      },
    ],
    misconceptions: [],
    engagement: {
      questionsAsked: 15,
      questionsAnswered: 30,
      averageResponseTime: '42 seconds',
      participationRate: 88,
      streakDays: 9,
      lastActive: '1 hour ago',
    },
    masteryLevels: [
      { topicId: 'topic-005', topicName: 'Newton\'s Laws', masteryPercentage: 87, trend: 'up', estimatedMasteryDate: '2026-05-04' },
      { topicId: 'topic-006', topicName: 'Motion and Velocity', masteryPercentage: 85, trend: 'stable', estimatedMasteryDate: '2026-05-06' },
    ],
    overallMastery: 86,
    streakDays: 9,
    teachingGuidance: {
      recommendedApproach: 'Present clear goals with measurable milestones. Use charts and progress indicators to track achievement.',
      preferredContentTypes: ['progress charts', 'achievement badges', 'goal trackers', 'visual roadmaps'],
      engagementStrategies: ['Set clear targets for each session', 'Use achievement-based rewards', 'Show clear connections between effort and results'],
      pacingRecommendations: 'Fast-paced with clear milestones and reward checkpoints',
      effectiveInterventions: ['Set specific mastery targets', 'Use gamified progress tracking', 'Provide clear achievement criteria for each topic'],
    },
    nextLesson: {
      lessonId: 'lesson-006',
      lessonName: 'Gravitation and Orbital Motion',
      topic: 'Physics - Gravitation',
      estimatedTime: '55 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-006',
        title: 'Newton\'s Laws Problem Set',
        dueDate: '2026-05-03',
        estimatedTime: '45 minutes',
        status: 'in-progress',
      },
    ],
  },
  'student-006': {
    student: {
      ...students[5],
      learningStyle: {
        learningStyle: 'auditory',
        personalityTraits: ['creative', 'intuitive', 'imaginative'],
        preferredExplanationStyle: 'analogical',
        attentionSpan: 'short',
        motivationStyle: 'intrinsic',
        teachingGuidance: {
          recommendedApproach: 'Use storytelling and creative analogies to explain processes. Incorporate songs or rhymes for memorization.',
          preferredContentTypes: ['stories', 'analogies', 'songs', 'verbal explanations', 'discussions'],
          engagementStrategies: ['Connect concepts to real-life scenarios', 'Use creative mnemonics', 'Encourage creative explanations'],
          pacingRecommendations: 'Short segments of 10-12 minutes with creative breaks',
          effectiveInterventions: ['Use analogy-based explanations for photosynthesis', 'Create mnemonic songs for stages', 'Connect light/dark reactions to familiar processes'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-001',
      lessonName: 'Introduction to Photosynthesis',
      topic: 'Biology - Photosynthesis',
      completedPercentage: 55,
      timeSpent: '22 minutes',
      lastAccessed: '6 hours ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-003',
        quizName: 'Photosynthesis Equation',
        score: 7,
        totalQuestions: 10,
        percentage: 70,
        feedback: 'Understands the basics, confused about light vs dark reactions',
        date: '2026-04-27',
      },
    ],
    misconceptions: [
      {
        id: 'misc-004',
        topic: 'Light vs Dark Reactions',
        description: 'Confuses which reactions require light and the products of each',
        questionsWrong: 3,
        firstNoticed: '2026-04-27',
      },
    ],
    engagement: {
      questionsAsked: 7,
      questionsAnswered: 18,
      averageResponseTime: '58 seconds',
      participationRate: 72,
      streakDays: 4,
      lastActive: '6 hours ago',
    },
    masteryLevels: [
      { topicId: 'topic-003', topicName: 'Photosynthesis', masteryPercentage: 68, trend: 'stable', estimatedMasteryDate: '2026-05-12' },
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 75, trend: 'up', estimatedMasteryDate: '2026-05-08' },
    ],
    overallMastery: 71,
    streakDays: 4,
    teachingGuidance: {
      recommendedApproach: 'Use storytelling and creative analogies to explain processes. Incorporate songs or rhymes for memorization.',
      preferredContentTypes: ['stories', 'analogies', 'songs', 'verbal explanations', 'discussions'],
      engagementStrategies: ['Connect concepts to real-life scenarios', 'Use creative mnemonics', 'Encourage creative explanations'],
      pacingRecommendations: 'Short segments of 10-12 minutes with creative breaks',
      effectiveInterventions: ['Use analogy-based explanations for photosynthesis', 'Create mnemonic songs for stages', 'Connect light/dark reactions to familiar processes'],
    },
    nextLesson: {
      lessonId: 'lesson-001',
      lessonName: 'Introduction to Photosynthesis',
      topic: 'Biology - Photosynthesis',
      estimatedTime: '40 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-007',
        title: 'Photosynthesis Flowchart',
        dueDate: '2026-05-04',
        estimatedTime: '25 minutes',
        status: 'pending',
      },
    ],
  },
  'student-007': {
    student: {
      ...students[6],
      learningStyle: {
        learningStyle: 'visual',
        personalityTraits: ['observant', 'patient', 'thorough'],
        preferredExplanationStyle: 'simple',
        attentionSpan: 'short',
        motivationStyle: 'extrinsic',
        teachingGuidance: {
          recommendedApproach: 'Use animated simulations and diagrams to explain concepts. Break complex topics into small visual chunks.',
          preferredContentTypes: ['animated videos', 'diagrams', 'infographics', 'visual simulations', 'step-by-step visual guides'],
          engagementStrategies: ['Provide frequent visual breaks', 'Use lots of diagrams and charts', 'Offer animated examples of atomic structure'],
          pacingRecommendations: 'Break into 10-minute visual segments with animated content and diagrams',
          effectiveInterventions: ['Use animated simulations for electron configuration', 'Provide color-coded diagrams', 'Assign visual note-taking strategies', 'Offer practice with electron shell diagram coloring'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-004',
      lessonName: 'Atomic Structure and Electron Configuration',
      topic: 'Chemistry - Atomic Structure',
      completedPercentage: 72,
      timeSpent: '31 minutes',
      lastAccessed: '3 hours ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-004',
        quizName: 'Atomic Structure Quiz',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        feedback: 'Good understanding of atomic models',
        date: '2026-04-28',
      },
    ],
    misconceptions: [
      {
        id: 'misc-005',
        topic: 'Valence Electrons',
        description: 'Difficulty determining valence electrons for transition metals',
        questionsWrong: 2,
        firstNoticed: '2026-04-28',
      },
    ],
    engagement: {
      questionsAsked: 11,
      questionsAnswered: 25,
      averageResponseTime: '48 seconds',
      participationRate: 82,
      streakDays: 6,
      lastActive: '3 hours ago',
    },
    masteryLevels: [
      { topicId: 'topic-004', topicName: 'Atomic Structure', masteryPercentage: 79, trend: 'up', estimatedMasteryDate: '2026-05-09' },
      { topicId: 'topic-007', topicName: 'Periodic Table', masteryPercentage: 74, trend: 'stable', estimatedMasteryDate: '2026-05-11' },
    ],
    overallMastery: 76,
    streakDays: 6,
    teachingGuidance: {
      recommendedApproach: 'Use animated simulations and diagrams to explain concepts. Break complex topics into small visual chunks.',
      preferredContentTypes: ['animated videos', 'diagrams', 'infographics', 'visual simulations', 'step-by-step visual guides'],
      engagementStrategies: ['Provide frequent visual breaks', 'Use lots of diagrams and charts', 'Offer animated examples of atomic structure'],
      pacingRecommendations: 'Break into 10-minute visual segments with animated content and diagrams',
      effectiveInterventions: ['Use animated simulations for electron configuration', 'Provide color-coded diagrams', 'Assign visual note-taking strategies', 'Offer practice with electron shell diagram coloring'],
    },
    nextLesson: {
      lessonId: 'lesson-005',
      lessonName: 'Chemical Bonding and Ionic Compounds',
      topic: 'Chemistry - Chemical Bonding',
      estimatedTime: '50 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-008',
        title: 'Electron Shell Diagrams',
        dueDate: '2026-05-05',
        estimatedTime: '30 minutes',
        status: 'pending',
      },
    ],
  },
  'student-008': {
    student: {
      ...students[7],
      learningStyle: {
        learningStyle: 'reading',
        personalityTraits: ['perfectionist', 'self-motivated', 'conscientious'],
        preferredExplanationStyle: 'technical',
        attentionSpan: 'long',
        motivationStyle: 'intrinsic',
        teachingGuidance: {
          recommendedApproach: 'Provide comprehensive written materials and technical documentation. Allow self-paced learning with detailed references.',
          preferredContentTypes: ['technical papers', 'comprehensive study guides', 'reference materials', 'detailed textbooks'],
          engagementStrategies: ['Encourage independent research', 'Provide advanced reading materials', 'Allow self-paced progression'],
          pacingRecommendations: 'Self-paced learning with access to advanced technical materials',
          effectiveInterventions: ['Provide supplementary technical reading', 'Offer extension activities for advanced learners', 'Encourage peer teaching'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-003',
      lessonName: 'Cell Division: Mitosis and Meiosis',
      topic: 'Biology - Cell Biology',
      completedPercentage: 100,
      timeSpent: '52 minutes',
      lastAccessed: '1 day ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-001',
        quizName: 'Cell Structure Fundamentals',
        score: 10,
        totalQuestions: 10,
        percentage: 100,
        feedback: 'Perfect understanding of all cell organelles',
        date: '2026-04-26',
      },
      {
        quizId: 'quiz-002',
        quizName: 'Cell Division Basics',
        score: 10,
        totalQuestions: 10,
        percentage: 100,
        feedback: 'Excellent work! Ready for advanced topics',
        date: '2026-04-23',
      },
    ],
    misconceptions: [],
    engagement: {
      questionsAsked: 20,
      questionsAnswered: 38,
      averageResponseTime: '35 seconds',
      participationRate: 96,
      streakDays: 21,
      lastActive: '1 day ago',
    },
    masteryLevels: [
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 100, trend: 'stable', estimatedMasteryDate: 'Mastered' },
      { topicId: 'topic-002', topicName: 'Cell Division', masteryPercentage: 95, trend: 'stable', estimatedMasteryDate: '2026-05-02' },
      { topicId: 'topic-003', topicName: 'Photosynthesis', masteryPercentage: 89, trend: 'up', estimatedMasteryDate: '2026-05-08' },
    ],
    overallMastery: 94,
    streakDays: 21,
    teachingGuidance: {
      recommendedApproach: 'Provide comprehensive written materials and technical documentation. Allow self-paced learning with detailed references.',
      preferredContentTypes: ['technical papers', 'comprehensive study guides', 'reference materials', 'detailed textbooks'],
      engagementStrategies: ['Encourage independent research', 'Provide advanced reading materials', 'Allow self-paced progression'],
      pacingRecommendations: 'Self-paced learning with access to advanced technical materials',
      effectiveInterventions: ['Provide supplementary technical reading', 'Offer extension activities for advanced learners', 'Encourage peer teaching'],
    },
    nextLesson: {
      lessonId: 'lesson-007',
      lessonName: 'Human Body Systems: Circulatory System',
      topic: 'Biology - Human Physiology',
      estimatedTime: '60 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-009',
        title: 'Mitosis Stages Drawing',
        dueDate: '2026-05-02',
        estimatedTime: '35 minutes',
        status: 'completed',
      },
    ],
  },
  'student-009': {
    student: {
      ...students[8],
      learningStyle: {
        learningStyle: 'kinesthetic',
        personalityTraits: ['impulsive', 'active', 'low patience'],
        preferredExplanationStyle: 'socratic',
        attentionSpan: 'short',
        motivationStyle: 'extrinsic',
        teachingGuidance: {
          recommendedApproach: 'Use hands-on activities, physical demonstrations, and practical experiments. Build in frequent check-ins and reward small achievements.',
          preferredContentTypes: ['hands-on experiments', 'physical demonstrations', 'interactive tools', 'real-world applications', 'gamified tasks'],
          engagementStrategies: ['Incorporate immediate rewards', 'Use physical activities frequently', 'Build in frequent check-ins', 'Make content action-oriented'],
          pacingRecommendations: 'Very short segments of 8-10 minutes with hands-on activities and rewards',
          effectiveInterventions: ['Schedule frequent 5-minute check-ins', 'Use reward-based motivation system', 'Provide hands-on gravitational experiments', 'Break tasks into immediately achievable chunks', 'Consider positive reinforcement system'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-006',
      lessonName: 'Gravitation and Orbital Motion',
      topic: 'Physics - Gravitation',
      completedPercentage: 38,
      timeSpent: '15 minutes',
      lastAccessed: '2 days ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-007',
        quizName: 'Universal Gravitation',
        score: 5,
        totalQuestions: 10,
        percentage: 50,
        feedback: 'Struggling with gravitational force calculations',
        date: '2026-04-25',
      },
    ],
    misconceptions: [
      {
        id: 'misc-006',
        topic: 'Gravitational Force',
        description: 'Confuses mass and weight, struggles with inverse square law',
        questionsWrong: 5,
        firstNoticed: '2026-04-25',
      },
    ],
    engagement: {
      questionsAsked: 3,
      questionsAnswered: 10,
      averageResponseTime: '85 seconds',
      participationRate: 38,
      streakDays: 1,
      lastActive: '2 days ago',
    },
    masteryLevels: [
      { topicId: 'topic-006', topicName: 'Motion and Velocity', masteryPercentage: 62, trend: 'down', estimatedMasteryDate: '2026-05-22' },
      { topicId: 'topic-008', topicName: 'Gravitation', masteryPercentage: 48, trend: 'down', estimatedMasteryDate: '2026-05-25' },
    ],
    overallMastery: 55,
    streakDays: 1,
    teachingGuidance: {
      recommendedApproach: 'Use hands-on activities, physical demonstrations, and practical experiments. Build in frequent check-ins and reward small achievements.',
      preferredContentTypes: ['hands-on experiments', 'physical demonstrations', 'interactive tools', 'real-world applications', 'gamified tasks'],
      engagementStrategies: ['Incorporate immediate rewards', 'Use physical activities frequently', 'Build in frequent check-ins', 'Make content action-oriented'],
      pacingRecommendations: 'Very short segments of 8-10 minutes with hands-on activities and rewards',
      effectiveInterventions: ['Schedule frequent 5-minute check-ins', 'Use reward-based motivation system', 'Provide hands-on gravitational experiments', 'Break tasks into immediately achievable chunks', 'Consider positive reinforcement system'],
    },
    nextLesson: {
      lessonId: 'lesson-006',
      lessonName: 'Gravitation and Orbital Motion',
      topic: 'Physics - Gravitation',
      estimatedTime: '55 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-010',
        title: 'Gravitational Force Calculations',
        dueDate: '2026-05-03',
        estimatedTime: '50 minutes',
        status: 'pending',
      },
    ],
  },
  'student-010': {
    student: {
      ...students[9],
      learningStyle: {
        learningStyle: 'auditory',
        personalityTraits: ['organized', 'systematic', 'methodical'],
        preferredExplanationStyle: 'simple',
        attentionSpan: 'medium',
        motivationStyle: 'social',
        teachingGuidance: {
          recommendedApproach: 'Balance visual aids with verbal explanations. Provide organized structures and clear frameworks for learning.',
          preferredContentTypes: ['presentations', 'verbal instructions', 'organized charts', 'group discussions'],
          engagementStrategies: ['Use structured study groups', 'Provide clear learning frameworks', 'Combine visual and verbal content'],
          pacingRecommendations: 'Standard pacing with structured review sessions',
          effectiveInterventions: ['Provide organized study guides', 'Assign group study sessions', 'Use step-by-step explanations with verbal support'],
        },
      },
    },
    currentLesson: {
      lessonId: 'lesson-003',
      lessonName: 'Cell Division: Mitosis and Meiosis',
      topic: 'Biology - Cell Biology',
      completedPercentage: 84,
      timeSpent: '35 minutes',
      lastAccessed: '2 hours ago',
    },
    recentQuizzes: [
      {
        quizId: 'quiz-001',
        quizName: 'Cell Structure Fundamentals',
        score: 9,
        totalQuestions: 10,
        percentage: 90,
        feedback: 'Very good understanding, minor confusion in chloroplast function',
        date: '2026-04-28',
      },
      {
        quizId: 'quiz-002',
        quizName: 'Cell Division Basics',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        feedback: 'Good grasp of the processes',
        date: '2026-04-24',
      },
    ],
    misconceptions: [
      {
        id: 'misc-007',
        topic: 'Chloroplast Function',
        description: 'Unclear about the role of chloroplasts in photosynthesis vs general cell function',
        questionsWrong: 2,
        firstNoticed: '2026-04-28',
      },
    ],
    engagement: {
      questionsAsked: 14,
      questionsAnswered: 29,
      averageResponseTime: '44 seconds',
      participationRate: 86,
      streakDays: 8,
      lastActive: '2 hours ago',
    },
    masteryLevels: [
      { topicId: 'topic-001', topicName: 'Cell Structure', masteryPercentage: 88, trend: 'up', estimatedMasteryDate: '2026-05-06' },
      { topicId: 'topic-002', topicName: 'Cell Division', masteryPercentage: 82, trend: 'up', estimatedMasteryDate: '2026-05-09' },
      { topicId: 'topic-003', topicName: 'Photosynthesis', masteryPercentage: 76, trend: 'stable', estimatedMasteryDate: '2026-05-11' },
    ],
    overallMastery: 82,
    streakDays: 8,
    teachingGuidance: {
      recommendedApproach: 'Balance visual aids with verbal explanations. Provide organized structures and clear frameworks for learning.',
      preferredContentTypes: ['presentations', 'verbal instructions', 'organized charts', 'group discussions'],
      engagementStrategies: ['Use structured study groups', 'Provide clear learning frameworks', 'Combine visual and verbal content'],
      pacingRecommendations: 'Standard pacing with structured review sessions',
      effectiveInterventions: ['Provide organized study guides', 'Assign group study sessions', 'Use step-by-step explanations with verbal support'],
    },
    nextLesson: {
      lessonId: 'lesson-008',
      lessonName: 'Acids, Bases and Salts',
      topic: 'Chemistry - Everyday Chemistry',
      estimatedTime: '45 minutes',
    },
    assignedHomework: [
      {
        homeworkId: 'hw-011',
        title: 'Cell Organelle Comparison Chart',
        dueDate: '2026-05-04',
        estimatedTime: '30 minutes',
        status: 'completed',
      },
    ],
  },
};

// Teacher dashboard data
export const teacherDashboard: TeacherDashboard = {
  teacher,
  classOverview: {
    totalStudents: 10,
    activeToday: 7,
    averageMastery: 76,
    masteryChange: 8,
  },
  atRiskStudents: [
    {
      student: students[8], // Rohit Shah
      riskLevel: 'high',
      reasons: ['Gravitational force misconceptions', 'Low engagement', '2-day inactivity'],
      suggestedIntervention: 'Schedule 1-on-1 session on Newton\'s Law basics before introducing new topics. Send reminder notification.',
    },
    {
      student: students[2], // Rahul Verma
      riskLevel: 'medium',
      reasons: ['Electron configuration difficulties', 'Below-average quiz scores'],
      suggestedIntervention: 'Assign prerequisite review module on atomic structure. Pair with Sneha Gupta for peer tutoring.',
    },
    {
      student: students[5], // Kavya Nair
      riskLevel: 'medium',
      reasons: ['Light/dark reactions confusion', 'Moderate engagement'],
      suggestedIntervention: 'Provide visual diagram of photosynthesis stages. Recommend interactive simulation.',
    },
    {
      student: students[6], // Aditya Kumar
      riskLevel: 'low',
      reasons: ['Minor valence electron confusion'],
      suggestedIntervention: 'Offer extra practice sheet on electron configurations for transition metals.',
    },
    {
      student: students[3], // Ananya Singh
      riskLevel: 'low',
      reasons: ['Cell membrane transport gaps'],
      suggestedIntervention: 'Share animated video on selective permeability.',
    },
  ],
  misconceptionClusters: [
    {
      topic: 'Mitosis vs Meiosis',
      affectedStudents: 8,
      description: 'Students frequently confuse the purpose, outcomes, and phases of mitosis and meiosis. Common error: thinking both processes result in identical daughter cells.',
      severity: 'high',
    },
    {
      topic: 'Photosynthesis Equation Balance',
      affectedStudents: 5,
      description: 'Students struggle to balance the photosynthesis equation and understand why oxygen is a product, not a reactant.',
      severity: 'medium',
    },
    {
      topic: 'Light vs Dark Reactions',
      affectedStudents: 4,
      description: 'Confusion about which reactions require light directly and where each occurs in the chloroplast.',
      severity: 'medium',
    },
    {
      topic: 'Gravitational Force Calculations',
      affectedStudents: 3,
      description: 'Students confuse mass and weight, and struggle with applying the inverse square law in gravitational calculations.',
      severity: 'low',
    },
    {
      topic: 'Valence Electrons in Transition Metals',
      affectedStudents: 2,
      description: 'Difficulty determining the correct valence electrons for elements in the transition metal series.',
      severity: 'low',
    },
  ],
  suggestedInterventions: [
    {
      id: 'int-001',
      title: 'Mitosis vs Meiosis Review Session',
      description: 'Interactive comparison activity where students sort statements into correct categories. Includes mnemonic aids for remembering differences.',
      targetStudents: 8,
      priority: 'high',
    },
    {
      id: 'int-002',
      title: 'Photosynthesis Equation Practice',
      description: 'Step-by-step guided practice balancing the equation with visual manipulatives. Includes real-world examples of the equation components.',
      targetStudents: 5,
      priority: 'medium',
    },
    {
      id: 'int-003',
      title: 'Gravitation Remedial Module',
      description: 'Simplified review of mass vs weight with hands-on activities using weighing scales and calculations. Prerequisite review before orbital motion.',
      targetStudents: 3,
      priority: 'high',
    },
    {
      id: 'int-004',
      title: 'Electron Configuration Games',
      description: 'Gamified practice for electron configuration with instant feedback and progressive difficulty levels.',
      targetStudents: 2,
      priority: 'low',
    },
  ],
  lessonEngagement: [
    {
      lessonName: 'Cell Division: Mitosis and Meiosis',
      averageCompletion: 76,
      peakEngagement: 'During chromosome diagram labeling',
      strugglingCount: 4,
    },
    {
      lessonName: 'Introduction to Photosynthesis',
      averageCompletion: 68,
      peakEngagement: 'When explaining the light reactions',
      strugglingCount: 3,
    },
    {
      lessonName: 'Force and Newton\'s Laws',
      averageCompletion: 84,
      peakEngagement: 'During inertia demonstration',
      strugglingCount: 2,
    },
  ],
  recentActivity: [
    {
      student: students[0], // Arjun
      action: 'Completed Cell Division quiz with 70%',
      timestamp: '2 hours ago',
      type: 'quiz',
    },
    {
      student: students[7], // Sneha
      action: 'Asked 3 questions during photosynthesis lesson',
      timestamp: '3 hours ago',
      type: 'question',
    },
    {
      student: students[8], // Rohit
      action: 'Missed last 2 lesson sessions',
      timestamp: '2 days ago',
      type: 'lesson',
    },
    {
      student: students[1], // Priya
      action: 'Achieved 100% mastery in Cell Structure',
      timestamp: '1 day ago',
      type: 'intervention',
    },
    {
      student: students[4], // Vikram
      action: 'Completed Newton\'s Laws homework',
      timestamp: '5 hours ago',
      type: 'intervention',
    },
  ],
};

// Classroom data
export const classroomData: ClassroomData = {
  sessionId: 'classroom-001',
  topic: 'Photosynthesis',
  subject: 'Biology',
  grade: 'Class 10',
  duration: '45 minutes',
  whiteboardContent: {
    equation: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
    title: 'Photosynthesis Equation',
  },
  participants: [
    {
      id: 'professor',
      name: 'Dr. Amit Singh',
      role: 'professor',
      avatar: 'AS',
      color: 'teal',
      isAI: true,
    },
    {
      id: 'skeptic',
      name: 'Priya',
      role: 'skeptic',
      avatar: 'PR',
      color: 'violet',
      isAI: true,
    },
    {
      id: 'builder',
      name: 'Rahul',
      role: 'builder',
      avatar: 'RH',
      color: 'coral',
      isAI: true,
    },
    {
      id: 'examiner',
      name: 'Meera',
      role: 'examiner',
      avatar: 'MR',
      color: 'info',
      isAI: true,
    },
  ],
  chat: [
    {
      id: 'msg-001',
      speaker: 'Professor',
      speakerRole: 'professor',
      message: 'Good morning, class! Today we explore how plants turn sunlight into food. Before I explain, what do you think the plant is storing?',
      timestamp: '09:00 AM',
      isAI: true,
    },
    {
      id: 'msg-002',
      speaker: 'Priya',
      speakerRole: 'skeptic',
      message: 'If oxygen is a waste product for plants, why is it so important to us? This seems counterintuitive.',
      timestamp: '09:02 AM',
      isAI: true,
    },
    {
      id: 'msg-003',
      speaker: 'Professor',
      speakerRole: 'professor',
      message: 'Excellent question, Priya! The oxygen we breathe is actually a byproduct. Plants produce it because water molecules are split during the light reactions. Without this process, Earth\'s atmosphere would lack the oxygen we need!',
      timestamp: '09:03 AM',
      isAI: true,
    },
    {
      id: 'msg-004',
      speaker: 'Rahul',
      speakerRole: 'builder',
      message: 'I like to think of it like a factory! The plant takes in CO₂ and water, uses sunlight as energy, and produces glucose (the food) and oxygen (the waste). The glucose is stored for later use, like a warehouse.',
      timestamp: '09:05 AM',
      isAI: true,
    },
    {
      id: 'msg-005',
      speaker: 'Meera',
      speakerRole: 'examiner',
      message: 'Can someone tell me which reactant provides the carbon atoms in the glucose molecule? Arjun, what do you think?',
      timestamp: '09:07 AM',
      isAI: true,
    },
    {
      id: 'msg-006',
      speaker: 'Arjun',
      speakerRole: 'student',
      message: 'Is it the water? No wait... CO₂ provides the carbon, right?',
      timestamp: '09:08 AM',
      isAI: false,
    },
    {
      id: 'msg-007',
      speaker: 'Professor',
      speakerRole: 'professor',
      message: 'Correct, Arjun! The carbon in glucose comes from carbon dioxide. The water provides the hydrogen atoms and oxygen is released. Can anyone tell me where the oxygen from CO₂ ends up?',
      timestamp: '09:09 AM',
      isAI: true,
    },
  ],
  lessonProgress: {
    currentSection: 'Light Reactions',
    completedSections: 2,
    totalSections: 4,
  },
};

// Lessons data
export const lessons = [
  {
    lessonId: 'lesson-001',
    lessonName: 'Introduction to Photosynthesis',
    topic: 'Biology - Photosynthesis',
    grade: 'Class 10',
    estimatedTime: '40 minutes',
    sections: ['What is Photosynthesis', 'Equation Overview', 'Basic Requirements'],
    difficulty: 'beginner',
  },
  {
    lessonId: 'lesson-002',
    lessonName: 'Chemical Bonding Fundamentals',
    topic: 'Chemistry - Chemical Bonding',
    grade: 'Class 10',
    estimatedTime: '45 minutes',
    sections: ['Ionic Bonds', 'Covalent Bonds', 'Metallic Bonds'],
    difficulty: 'intermediate',
  },
  {
    lessonId: 'lesson-003',
    lessonName: 'Cell Division: Mitosis and Meiosis',
    topic: 'Biology - Cell Biology',
    grade: 'Class 10',
    estimatedTime: '50 minutes',
    sections: ['Cell Cycle Overview', 'Mitosis Phases', 'Meiosis Phases', 'Comparing Mitosis and Meiosis'],
    difficulty: 'intermediate',
  },
  {
    lessonId: 'lesson-004',
    lessonName: 'Atomic Structure and Electron Configuration',
    topic: 'Chemistry - Atomic Structure',
    grade: 'Class 10',
    estimatedTime: '45 minutes',
    sections: ['Atomic Models', 'Subatomic Particles', 'Electron Configuration', 'Valence Electrons'],
    difficulty: 'intermediate',
  },
  {
    lessonId: 'lesson-005',
    lessonName: 'Force and Newton\'s Laws of Motion',
    topic: 'Physics - Motion and Forces',
    grade: 'Class 10',
    estimatedTime: '55 minutes',
    sections: ['Newton\'s First Law', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Applications'],
    difficulty: 'intermediate',
  },
  {
    lessonId: 'lesson-006',
    lessonName: 'Gravitation and Orbital Motion',
    topic: 'Physics - Gravitation',
    grade: 'Class 10',
    estimatedTime: '55 minutes',
    sections: ['Universal Gravitation', 'Inverse Square Law', 'Orbital Motion', 'Satellites'],
    difficulty: 'advanced',
  },
];

// Quiz questions
export const quizQuestions = [
  {
    quizId: 'quiz-001',
    quizName: 'Cell Structure Fundamentals',
    questions: [
      {
        questionId: 'q1',
        question: 'Which organelle is responsible for producing energy through cellular respiration?',
        options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'],
        correctAnswer: 0,
        explanation: 'Mitochondria produce ATP through cellular respiration.',
      },
      {
        questionId: 'q2',
        question: 'What is the primary function of the cell wall in plant cells?',
        options: ['Photosynthesis', 'Structural support and protection', 'Protein synthesis', 'Cell division'],
        correctAnswer: 1,
        explanation: 'The cell wall provides structural support and protects the cell.',
      },
    ],
  },
  {
    quizId: 'quiz-002',
    quizName: 'Cell Division Basics',
    questions: [
      {
        questionId: 'q1',
        question: 'In which phase of mitosis do chromosomes align at the cell equator?',
        options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
        correctAnswer: 1,
        explanation: 'During metaphase, chromosomes align at the metaphase plate.',
      },
      {
        questionId: 'q2',
        question: 'What is the main difference between mitosis and meiosis?',
        options: [
          'Mitosis produces gametes, meiosis produces somatic cells',
          'Mitosis results in identical daughter cells, meiosis results in genetically different cells',
          'Mitosis has one division, meiosis has two',
          'Both B and C are correct',
        ],
        correctAnswer: 3,
        explanation: 'Both the number of divisions and the genetic uniqueness of daughter cells differ.',
      },
    ],
  },
  {
    quizId: 'quiz-003',
    quizName: 'Photosynthesis Equation',
    questions: [
      {
        questionId: 'q1',
        question: 'Which reactant provides the carbon atoms in glucose during photosynthesis?',
        options: ['Water', 'Carbon dioxide', 'Light energy', 'Oxygen'],
        correctAnswer: 1,
        explanation: 'CO₂ provides the carbon atoms that become part of glucose.',
      },
      {
        questionId: 'q2',
        question: 'What happens to the oxygen produced during photosynthesis?',
        options: [
          'It is used in cellular respiration',
          'It is released into the atmosphere',
          'It is stored in the plant',
          'It is converted to water',
        ],
        correctAnswer: 1,
        explanation: 'Oxygen is released as a byproduct through stomata.',
      },
    ],
  },
];

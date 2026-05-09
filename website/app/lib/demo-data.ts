export const mockMetrics = {
  lessonCompletion: '94%',
  engagementIncrease: '3.2x',
  languagesSupported: '28',
  responseTime: '<1s',
} as const;

export const mockTeachers = [
  { name: 'Priya Sharma', school: 'Delhi Public School', subjects: ['Mathematics', 'Physics'] },
  { name: 'Rajesh Kumar', school: 'Kendriya Vidyalaya', subjects: ['Chemistry', 'Biology'] },
  { name: 'Anita Desai', school: 'St. Xavier\'s High School', subjects: ['History', 'Geography'] },
] as const;

export const classroomDemoData = {
  topic: 'Photosynthesis',
  grade: 'Grade 10 Biology',
  duration: '45 minutes',
  participants: [
    { id: 'professor', name: 'Dr. Amit Singh', role: 'Professor', avatar: 'AS', color: 'teal' },
    { id: 'skeptic', name: 'Priya', role: 'Skeptic', avatar: 'PR', color: 'violet' },
    { id: 'creative', name: 'Rahul', role: 'Creative', avatar: 'RH', color: 'coral' },
    { id: 'examiner', name: 'Meera', role: 'Examiner', avatar: 'MR', color: 'info' },
  ],
  whiteboardContent: {
    equation: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
    title: 'Photosynthesis Equation',
  },
  discussion: [
    { speaker: 'Professor', text: 'Before I explain, what do you think the plant is storing?' },
    { speaker: 'Priya', text: 'If oxygen is a waste product, why is it so important to us?' },
  ],
  quiz: {
    question: 'Which reactant provides the carbon in glucose?',
    options: ['Water', 'Carbon dioxide', 'Light energy', 'Oxygen'],
    correct: 1,
  },
} as const;

export const teacherDashboardData = {
  className: 'Grade 10 - Section A',
  totalStudents: 32,
  averageMastery: 78,
  masteryChange: 12,
  studentsNeedingReview: 12,
  misconceptions: [
    { topic: 'Mitosis vs Meiosis', affected: 8 },
    { topic: 'Photosynthesis equation', affected: 5 },
    { topic: 'Atomic structure', affected: 3 },
  ],
  engagementMetrics: {
    questionsAsked: 247,
    speakingTime: '18 min avg',
    quizConfidence: 82,
  },
  suggestedNextLesson: 'Cell Division Visual Lab',
  recentActivity: [
    { student: 'Arjun Mehta', action: 'Completed quiz on photosynthesis', score: 85 },
    { student: 'Sneha Patel', action: 'Asked question about light reactions', timestamp: '2 min ago' },
    { student: 'Vikram Singh', action: 'Struggled with Calvin cycle concept', timestamp: '5 min ago' },
  ],
} as const;

export const featureCards = [
  {
    id: 'socratic',
    title: 'Socratic Engine',
    tagline: 'Probes assumptions, challenges weak reasoning',
    description: 'The AI professor asks follow-up questions that expose gaps in understanding. It adapts difficulty in real-time, ensuring every learner is challenged at their edge.',
    color: 'teal',
    icon: 'Brain',
  },
  {
    id: 'classmates',
    title: 'Agentic Classmates',
    tagline: 'Four persona agents debate around any concept',
    description: 'Skeptic questions claims. Builder constructs understanding. Creative offers analogies. Examiner tests readiness. Together they create authentic classroom dynamics.',
    color: 'violet',
    icon: 'Users',
  },
  {
    id: 'whiteboard',
    title: 'Generative Whiteboard',
    tagline: 'Ink blooms into diagrams and equations',
    description: 'WebGL-powered drawing that transforms rough sketches into polished diagrams. Equations render beautifully. Every stroke is replayable and exportable.',
    color: 'coral',
    icon: 'PenTool',
  },
  {
    id: 'voice',
    title: 'Spatial Voice Q&A',
    tagline: 'Audio rings pan between avatars naturally',
    description: 'Web Audio positioning creates spatial presence. Ask questions aloud and hear responses from the appropriate voice in the classroom.',
    color: 'teal',
    icon: 'Mic',
  },
  {
    id: 'simulations',
    title: '3D Simulations',
    tagline: 'Isometric scenes generated per topic',
    description: 'Biology cells, math graphs, physics fields, chemistry molecules — all interactive and generated contextual to your lesson.',
    color: 'violet',
    icon: 'Box',
  },
  {
    id: 'progression',
    title: 'Shine Progression',
    tagline: 'Mastery grows, streaks build, knowledge compounds',
    description: 'A skill graph that tracks understanding over time. Spaced repetition schedules review. Targeted practice closes gaps before exams.',
    color: 'coral',
    icon: 'TrendingUp',
  },
] as const;

export const faqData = [
  {
    question: 'How does AIDU adapt to my learning level?',
    answer: 'AIDU\'s AI professor continuously assesses your responses through Socratic questioning and quiz performance. It adjusts explanation depth and pace dynamically, ensuring you\'re always learning at your edge of capability.',
  },
  {
    question: 'What devices support AIDU?',
    answer: 'AIDU works on any modern browser — desktop, tablet, and mobile. For voice features, we recommend a microphone. 3D simulations require WebGL support, which is available on 99% of modern devices.',
  },
  {
    question: 'How is my data protected?',
    answer: 'Your learning data is encrypted at rest and in transit. We never sell personal data. Teachers have full control over student data and can export or delete it anytime. Our infrastructure is hosted on ISO 27001 certified data centers.',
  },
  {
    question: 'Can AIDU be used for exam preparation?',
    answer: 'Absolutely. Exam Prep mode focuses on past papers, time-bounded practice, and confidence scoring. The Examiner agent identifies weak areas and generates targeted practice to strengthen them.',
  },
  {
    question: 'Do you offer school or institutional pricing?',
    answer: 'Yes. Schools and coaching centers can request a pilot program with dedicated onboarding, teacher training, and custom pricing based on student count. Contact our education team for details.',
  },
  {
    question: 'What languages does AIDU support?',
    answer: 'AIDU currently supports 28 languages including English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and more. The AI professor can explain concepts in your preferred language and switch seamlessly.',
  },
] as const;

export const howItWorksSteps = [
  {
    number: 1,
    title: 'Enter a topic',
    description: 'Type anything: "photosynthesis", "definite integrals", "Mughal history" — AIDU understands context.',
  },
  {
    number: 2,
    title: 'AIDU builds the classroom',
    description: 'Professor, classmates, lesson plan, whiteboard, quiz, and simulation are created in seconds.',
  },
  {
    number: 3,
    title: 'Learn interactively',
    description: 'Ask questions, speak aloud, debate with classmates, solve problems, and track your mastery.',
  },
] as const;

export const outcomesData = [
  {
    title: 'Understand faster',
    description: 'Adaptive explanations, Socratic checks, and diagrams reduce passive reading and build real comprehension.',
    icon: 'Zap',
  },
  {
    title: 'Ask more',
    description: 'Agentic classmates make questions feel natural, not embarrassing. No question is too simple.',
    icon: 'MessageCircle',
  },
  {
    title: 'Remember longer',
    description: 'Mastery graph schedules spaced review and targeted practice so knowledge compounds over time.',
    icon: 'Brain',
  },
  {
    title: 'Teach smarter',
    description: 'Teachers see misconceptions before exam week. Interventions are generated, not guessed.',
    icon: 'GraduationCap',
  },
] as const;

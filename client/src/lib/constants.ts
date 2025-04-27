export const EXAM_CATEGORIES = [
  "All Exams",
  "JEE Main/Advanced",
  "NEET",
  "Banking",
  "SSC",
  "GATE"
];

export const SUBJECTS = [
  "Calculus",
  "Algebra",
  "Geometry",
  "Trigonometry",
  "Statistics & Probability"
];

export const TIME_SLOTS = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM"
];

export const CONTACT_SUBJECTS = [
  "Course Inquiry",
  "Admission Process",
  "Fee Structure",
  "Technical Support",
  "Other"
];

export const STATS = [
  { value: "10k+", label: "Students Enrolled" },
  { value: "95%", label: "Success Rate" },
  { value: "200+", label: "Expert Teachers" },
  { value: "50+", label: "Exams Covered" }
];

export const WHY_CHOOSE_US = [
  {
    title: "Comprehensive Test Series",
    description: "Practice with our meticulously designed test series that mirror the actual exam pattern.",
    icon: "pen-to-square",
    color: "green"
  },
  {
    title: "Personalized Doubt Resolution",
    description: "Get your doubts cleared instantly with our dedicated doubt resolution sessions.",
    icon: "circle-question",
    color: "amber"
  },
  {
    title: "Expert Faculty",
    description: "Learn from experienced teachers who have mentored thousands of successful students.",
    icon: "chalkboard-user",
    color: "blue"
  }    
];

export const SAMPLE_QUESTION = {
  number: 3,
  total: 50,
  category: "Calculus",
  question: "If f(x) = x³ - 3x² + 2x - 1, find the value of x where f'(x) = 0.",
  options: [
    { id: "A", text: "x = 0, 2" },
    { id: "B", text: "x = 1, 2" },
    { id: "C", text: "x = -1, 1" },
    { id: "D", text: "x = 1 only" }
  ]
};

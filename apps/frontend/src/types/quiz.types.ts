/**
 * Quiz Category
 */
export type QuizCategory = 
  | 'general'
  | 'science'
  | 'history'
  | 'geography'
  | 'sports'
  | 'entertainment'
  | 'technology'
  | 'other';

/**
 * Quiz Set
 */
export interface QuizSet {
  id: number;
  title: string;
  description: string | null;
  category: QuizCategory | null;
  is_public: boolean;
  creator_id: number;
  creator_name: string;
  question_count: number;
  average_rating: number | null;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create Quiz Set Input
 */
export interface CreateQuizSetInput {
  title: string;
  description?: string;
  category?: QuizCategory;
}

/**
 * Update Quiz Set Input
 */
export interface UpdateQuizSetInput {
  title?: string;
  description?: string;
  category?: QuizCategory;
  is_public?: boolean;
}

/**
 * Quiz Question
 */
export interface QuizQuestion {
  id: number;
  quiz_set_id: number;
  question_text: string;
  correct_answer: string;
  wrong_answer1: string;
  wrong_answer2: string;
  wrong_answer3: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create Quiz Question Input
 */
export interface CreateQuizQuestionInput {
  question_text: string;
  correct_answer: string;
  wrong_answer1: string;
  wrong_answer2: string;
  wrong_answer3: string;
  order_index: number;
}

/**
 * Update Quiz Question Input
 */
export interface UpdateQuizQuestionInput {
  question_text?: string;
  correct_answer?: string;
  wrong_answer1?: string;
  wrong_answer2?: string;
  wrong_answer3?: string;
  order_index?: number;
}

/**
 * Quiz Attempt
 */
export interface QuizAttempt {
  id: number;
  quiz_set_id: number;
  user_id: number;
  score: number;
  total_questions: number;
  time_taken_seconds: number | null;
  created_at: string;
}

/**
 * Quiz Rating
 */
export interface QuizRating {
  id: number;
  quiz_set_id: number;
  user_id: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

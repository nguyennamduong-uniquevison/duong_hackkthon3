import { apiClient } from './api';

// Types
export interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'free_text' | 'scale';
  is_required: boolean;
  order_index: number;
  options?: {
    choices: string[];
  } | null;
  scale_config?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  public_url: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyWithQuestions extends Survey {
  questions: Question[];
}

export interface SurveyWithStats extends Survey {
  response_count: number;
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  is_public?: boolean;
  questions?: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'free_text' | 'scale';
  is_required?: boolean;
  order_index: number;
  options?: {
    choices: string[];
  };
  scale_config?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
  };
}

export interface UpdateSurveyRequest {
  title?: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateQuestionRequest {
  question_text?: string;
  is_required?: boolean;
  order_index?: number;
  options?: {
    choices: string[];
  };
  scale_config?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
  };
}

export interface Answer {
  question_id: string;
  answer_text?: string;
  answer_choices?: string[];
  answer_scale?: number;
}

export interface SubmitResponseRequest {
  answers: Answer[];
}

export interface Response {
  id: string;
  survey_id: string;
  submitted_at: string;
}

export interface ResponseWithAnswers extends Response {
  answers: {
    id: string;
    question_id: string;
    answer_text: string | null;
    answer_choices: string[] | null;
    answer_scale: number | null;
  }[];
}

export interface QuestionStats {
  question_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'free_text' | 'scale';
  total_responses: number;
  choice_stats?: Record<string, number>;
  scale_stats?: {
    average?: number;
    distribution?: Record<string, number>;
  };
  text_responses?: string[];
}

export interface SurveyStats {
  survey_id: string;
  total_responses: number;
  questions: QuestionStats[];
  responses_over_time: {
    date: string;
    count: number;
  }[];
}

export type SurveyTemplate = 
  | 'event_attendance'
  | 'customer_satisfaction'
  | 'course_evaluation'
  | 'schedule_coordination'
  | 'opinion_poll';

export interface CreateSurveyFromTemplateRequest {
  template: SurveyTemplate;
}

// API Functions
export const surveyService = {
  // Get all surveys for current user
  async getSurveys(): Promise<SurveyWithStats[]> {
    return await apiClient('/surveys');
  },

  // Get single survey with questions
  async getSurvey(id: string): Promise<SurveyWithQuestions> {
    return await apiClient(`/surveys/${id}`);
  },

  // Create survey
  async createSurvey(data: CreateSurveyRequest): Promise<SurveyWithQuestions> {
    return await apiClient('/surveys', {
      method: 'POST',
      body: data
    });
  },

  // Create survey from template
  async createSurveyFromTemplate(template: SurveyTemplate): Promise<SurveyWithQuestions> {
    return await apiClient('/surveys/from-template', {
      method: 'POST',
      body: { template }
    });
  },

  // Update survey
  async updateSurvey(id: string, data: UpdateSurveyRequest): Promise<Survey> {
    return await apiClient(`/surveys/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  // Delete survey
  async deleteSurvey(id: string): Promise<void> {
    await apiClient(`/surveys/${id}`, {
      method: 'DELETE'
    });
  },

  // Create question
  async createQuestion(surveyId: string, data: CreateQuestionRequest): Promise<Question> {
    return await apiClient(`/surveys/${surveyId}/questions`, {
      method: 'POST',
      body: data
    });
  },

  // Update question
  async updateQuestion(surveyId: string, questionId: string, data: UpdateQuestionRequest): Promise<Question> {
    return await apiClient(`/surveys/${surveyId}/questions/${questionId}`, {
      method: 'PUT',
      body: data
    });
  },

  // Delete question
  async deleteQuestion(surveyId: string, questionId: string): Promise<void> {
    await apiClient(`/surveys/${surveyId}/questions/${questionId}`, {
      method: 'DELETE'
    });
  },

  // Get public survey (no auth required)
  async getPublicSurvey(publicUrl: string): Promise<SurveyWithQuestions> {
    return await apiClient(`/public/surveys/${publicUrl}`);
  },

  // Submit response (no auth required)
  async submitResponse(publicUrl: string, data: SubmitResponseRequest): Promise<Response> {
    return await apiClient(`/public/surveys/${publicUrl}/responses`, {
      method: 'POST',
      body: data
    });
  },

  // Get survey responses
  async getSurveyResponses(surveyId: string): Promise<ResponseWithAnswers[]> {
    return await apiClient(`/surveys/${surveyId}/responses`);
  },

  // Get survey statistics
  async getSurveyStats(surveyId: string): Promise<SurveyStats> {
    return await apiClient(`/surveys/${surveyId}/stats`);
  }
};

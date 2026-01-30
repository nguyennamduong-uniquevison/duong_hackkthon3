import { z } from '@hono/zod-openapi'

// Question types
export const QuestionTypeEnum = z.enum(['single_choice', 'multiple_choice', 'free_text', 'scale'])

// Scale config schema
export const ScaleConfigSchema = z.object({
  min: z.number().int().min(1),
  max: z.number().int().max(10),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional()
})

// Question options schema (for choice questions)
export const QuestionOptionsSchema = z.object({
  choices: z.array(z.string()).min(2)
})

// Question schema
export const QuestionSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  survey_id: z.string().openapi({ example: '1' }),
  question_text: z.string().openapi({ example: 'このイベントに参加しますか?' }),
  question_type: QuestionTypeEnum.openapi({ example: 'single_choice' }),
  is_required: z.boolean().openapi({ example: true }),
  order_index: z.number().int().openapi({ example: 0 }),
  options: QuestionOptionsSchema.nullable().openapi({ 
    example: { choices: ['参加する', '参加しない', '未定'] } 
  }),
  scale_config: ScaleConfigSchema.nullable().openapi({ 
    example: { min: 1, max: 5, minLabel: '不満', maxLabel: '満足' } 
  }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('Question')

// Create question schema
export const CreateQuestionSchema = z.object({
  question_text: z.string().min(1, '質問文は必須です'),
  question_type: QuestionTypeEnum,
  is_required: z.boolean().default(false),
  order_index: z.number().int().min(0),
  options: QuestionOptionsSchema.optional(),
  scale_config: ScaleConfigSchema.optional()
}).openapi('CreateQuestion')

// Update question schema
export const UpdateQuestionSchema = z.object({
  question_text: z.string().min(1).optional(),
  is_required: z.boolean().optional(),
  order_index: z.number().int().min(0).optional(),
  options: QuestionOptionsSchema.optional(),
  scale_config: ScaleConfigSchema.optional()
}).openapi('UpdateQuestion')

// Survey schema
export const SurveySchema = z.object({
  id: z.string().openapi({ example: '1' }),
  user_id: z.string().openapi({ example: '1' }),
  title: z.string().openapi({ example: 'イベント出欠確認' }),
  description: z.string().nullable().openapi({ example: 'イベントへの参加をお知らせください' }),
  is_public: z.boolean().openapi({ example: true }),
  public_url: z.string().openapi({ example: 'abc123def456' }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('Survey')

// Survey with questions
export const SurveyWithQuestionsSchema = SurveySchema.extend({
  questions: z.array(QuestionSchema)
}).openapi('SurveyWithQuestions')

// Survey with response count
export const SurveyWithStatsSchema = SurveySchema.extend({
  response_count: z.number().int().openapi({ example: 10 })
}).openapi('SurveyWithStats')

// Create survey schema
export const CreateSurveySchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(500),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
  questions: z.array(CreateQuestionSchema).optional()
}).openapi('CreateSurvey')

// Update survey schema
export const UpdateSurveySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional()
}).openapi('UpdateSurvey')

// Answer schemas
export const AnswerSchema = z.object({
  question_id: z.string(),
  answer_text: z.string().optional(),
  answer_choices: z.array(z.string()).optional(),
  answer_scale: z.number().int().optional()
}).openapi('Answer')

// Response schema
export const ResponseSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  survey_id: z.string().openapi({ example: '1' }),
  submitted_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('Response')

// Response with answers
export const ResponseWithAnswersSchema = ResponseSchema.extend({
  answers: z.array(z.object({
    id: z.string(),
    question_id: z.string(),
    answer_text: z.string().nullable(),
    answer_choices: z.array(z.string()).nullable(),
    answer_scale: z.number().int().nullable()
  }))
}).openapi('ResponseWithAnswers')

// Submit response schema
export const SubmitResponseSchema = z.object({
  answers: z.array(AnswerSchema).min(1, '少なくとも1つの回答が必要です')
}).openapi('SubmitResponse')

// Path params
export const SurveyParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'id', in: 'path' },
    example: '1'
  })
})

export const PublicUrlParamsSchema = z.object({
  publicUrl: z.string().openapi({
    param: { name: 'publicUrl', in: 'path' },
    example: 'abc123def456'
  })
})

export const QuestionParamsSchema = z.object({
  questionId: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'questionId', in: 'path' },
    example: '1'
  })
})

// Survey list schema
export const SurveyListSchema = z.array(SurveyWithStatsSchema).openapi('SurveyList')

// Survey templates
export const SurveyTemplateEnum = z.enum([
  'event_attendance',
  'customer_satisfaction',
  'course_evaluation',
  'schedule_coordination',
  'opinion_poll'
])

export const CreateSurveyFromTemplateSchema = z.object({
  template: SurveyTemplateEnum
}).openapi('CreateSurveyFromTemplate')

// Response statistics
export const QuestionStatsSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  question_type: QuestionTypeEnum,
  total_responses: z.number().int(),
  choice_stats: z.record(z.number().int()).optional(), // { "選択肢1": 5, "選択肢2": 3 }
  scale_stats: z.object({
    average: z.number().optional(),
    distribution: z.record(z.number().int()).optional() // { "1": 2, "2": 3, "3": 5 }
  }).optional(),
  text_responses: z.array(z.string()).optional()
}).openapi('QuestionStats')

export const SurveyStatsSchema = z.object({
  survey_id: z.string(),
  total_responses: z.number().int(),
  questions: z.array(QuestionStatsSchema),
  responses_over_time: z.array(z.object({
    date: z.string(),
    count: z.number().int()
  }))
}).openapi('SurveyStats')

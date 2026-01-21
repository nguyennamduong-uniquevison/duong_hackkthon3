import { z } from '@hono/zod-openapi';

// Quiz Category Enum
export const QuizCategoryEnum = z.enum([
  'general',
  'science',
  'history',
  'geography',
  'sports',
  'entertainment',
  'technology',
  'other'
]).openapi('QuizCategory');

// Quiz Set Schemas
export const QuizSetParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '1',
  }),
}).openapi('QuizSetParams');

export const CreateQuizSetSchema = z.object({
  title: z.string().min(1).max(255).openapi({
    example: 'My Quiz Set',
    description: 'タイトル（必須）'
  }),
  description: z.string().optional().openapi({
    example: 'This is a quiz about general knowledge',
    description: '説明（任意）'
  }),
  category: QuizCategoryEnum.optional().openapi({
    example: 'general',
    description: 'カテゴリー（任意）'
  })
}).openapi('CreateQuizSet');

export const UpdateQuizSetSchema = z.object({
  title: z.string().min(1).max(255).optional().openapi({
    example: 'Updated Quiz Set',
    description: 'タイトル'
  }),
  description: z.string().optional().openapi({
    example: 'Updated description',
    description: '説明'
  }),
  category: QuizCategoryEnum.optional().openapi({
    example: 'science',
    description: 'カテゴリー'
  }),
  is_public: z.boolean().optional().openapi({
    example: true,
    description: '公開状態'
  })
}).openapi('UpdateQuizSet');

export const QuizSetSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  title: z.string().openapi({ example: 'General Knowledge Quiz' }),
  description: z.string().nullable().openapi({ example: 'Test your knowledge' }),
  category: QuizCategoryEnum.nullable().openapi({ example: 'general' }),
  is_public: z.boolean().openapi({ example: true }),
  creator_id: z.number().openapi({ example: 1 }),
  creator_name: z.string().openapi({ example: 'Admin User' }),
  question_count: z.number().openapi({ example: 5 }),
  average_rating: z.number().nullable().openapi({ example: 4.5 }),
  participant_count: z.number().openapi({ example: 10 }),
  created_at: z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('QuizSet');

export const QuizSetListSchema = z.array(QuizSetSchema).openapi('QuizSetList');

export const QuizSetResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: QuizSetSchema
}).openapi('QuizSetResponse');

export const QuizSetListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: QuizSetListSchema
}).openapi('QuizSetListResponse');

export const QuizSetDeleteResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'Quiz set deleted successfully' })
}).openapi('QuizSetDeleteResponse');

// Quiz Question Schemas
export const QuizQuestionSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  quiz_set_id: z.number().openapi({ example: 1 }),
  question_text: z.string().openapi({ example: 'What is the capital of France?' }),
  correct_answer: z.string().openapi({ example: 'Paris' }),
  wrong_answer1: z.string().openapi({ example: 'London' }),
  wrong_answer2: z.string().openapi({ example: 'Berlin' }),
  wrong_answer3: z.string().openapi({ example: 'Madrid' }),
  order_index: z.number().openapi({ example: 1 }),
  created_at: z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('QuizQuestion');

export const CreateQuizQuestionSchema = z.object({
  question_text: z.string().min(1).openapi({
    example: 'What is 2 + 2?',
    description: '質問文'
  }),
  correct_answer: z.string().min(1).openapi({
    example: '4',
    description: '正解'
  }),
  wrong_answer1: z.string().min(1).openapi({
    example: '3',
    description: '不正解1'
  }),
  wrong_answer2: z.string().min(1).openapi({
    example: '5',
    description: '不正解2'
  }),
  wrong_answer3: z.string().min(1).openapi({
    example: '22',
    description: '不正解3'
  }),
  order_index: z.number().int().min(1).openapi({
    example: 1,
    description: '順序'
  })
}).openapi('CreateQuizQuestion');

export const UpdateQuizQuestionSchema = z.object({
  question_text: z.string().min(1).optional().openapi({
    example: 'What is 2 + 2?',
    description: '質問文'
  }),
  correct_answer: z.string().min(1).optional().openapi({
    example: '4',
    description: '正解'
  }),
  wrong_answer1: z.string().min(1).optional().openapi({
    example: '3',
    description: '不正解1'
  }),
  wrong_answer2: z.string().min(1).optional().openapi({
    example: '5',
    description: '不正解2'
  }),
  wrong_answer3: z.string().min(1).optional().openapi({
    example: '22',
    description: '不正解3'
  }),
  order_index: z.number().int().min(1).optional().openapi({
    example: 1,
    description: '順序'
  })
}).openapi('UpdateQuizQuestion');

export const QuizQuestionListSchema = z.array(QuizQuestionSchema).openapi('QuizQuestionList');

export const QuizQuestionResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: QuizQuestionSchema
}).openapi('QuizQuestionResponse');

export const QuizQuestionListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: QuizQuestionListSchema
}).openapi('QuizQuestionListResponse');

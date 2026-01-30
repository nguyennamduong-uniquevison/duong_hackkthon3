import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
  SurveySchema,
  SurveyWithQuestionsSchema,
  SurveyWithStatsSchema,
  SurveyListSchema,
  CreateSurveySchema,
  UpdateSurveySchema,
  CreateSurveyFromTemplateSchema,
  SurveyParamsSchema,
  PublicUrlParamsSchema,
  QuestionSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  QuestionParamsSchema,
  SubmitResponseSchema,
  ResponseSchema,
  ResponseWithAnswersSchema,
  SurveyStatsSchema
} from '../schemas/surveys.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';
import { sql } from 'kysely';

// Helper function to generate unique URL
function generatePublicUrl(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Survey templates
const TEMPLATES = {
  event_attendance: {
    title: 'イベント出欠確認',
    description: 'イベントへの参加をお知らせください',
    questions: [
      { question_text: '参加しますか?', question_type: 'single_choice' as const, is_required: true, order_index: 0, options: { choices: ['参加する', '参加しない', '未定'] } },
      { question_text: '参加人数', question_type: 'free_text' as const, is_required: false, order_index: 1 },
      { question_text: 'コメント', question_type: 'free_text' as const, is_required: false, order_index: 2 }
    ]
  },
  customer_satisfaction: {
    title: '顧客満足度調査',
    description: 'サービスについてのご意見をお聞かせください',
    questions: [
      { question_text: '総合満足度', question_type: 'scale' as const, is_required: true, order_index: 0, scale_config: { min: 1, max: 5, minLabel: '不満', maxLabel: '満足' } },
      { question_text: '品質評価', question_type: 'scale' as const, is_required: true, order_index: 1, scale_config: { min: 1, max: 5, minLabel: '悪い', maxLabel: '良い' } },
      { question_text: '改善要望', question_type: 'free_text' as const, is_required: false, order_index: 2 }
    ]
  },
  course_evaluation: {
    title: '授業・セミナー評価',
    description: '授業についてのご意見をお聞かせください',
    questions: [
      { question_text: '内容の理解度', question_type: 'scale' as const, is_required: true, order_index: 0, scale_config: { min: 1, max: 5, minLabel: '理解できなかった', maxLabel: '十分理解できた' } },
      { question_text: '満足度', question_type: 'scale' as const, is_required: true, order_index: 1, scale_config: { min: 1, max: 5, minLabel: '不満', maxLabel: '満足' } },
      { question_text: 'コメント', question_type: 'free_text' as const, is_required: false, order_index: 2 }
    ]
  },
  schedule_coordination: {
    title: '日程調整',
    description: 'ご都合の良い日時を教えてください',
    questions: [
      { question_text: '参加可能な日時', question_type: 'multiple_choice' as const, is_required: true, order_index: 0, options: { choices: ['2月1日 10:00', '2月1日 14:00', '2月2日 10:00', '2月2日 14:00'] } },
      { question_text: '備考', question_type: 'free_text' as const, is_required: false, order_index: 1 }
    ]
  },
  opinion_poll: {
    title: '意見募集',
    description: 'ご意見をお聞かせください',
    questions: [
      { question_text: 'この提案に賛成ですか?', question_type: 'single_choice' as const, is_required: true, order_index: 0, options: { choices: ['賛成', '反対', 'どちらでもない'] } },
      { question_text: '理由', question_type: 'free_text' as const, is_required: false, order_index: 1 },
      { question_text: 'その他ご意見', question_type: 'free_text' as const, is_required: false, order_index: 2 }
    ]
  }
};

export const storeSurveyApi = (app: OpenAPIHono) => {
  // Protected routes (require auth)
  app.use('/api/surveys', authMiddleware);
  app.use('/api/surveys/*', authMiddleware);
  
  // Survey CRUD
  storeGetSurveysRoute(app);
  storeGetSurveyRoute(app);
  storeCreateSurveyRoute(app);
  storeCreateSurveyFromTemplateRoute(app);
  storeUpdateSurveyRoute(app);
  storeDeleteSurveyRoute(app);
  
  // Question management
  storeCreateQuestionRoute(app);
  storeUpdateQuestionRoute(app);
  storeDeleteQuestionRoute(app);
  
  // Results & stats
  storeGetSurveyResponsesRoute(app);
  storeGetSurveyStatsRoute(app);
  
  // Public routes (no auth required)
  storeGetPublicSurveyRoute(app);
  storeSubmitResponseRoute(app);
};

// Get all surveys for current user
const storeGetSurveysRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'get',
    path: '/api/surveys',
    responses: {
      200: {
        content: { 'application/json': { schema: SurveyListSchema } },
        description: 'アンケート一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const userId = c.get('userId');
      
      const surveys = await db
        .selectFrom('surveys')
        .leftJoin('responses', 'surveys.id', 'responses.survey_id')
        .select([
          'surveys.id',
          'surveys.user_id',
          'surveys.title',
          'surveys.description',
          'surveys.is_public',
          'surveys.public_url',
          'surveys.created_at',
          'surveys.updated_at',
          sql<number>`COUNT(DISTINCT responses.id)`.as('response_count')
        ])
        .where('surveys.user_id', '=', userId)
        .groupBy('surveys.id')
        .orderBy('surveys.created_at', 'desc')
        .execute();

      const formatted = surveys.map(s => ({
        id: s.id.toString(),
        user_id: s.user_id.toString(),
        title: s.title,
        description: s.description,
        is_public: s.is_public,
        public_url: s.public_url,
        created_at: s.created_at.toISOString(),
        updated_at: s.updated_at.toISOString(),
        response_count: Number(s.response_count) || 0
      }));

      return c.json(formatted, 200);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Get single survey with questions
const storeGetSurveyRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'get',
    path: '/api/surveys/{id}',
    request: {
      params: SurveyParamsSchema
    },
    responses: {
      200: {
        content: { 'application/json': { schema: SurveyWithQuestionsSchema } },
        description: 'アンケート詳細を取得'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const survey = await db
        .selectFrom('surveys')
        .selectAll()
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const questions = await db
        .selectFrom('questions')
        .selectAll()
        .where('survey_id', '=', Number(id))
        .orderBy('order_index', 'asc')
        .execute();

      const formatted = {
        id: survey.id.toString(),
        user_id: survey.user_id.toString(),
        title: survey.title,
        description: survey.description,
        is_public: survey.is_public,
        public_url: survey.public_url,
        created_at: survey.created_at.toISOString(),
        updated_at: survey.updated_at.toISOString(),
        questions: questions.map(q => ({
          id: q.id.toString(),
          survey_id: q.survey_id.toString(),
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          order_index: q.order_index,
          options: q.options as any,
          scale_config: q.scale_config as any,
          created_at: q.created_at.toISOString(),
          updated_at: q.updated_at.toISOString()
        }))
      };

      return c.json(formatted, 200);
    } catch (error) {
      console.error('Error fetching survey:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Create survey
const storeCreateSurveyRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'post',
    path: '/api/surveys',
    request: {
      body: {
        content: { 'application/json': { schema: CreateSurveySchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: SurveyWithQuestionsSchema } },
        description: 'アンケート作成成功'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const userId = c.get('userId');
      const body = c.req.valid('json');

      const publicUrl = generatePublicUrl();

      const survey = await db
        .insertInto('surveys')
        .values({
          user_id: userId,
          title: body.title,
          description: body.description || null,
          is_public: body.is_public ?? true,
          public_url: publicUrl
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      let questions: any[] = [];
      if (body.questions && body.questions.length > 0) {
        questions = await db
          .insertInto('questions')
          .values(
            body.questions.map(q => ({
              survey_id: survey.id,
              question_text: q.question_text,
              question_type: q.question_type,
              is_required: q.is_required ?? false,
              order_index: q.order_index,
              options: q.options ? JSON.stringify(q.options) : null,
              scale_config: q.scale_config ? JSON.stringify(q.scale_config) : null
            }))
          )
          .returningAll()
          .execute();
      }

      const formatted = {
        id: survey.id.toString(),
        user_id: survey.user_id.toString(),
        title: survey.title,
        description: survey.description,
        is_public: survey.is_public,
        public_url: survey.public_url,
        created_at: survey.created_at.toISOString(),
        updated_at: survey.updated_at.toISOString(),
        questions: questions.map(q => ({
          id: q.id.toString(),
          survey_id: q.survey_id.toString(),
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          order_index: q.order_index,
          options: q.options,
          scale_config: q.scale_config,
          created_at: q.created_at.toISOString(),
          updated_at: q.updated_at.toISOString()
        }))
      };

      return c.json(formatted, 201);
    } catch (error) {
      console.error('Error creating survey:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Create survey from template
const storeCreateSurveyFromTemplateRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'post',
    path: '/api/surveys/from-template',
    request: {
      body: {
        content: { 'application/json': { schema: CreateSurveyFromTemplateSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: SurveyWithQuestionsSchema } },
        description: 'テンプレートからアンケート作成成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '不正なテンプレート'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const userId = c.get('userId');
      const { template } = c.req.valid('json');

      const templateData = TEMPLATES[template];
      if (!templateData) {
        return c.json({ message: '不正なテンプレート' }, 400);
      }

      const publicUrl = generatePublicUrl();

      const survey = await db
        .insertInto('surveys')
        .values({
          user_id: userId,
          title: templateData.title,
          description: templateData.description,
          is_public: true,
          public_url: publicUrl
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const questions = await db
        .insertInto('questions')
        .values(
          templateData.questions.map(q => ({
            survey_id: survey.id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            order_index: q.order_index,
            options: q.options ? JSON.stringify(q.options) : null,
            scale_config: q.scale_config ? JSON.stringify(q.scale_config) : null
          }))
        )
        .returningAll()
        .execute();

      const formatted = {
        id: survey.id.toString(),
        user_id: survey.user_id.toString(),
        title: survey.title,
        description: survey.description,
        is_public: survey.is_public,
        public_url: survey.public_url,
        created_at: survey.created_at.toISOString(),
        updated_at: survey.updated_at.toISOString(),
        questions: questions.map(q => ({
          id: q.id.toString(),
          survey_id: q.survey_id.toString(),
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          order_index: q.order_index,
          options: q.options,
          scale_config: q.scale_config,
          created_at: q.created_at.toISOString(),
          updated_at: q.updated_at.toISOString()
        }))
      };

      return c.json(formatted, 201);
    } catch (error) {
      console.error('Error creating survey from template:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Update survey
const storeUpdateSurveyRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'put',
    path: '/api/surveys/{id}',
    request: {
      params: SurveyParamsSchema,
      body: {
        content: { 'application/json': { schema: UpdateSurveySchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: SurveySchema } },
        description: 'アンケート更新成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');
      const body = c.req.valid('json');

      const exists = await db
        .selectFrom('surveys')
        .select('id')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!exists) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const updated = await db
        .updateTable('surveys')
        .set({
          title: body.title,
          description: body.description,
          is_public: body.is_public,
          updated_at: new Date()
        })
        .where('id', '=', Number(id))
        .returningAll()
        .executeTakeFirstOrThrow();

      const formatted = {
        id: updated.id.toString(),
        user_id: updated.user_id.toString(),
        title: updated.title,
        description: updated.description,
        is_public: updated.is_public,
        public_url: updated.public_url,
        created_at: updated.created_at.toISOString(),
        updated_at: updated.updated_at.toISOString()
      };

      return c.json(formatted, 200);
    } catch (error) {
      console.error('Error updating survey:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Delete survey
const storeDeleteSurveyRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'delete',
    path: '/api/surveys/{id}',
    request: {
      params: SurveyParamsSchema
    },
    responses: {
      204: {
        description: 'アンケート削除成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const result = await db
        .deleteFrom('surveys')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      return c.body(null, 204);
    } catch (error) {
      console.error('Error deleting survey:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Create question
const storeCreateQuestionRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'post',
    path: '/api/surveys/{id}/questions',
    request: {
      params: SurveyParamsSchema,
      body: {
        content: { 'application/json': { schema: CreateQuestionSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: QuestionSchema } },
        description: '質問作成成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');
      const body = c.req.valid('json');

      const survey = await db
        .selectFrom('surveys')
        .select('id')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const question = await db
        .insertInto('questions')
        .values({
          survey_id: Number(id),
          question_text: body.question_text,
          question_type: body.question_type,
          is_required: body.is_required ?? false,
          order_index: body.order_index,
          options: body.options ? JSON.stringify(body.options) : null,
          scale_config: body.scale_config ? JSON.stringify(body.scale_config) : null
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const formatted = {
        id: question.id.toString(),
        survey_id: question.survey_id.toString(),
        question_text: question.question_text,
        question_type: question.question_type,
        is_required: question.is_required,
        order_index: question.order_index,
        options: question.options,
        scale_config: question.scale_config,
        created_at: question.created_at.toISOString(),
        updated_at: question.updated_at.toISOString()
      };

      return c.json(formatted, 201);
    } catch (error) {
      console.error('Error creating question:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Update question
const storeUpdateQuestionRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'put',
    path: '/api/surveys/{id}/questions/{questionId}',
    request: {
      params: SurveyParamsSchema.merge(QuestionParamsSchema),
      body: {
        content: { 'application/json': { schema: UpdateQuestionSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: QuestionSchema } },
        description: '質問更新成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '質問が見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id, questionId } = c.req.valid('param');
      const userId = c.get('userId');
      const body = c.req.valid('json');

      const survey = await db
        .selectFrom('surveys')
        .select('id')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const updateData: any = {
        updated_at: new Date()
      };
      if (body.question_text !== undefined) updateData.question_text = body.question_text;
      if (body.is_required !== undefined) updateData.is_required = body.is_required;
      if (body.order_index !== undefined) updateData.order_index = body.order_index;
      if (body.options !== undefined) updateData.options = JSON.stringify(body.options);
      if (body.scale_config !== undefined) updateData.scale_config = JSON.stringify(body.scale_config);

      const updated = await db
        .updateTable('questions')
        .set(updateData)
        .where('id', '=', Number(questionId))
        .where('survey_id', '=', Number(id))
        .returningAll()
        .executeTakeFirst();

      if (!updated) {
        return c.json({ message: '質問が見つかりません' }, 404);
      }

      const formatted = {
        id: updated.id.toString(),
        survey_id: updated.survey_id.toString(),
        question_text: updated.question_text,
        question_type: updated.question_type,
        is_required: updated.is_required,
        order_index: updated.order_index,
        options: updated.options,
        scale_config: updated.scale_config,
        created_at: updated.created_at.toISOString(),
        updated_at: updated.updated_at.toISOString()
      };

      return c.json(formatted, 200);
    } catch (error) {
      console.error('Error updating question:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Delete question
const storeDeleteQuestionRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'delete',
    path: '/api/surveys/{id}/questions/{questionId}',
    request: {
      params: SurveyParamsSchema.merge(QuestionParamsSchema)
    },
    responses: {
      204: {
        description: '質問削除成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '質問が見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id, questionId } = c.req.valid('param');
      const userId = c.get('userId');

      const survey = await db
        .selectFrom('surveys')
        .select('id')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const result = await db
        .deleteFrom('questions')
        .where('id', '=', Number(questionId))
        .where('survey_id', '=', Number(id))
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return c.json({ message: '質問が見つかりません' }, 404);
      }

      return c.body(null, 204);
    } catch (error) {
      console.error('Error deleting question:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Get public survey (no auth)
const storeGetPublicSurveyRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'get',
    path: '/api/public/surveys/{publicUrl}',
    request: {
      params: PublicUrlParamsSchema
    },
    responses: {
      200: {
        content: { 'application/json': { schema: SurveyWithQuestionsSchema } },
        description: '公開アンケート取得成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { publicUrl } = c.req.valid('param');

      const survey = await db
        .selectFrom('surveys')
        .selectAll()
        .where('public_url', '=', publicUrl)
        .where('is_public', '=', true)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const questions = await db
        .selectFrom('questions')
        .selectAll()
        .where('survey_id', '=', survey.id)
        .orderBy('order_index', 'asc')
        .execute();

      const formatted = {
        id: survey.id.toString(),
        user_id: survey.user_id.toString(),
        title: survey.title,
        description: survey.description,
        is_public: survey.is_public,
        public_url: survey.public_url,
        created_at: survey.created_at.toISOString(),
        updated_at: survey.updated_at.toISOString(),
        questions: questions.map(q => ({
          id: q.id.toString(),
          survey_id: q.survey_id.toString(),
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          order_index: q.order_index,
          options: q.options,
          scale_config: q.scale_config,
          created_at: q.created_at.toISOString(),
          updated_at: q.updated_at.toISOString()
        }))
      };

      return c.json(formatted, 200);
    } catch (error) {
      console.error('Error fetching public survey:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Submit response (no auth)
const storeSubmitResponseRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'post',
    path: '/api/public/surveys/{publicUrl}/responses',
    request: {
      params: PublicUrlParamsSchema,
      body: {
        content: { 'application/json': { schema: SubmitResponseSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: ResponseSchema } },
        description: '回答送信成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'バリデーションエラー'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { publicUrl } = c.req.valid('param');
      const { answers } = c.req.valid('json');

      const survey = await db
        .selectFrom('surveys')
        .select('id')
        .where('public_url', '=', publicUrl)
        .where('is_public', '=', true)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      // Validate required questions
      const questions = await db
        .selectFrom('questions')
        .select(['id', 'is_required'])
        .where('survey_id', '=', survey.id)
        .execute();

      const requiredQuestionIds = questions.filter(q => q.is_required).map(q => q.id.toString());
      const answeredQuestionIds = answers.map(a => a.question_id);
      
      const missingRequired = requiredQuestionIds.filter(id => !answeredQuestionIds.includes(id));
      if (missingRequired.length > 0) {
        return c.json({ message: '必須の質問に回答してください' }, 400);
      }

      // Create response
      const response = await db
        .insertInto('responses')
        .values({
          survey_id: survey.id
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Create answers
      await db
        .insertInto('answers')
        .values(
          answers.map(a => ({
            response_id: response.id,
            question_id: Number(a.question_id),
            answer_text: a.answer_text || null,
            answer_choices: a.answer_choices ? JSON.stringify(a.answer_choices) : null,
            answer_scale: a.answer_scale || null
          }))
        )
        .execute();

      const formatted = {
        id: response.id.toString(),
        survey_id: response.survey_id.toString(),
        submitted_at: response.submitted_at.toISOString()
      };

      return c.json(formatted, 201);
    } catch (error) {
      console.error('Error submitting response:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Get survey responses
const storeGetSurveyResponsesRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'get',
    path: '/api/surveys/{id}/responses',
    request: {
      params: SurveyParamsSchema
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.array(ResponseWithAnswersSchema) } },
        description: '回答一覧取得成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const survey = await db
        .selectFrom('surveys')
        .select('id')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      const responses = await db
        .selectFrom('responses')
        .selectAll()
        .where('survey_id', '=', Number(id))
        .orderBy('submitted_at', 'desc')
        .execute();

      const formatted = await Promise.all(
        responses.map(async (response) => {
          const answers = await db
            .selectFrom('answers')
            .selectAll()
            .where('response_id', '=', response.id)
            .execute();

          return {
            id: response.id.toString(),
            survey_id: response.survey_id.toString(),
            submitted_at: response.submitted_at.toISOString(),
            answers: answers.map(a => ({
              id: a.id.toString(),
              question_id: a.question_id.toString(),
              answer_text: a.answer_text,
              answer_choices: a.answer_choices as any,
              answer_scale: a.answer_scale
            }))
          };
        })
      );

      return c.json(formatted, 200);
    } catch (error) {
      console.error('Error fetching responses:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

// Get survey statistics
const storeGetSurveyStatsRoute = (app: OpenAPIHono) => {
  const route = createRoute({
    method: 'get',
    path: '/api/surveys/{id}/stats',
    request: {
      params: SurveyParamsSchema
    },
    responses: {
      200: {
        content: { 'application/json': { schema: SurveyStatsSchema } },
        description: '統計情報取得成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アンケートが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(route, async (c) => {
    try {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const survey = await db
        .selectFrom('surveys')
        .select('id')
        .where('id', '=', Number(id))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!survey) {
        return c.json({ message: 'アンケートが見つかりません' }, 404);
      }

      // Get total responses
      const totalResponses = await db
        .selectFrom('responses')
        .select(sql<number>`COUNT(*)`.as('count'))
        .where('survey_id', '=', Number(id))
        .executeTakeFirstOrThrow();

      // Get questions
      const questions = await db
        .selectFrom('questions')
        .selectAll()
        .where('survey_id', '=', Number(id))
        .orderBy('order_index', 'asc')
        .execute();

      // Calculate stats for each question
      const questionStats = await Promise.all(
        questions.map(async (question) => {
          const answers = await db
            .selectFrom('answers')
            .selectAll()
            .where('question_id', '=', question.id)
            .execute();

          const stats: any = {
            question_id: question.id.toString(),
            question_text: question.question_text,
            question_type: question.question_type,
            total_responses: answers.length
          };

          if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
            const choiceStats: Record<string, number> = {};
            answers.forEach(a => {
              const choices = a.answer_choices as any as string[];
              if (choices) {
                choices.forEach(choice => {
                  choiceStats[choice] = (choiceStats[choice] || 0) + 1;
                });
              }
            });
            stats.choice_stats = choiceStats;
          } else if (question.question_type === 'scale') {
            const scaleValues = answers.map(a => a.answer_scale).filter(v => v !== null) as number[];
            const distribution: Record<string, number> = {};
            scaleValues.forEach(v => {
              distribution[v.toString()] = (distribution[v.toString()] || 0) + 1;
            });
            const average = scaleValues.length > 0 
              ? scaleValues.reduce((sum, v) => sum + v, 0) / scaleValues.length 
              : 0;
            stats.scale_stats = { average, distribution };
          } else if (question.question_type === 'free_text') {
            stats.text_responses = answers.map(a => a.answer_text).filter(Boolean);
          }

          return stats;
        })
      );

      // Get responses over time (daily)
      const responsesOverTime = await db
        .selectFrom('responses')
        .select([
          sql<string>`DATE(submitted_at)`.as('date'),
          sql<number>`COUNT(*)`.as('count')
        ])
        .where('survey_id', '=', Number(id))
        .groupBy(sql`DATE(submitted_at)`)
        .orderBy(sql`DATE(submitted_at)`, 'asc')
        .execute();

      const result = {
        survey_id: id,
        total_responses: Number(totalResponses.count),
        questions: questionStats,
        responses_over_time: responsesOverTime.map(r => ({
          date: r.date,
          count: Number(r.count)
        }))
      };

      return c.json(result, 200);
    } catch (error) {
      console.error('Error fetching survey stats:', error);
      return c.json({ message: 'サーバーエラー' }, 500);
    }
  });
};

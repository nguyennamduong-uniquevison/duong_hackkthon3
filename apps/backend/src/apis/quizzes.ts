import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import {
  QuizSetParamsSchema,
  CreateQuizSetSchema,
  UpdateQuizSetSchema,
  QuizSetResponseSchema,
  QuizSetListResponseSchema,
  QuizSetDeleteResponseSchema
} from '../schemas/quizzes.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';
import { sql } from 'kysely';

export const storeQuizSetApi = (app: OpenAPIHono) => {
  // All quiz set routes require authentication except list and get
  storeGetQuizSetsRoute(app);
  storeGetQuizSetRoute(app);
  storeCreateQuizSetRoute(app);
  storeUpdateQuizSetRoute(app);
  storeDeleteQuizSetRoute(app);
};

// GET /api/quiz-sets - Get all public quiz sets (+ user's private ones if authenticated)
const storeGetQuizSetsRoute = (app: OpenAPIHono) => {
  const getQuizSetsRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets',
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetListResponseSchema } },
        description: 'クイズセット一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(getQuizSetsRoute, async (c) => {
    try {
      const user = (c as any).get('user') as { id: number; } | undefined;
      const userId = user?.id;

      // Build query to get quiz sets with stats
      let query = db
        .selectFrom('quiz_sets as qs')
        .leftJoin('users as u', 'u.id', 'qs.creator_id')
        .leftJoin('quiz_questions as qq', 'qq.quiz_set_id', 'qs.id')
        .leftJoin('quiz_ratings as qr', 'qr.quiz_set_id', 'qs.id')
        .leftJoin('quiz_attempts as qa', 'qa.quiz_set_id', 'qs.id')
        .select([
          'qs.id',
          'qs.title',
          'qs.description',
          'qs.category',
          'qs.is_public',
          'qs.creator_id',
          'u.name as creator_name',
          'qs.created_at',
          'qs.updated_at',
          sql<number>`COUNT(DISTINCT qq.id)`.as('question_count'),
          sql<number>`AVG(qr.rating)`.as('average_rating'),
          sql<number>`COUNT(DISTINCT qa.user_id)`.as('participant_count')
        ])
        .groupBy([
          'qs.id',
          'qs.title',
          'qs.description',
          'qs.category',
          'qs.is_public',
          'qs.creator_id',
          'u.name',
          'qs.created_at',
          'qs.updated_at'
        ]);

      // Filter: show public quiz sets + user's own private ones if authenticated
      if (userId) {
        query = query.where((eb) =>
          eb.or([
            eb('qs.is_public', '=', true),
            eb('qs.creator_id', '=', userId)
          ])
        );
      } else {
        query = query.where('qs.is_public', '=', true);
      }

      const quizSets = await query
        .orderBy('qs.created_at', 'desc')
        .execute();

      return c.json({
        success: true,
        data: quizSets.map(qs => ({
          ...qs,
          created_at: qs.created_at.toISOString(),
          updated_at: qs.updated_at.toISOString(),
          question_count: Number(qs.question_count) || 0,
          average_rating: qs.average_rating ? Number(qs.average_rating) : null,
          participant_count: Number(qs.participant_count) || 0
        }))
      });
    } catch (error) {
      console.error('Get quiz sets error:', error);
      return c.json({
        success: false,
        message: 'Failed to get quiz sets',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

// GET /api/quiz-sets/{id} - Get quiz set detail
const storeGetQuizSetRoute = (app: OpenAPIHono) => {
  const getQuizSetRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets/{id}',
    request: { params: QuizSetParamsSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetResponseSchema } },
        description: 'クイズセット情報を取得'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(getQuizSetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const user = (c as any).get('user') as { id: number; } | undefined;
    const userId = user?.id;

    try {
      const quizSet = await db
        .selectFrom('quiz_sets as qs')
        .leftJoin('users as u', 'u.id', 'qs.creator_id')
        .leftJoin('quiz_questions as qq', 'qq.quiz_set_id', 'qs.id')
        .leftJoin('quiz_ratings as qr', 'qr.quiz_set_id', 'qs.id')
        .leftJoin('quiz_attempts as qa', 'qa.quiz_set_id', 'qs.id')
        .select([
          'qs.id',
          'qs.title',
          'qs.description',
          'qs.category',
          'qs.is_public',
          'qs.creator_id',
          'u.name as creator_name',
          'qs.created_at',
          'qs.updated_at',
          sql<number>`COUNT(DISTINCT qq.id)`.as('question_count'),
          sql<number>`AVG(qr.rating)`.as('average_rating'),
          sql<number>`COUNT(DISTINCT qa.user_id)`.as('participant_count')
        ])
        .where('qs.id', '=', parseInt(id))
        .groupBy([
          'qs.id',
          'qs.title',
          'qs.description',
          'qs.category',
          'qs.is_public',
          'qs.creator_id',
          'u.name',
          'qs.created_at',
          'qs.updated_at'
        ])
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      // Check access permission: must be public OR user is creator
      if (!quizSet.is_public && quizSet.creator_id !== userId) {
        return c.json({
          success: false,
          message: 'Access denied. This quiz set is private.'
        }, 403);
      }

      return c.json({
        success: true,
        data: {
          ...quizSet,
          created_at: quizSet.created_at.toISOString(),
          updated_at: quizSet.updated_at.toISOString(),
          question_count: Number(quizSet.question_count) || 0,
          average_rating: quizSet.average_rating ? Number(quizSet.average_rating) : null,
          participant_count: Number(quizSet.participant_count) || 0
        }
      });
    } catch (error) {
      console.error('Get quiz set error:', error);
      return c.json({
        success: false,
        message: 'Failed to get quiz set',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

// POST /api/quiz-sets - Create new quiz set (requires auth)
const storeCreateQuizSetRoute = (app: OpenAPIHono) => {
  app.use('/api/quiz-sets', authMiddleware);

  const createQuizSetRoute = createRoute({
    method: 'post',
    path: '/api/quiz-sets',
    request: {
      body: {
        content: { 'application/json': { schema: CreateQuizSetSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: QuizSetResponseSchema } },
        description: 'クイズセット作成成功'
      },
      401: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '認証エラー'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(createQuizSetRoute, async (c) => {
    const user = (c as any).get('user') as { id: number; name: string; };
    const body = c.req.valid('json');

    try {
      const newQuizSet = await db
        .insertInto('quiz_sets')
        .values({
          title: body.title,
          description: body.description || null,
          category: body.category || null,
          is_public: false, // Default is private
          creator_id: user.id
        })
        .returning([
          'id',
          'title',
          'description',
          'category',
          'is_public',
          'creator_id',
          'created_at',
          'updated_at'
        ])
        .executeTakeFirstOrThrow();

      return c.json({
        success: true,
        data: {
          ...newQuizSet,
          creator_name: user.name,
          question_count: 0,
          average_rating: null,
          participant_count: 0,
          created_at: newQuizSet.created_at.toISOString(),
          updated_at: newQuizSet.updated_at.toISOString()
        }
      }, 201);
    } catch (error) {
      console.error('Create quiz set error:', error);
      return c.json({
        success: false,
        message: 'Failed to create quiz set',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

// PUT /api/quiz-sets/{id} - Update quiz set (requires auth, must be creator)
const storeUpdateQuizSetRoute = (app: OpenAPIHono) => {
  app.use('/api/quiz-sets/:id', authMiddleware);

  const updateQuizSetRoute = createRoute({
    method: 'put',
    path: '/api/quiz-sets/{id}',
    request: {
      params: QuizSetParamsSchema,
      body: {
        content: { 'application/json': { schema: UpdateQuizSetSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetResponseSchema } },
        description: 'クイズセット更新成功'
      },
      401: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '認証エラー'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '権限エラー'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(updateQuizSetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const user = (c as any).get('user') as { id: number; name: string; };
    const body = c.req.valid('json');

    try {
      // Check if quiz set exists and user is the creator
      const existingQuizSet = await db
        .selectFrom('quiz_sets')
        .select(['id', 'creator_id'])
        .where('id', '=', parseInt(id))
        .executeTakeFirst();

      if (!existingQuizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      if (existingQuizSet.creator_id !== user.id) {
        return c.json({
          success: false,
          message: 'You can only update your own quiz sets'
        }, 403);
      }

      // Build update object with only provided fields
      const updateData: any = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.is_public !== undefined) updateData.is_public = body.is_public;
      updateData.updated_at = new Date();

      const updatedQuizSet = await db
        .updateTable('quiz_sets')
        .set(updateData)
        .where('id', '=', parseInt(id))
        .returning([
          'id',
          'title',
          'description',
          'category',
          'is_public',
          'creator_id',
          'created_at',
          'updated_at'
        ])
        .executeTakeFirstOrThrow();

      // Get stats
      const stats = await db
        .selectFrom('quiz_sets as qs')
        .leftJoin('quiz_questions as qq', 'qq.quiz_set_id', 'qs.id')
        .leftJoin('quiz_ratings as qr', 'qr.quiz_set_id', 'qs.id')
        .leftJoin('quiz_attempts as qa', 'qa.quiz_set_id', 'qs.id')
        .select([
          sql<number>`COUNT(DISTINCT qq.id)`.as('question_count'),
          sql<number>`AVG(qr.rating)`.as('average_rating'),
          sql<number>`COUNT(DISTINCT qa.user_id)`.as('participant_count')
        ])
        .where('qs.id', '=', parseInt(id))
        .executeTakeFirst();

      return c.json({
        success: true,
        data: {
          ...updatedQuizSet,
          creator_name: user.name,
          question_count: Number(stats?.question_count) || 0,
          average_rating: stats?.average_rating ? Number(stats.average_rating) : null,
          participant_count: Number(stats?.participant_count) || 0,
          created_at: updatedQuizSet.created_at.toISOString(),
          updated_at: updatedQuizSet.updated_at.toISOString()
        }
      });
    } catch (error) {
      console.error('Update quiz set error:', error);
      return c.json({
        success: false,
        message: 'Failed to update quiz set',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

// DELETE /api/quiz-sets/{id} - Delete quiz set (requires auth, must be creator)
const storeDeleteQuizSetRoute = (app: OpenAPIHono) => {
  const deleteQuizSetRoute = createRoute({
    method: 'delete',
    path: '/api/quiz-sets/{id}',
    request: { params: QuizSetParamsSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetDeleteResponseSchema } },
        description: 'クイズセット削除成功'
      },
      401: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '認証エラー'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '権限エラー'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  app.openapi(deleteQuizSetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const user = (c as any).get('user') as { id: number; };

    try {
      // Check if quiz set exists and user is the creator
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['id', 'creator_id'])
        .where('id', '=', parseInt(id))
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      if (quizSet.creator_id !== user.id) {
        return c.json({
          success: false,
          message: 'You can only delete your own quiz sets'
        }, 403);
      }

      // Delete quiz set (cascade will delete questions, ratings, and attempts)
      await db
        .deleteFrom('quiz_sets')
        .where('id', '=', parseInt(id))
        .execute();

      return c.json({
        success: true,
        message: 'Quiz set deleted successfully'
      });
    } catch (error) {
      console.error('Delete quiz set error:', error);
      return c.json({
        success: false,
        message: 'Failed to delete quiz set',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

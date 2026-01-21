import type { Kysely } from 'kysely'
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create categories enum type
  await sql`
    CREATE TYPE quiz_category AS ENUM (
      'general',
      'science',
      'history',
      'geography',
      'sports',
      'entertainment',
      'technology',
      'other'
    )
  `.execute(db);

  // Create quiz_sets table
  await db.schema
    .createTable('quiz_sets')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('category', sql`quiz_category`)
    .addColumn('is_public', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('creator_id', 'integer', (col) => 
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create index for creator_id
  await db.schema.createIndex('idx_quiz_sets_creator_id')
    .on('quiz_sets')
    .column('creator_id')
    .execute()

  // Create index for is_public
  await db.schema.createIndex('idx_quiz_sets_is_public')
    .on('quiz_sets')
    .column('is_public')
    .execute()

  // Create index for category
  await db.schema.createIndex('idx_quiz_sets_category')
    .on('quiz_sets')
    .column('category')
    .execute()

  // Create quiz_questions table
  await db.schema
    .createTable('quiz_questions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('quiz_set_id', 'integer', (col) => 
      col.references('quiz_sets.id').onDelete('cascade').notNull()
    )
    .addColumn('question_text', 'text', (col) => col.notNull())
    .addColumn('correct_answer', 'varchar(255)', (col) => col.notNull())
    .addColumn('wrong_answer1', 'varchar(255)', (col) => col.notNull())
    .addColumn('wrong_answer2', 'varchar(255)', (col) => col.notNull())
    .addColumn('wrong_answer3', 'varchar(255)', (col) => col.notNull())
    .addColumn('order_index', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create index for quiz_set_id
  await db.schema.createIndex('idx_quiz_questions_quiz_set_id')
    .on('quiz_questions')
    .column('quiz_set_id')
    .execute()

  // Create quiz_attempts table (for tracking who participated)
  await db.schema
    .createTable('quiz_attempts')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('quiz_set_id', 'integer', (col) => 
      col.references('quiz_sets.id').onDelete('cascade').notNull()
    )
    .addColumn('user_id', 'integer', (col) => 
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('score', 'integer', (col) => col.notNull())
    .addColumn('total_questions', 'integer', (col) => col.notNull())
    .addColumn('time_taken_seconds', 'integer')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create index for quiz_set_id and user_id
  await db.schema.createIndex('idx_quiz_attempts_quiz_set_user')
    .on('quiz_attempts')
    .columns(['quiz_set_id', 'user_id'])
    .execute()

  // Create quiz_ratings table
  await db.schema
    .createTable('quiz_ratings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('quiz_set_id', 'integer', (col) => 
      col.references('quiz_sets.id').onDelete('cascade').notNull()
    )
    .addColumn('user_id', 'integer', (col) => 
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('rating', 'integer', (col) => col.notNull().check(sql`rating >= 1 AND rating <= 5`))
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create unique constraint for user rating per quiz set
  await db.schema.createIndex('idx_quiz_ratings_unique_user_quiz')
    .on('quiz_ratings')
    .columns(['quiz_set_id', 'user_id'])
    .unique()
    .execute()

  // Insert sample quiz sets
  const demoUserId = 1; // admin@test.com

  const quizSet1 = await db
    .insertInto('quiz_sets')
    .values({
      title: 'General Knowledge Quiz',
      description: 'Test your general knowledge with these questions',
      category: 'general',
      is_public: true,
      creator_id: demoUserId
    })
    .returning('id')
    .executeTakeFirst()

  if (quizSet1) {
    await db
      .insertInto('quiz_questions')
      .values([
        {
          quiz_set_id: quizSet1.id,
          question_text: 'What is the capital of France?',
          correct_answer: 'Paris',
          wrong_answer1: 'London',
          wrong_answer2: 'Berlin',
          wrong_answer3: 'Madrid',
          order_index: 1
        },
        {
          quiz_set_id: quizSet1.id,
          question_text: 'What is 2 + 2?',
          correct_answer: '4',
          wrong_answer1: '3',
          wrong_answer2: '5',
          wrong_answer3: '22',
          order_index: 2
        },
        {
          quiz_set_id: quizSet1.id,
          question_text: 'Which planet is known as the Red Planet?',
          correct_answer: 'Mars',
          wrong_answer1: 'Venus',
          wrong_answer2: 'Jupiter',
          wrong_answer3: 'Saturn',
          order_index: 3
        }
      ])
      .execute()
  }

  const quizSet2 = await db
    .insertInto('quiz_sets')
    .values({
      title: 'Science Quiz',
      description: 'Challenge yourself with science questions',
      category: 'science',
      is_public: true,
      creator_id: demoUserId
    })
    .returning('id')
    .executeTakeFirst()

  if (quizSet2) {
    await db
      .insertInto('quiz_questions')
      .values([
        {
          quiz_set_id: quizSet2.id,
          question_text: 'What is H2O?',
          correct_answer: 'Water',
          wrong_answer1: 'Oxygen',
          wrong_answer2: 'Hydrogen',
          wrong_answer3: 'Carbon Dioxide',
          order_index: 1
        },
        {
          quiz_set_id: quizSet2.id,
          question_text: 'What is the speed of light?',
          correct_answer: '299,792,458 m/s',
          wrong_answer1: '150,000,000 m/s',
          wrong_answer2: '500,000,000 m/s',
          wrong_answer3: '100,000,000 m/s',
          order_index: 2
        }
      ])
      .execute()
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('quiz_ratings').execute()
  await db.schema.dropTable('quiz_attempts').execute()
  await db.schema.dropTable('quiz_questions').execute()
  await db.schema.dropTable('quiz_sets').execute()
  await sql`DROP TYPE quiz_category`.execute(db)
}

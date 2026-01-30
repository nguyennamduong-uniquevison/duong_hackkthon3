import type { Kysely } from 'kysely'
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create surveys table
  await db.schema
    .createTable('surveys')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('title', 'varchar(500)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('is_public', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('public_url', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create questions table
  await db.schema
    .createTable('questions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('survey_id', 'integer', (col) => col.notNull().references('surveys.id').onDelete('cascade'))
    .addColumn('question_text', 'text', (col) => col.notNull())
    .addColumn('question_type', 'varchar(50)', (col) => col.notNull()) // single_choice, multiple_choice, free_text, scale
    .addColumn('is_required', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('order_index', 'integer', (col) => col.notNull())
    .addColumn('options', 'jsonb') // For choice questions: {choices: ["option1", "option2"]}
    .addColumn('scale_config', 'jsonb') // For scale questions: {min: 1, max: 5, minLabel: "不満", maxLabel: "満足"}
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create responses table
  await db.schema
    .createTable('responses')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('survey_id', 'integer', (col) => col.notNull().references('surveys.id').onDelete('cascade'))
    .addColumn('submitted_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create answers table
  await db.schema
    .createTable('answers')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('response_id', 'integer', (col) => col.notNull().references('responses.id').onDelete('cascade'))
    .addColumn('question_id', 'integer', (col) => col.notNull().references('questions.id').onDelete('cascade'))
    .addColumn('answer_text', 'text') // For free_text
    .addColumn('answer_choices', 'jsonb') // For single/multiple choice: ["option1", "option2"]
    .addColumn('answer_scale', 'integer') // For scale questions
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create indexes
  await db.schema.createIndex('idx_surveys_user_id')
    .on('surveys')
    .column('user_id')
    .execute()

  await db.schema.createIndex('idx_surveys_public_url')
    .on('surveys')
    .column('public_url')
    .execute()

  await db.schema.createIndex('idx_questions_survey_id')
    .on('questions')
    .column('survey_id')
    .execute()

  await db.schema.createIndex('idx_responses_survey_id')
    .on('responses')
    .column('survey_id')
    .execute()

  await db.schema.createIndex('idx_answers_response_id')
    .on('answers')
    .column('response_id')
    .execute()

  await db.schema.createIndex('idx_answers_question_id')
    .on('answers')
    .column('question_id')
    .execute()

  // Insert test accounts
  const passwordHash = '$2b$10$TIMlZeMFkb9hYdp8EtHPTutZ/vXQEHG.CyAoJ/GF/W7LXS103hltS'
  
  await db
    .insertInto('users')
    .values([
      { name: 'Test User 1', email: 'test1@example.com', password_hash: passwordHash, active: true },
      { name: 'Test User 2', email: 'test2@example.com', password_hash: passwordHash, active: true }
    ])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_answers_question_id').execute()
  await db.schema.dropIndex('idx_answers_response_id').execute()
  await db.schema.dropIndex('idx_responses_survey_id').execute()
  await db.schema.dropIndex('idx_questions_survey_id').execute()
  await db.schema.dropIndex('idx_surveys_public_url').execute()
  await db.schema.dropIndex('idx_surveys_user_id').execute()
  
  await db.schema.dropTable('answers').execute()
  await db.schema.dropTable('responses').execute()
  await db.schema.dropTable('questions').execute()
  await db.schema.dropTable('surveys').execute()
}

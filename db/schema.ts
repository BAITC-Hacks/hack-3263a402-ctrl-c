import {sqliteTable,text,integer,index,uniqueIndex} from "drizzle-orm/sqlite-core";
export const courses=sqliteTable("courses",{id:text("id").primaryKey(),owner:text("owner").notNull(),data:text("data").notNull(),createdAt:integer("created_at").notNull()},t=>[index("courses_owner").on(t.owner)]);
export const attempts=sqliteTable("attempts",{id:text("id").primaryKey(),owner:text("owner").notNull(),courseId:text("course_id").notNull(),lessonId:text("lesson_id").notNull(),questionKey:text("question_key").notNull(),answer:text("answer").notNull(),correct:integer("correct").notNull(),resolved:integer("resolved").notNull().default(0),snapshot:text("snapshot").notNull(),remediateFor:text("remediate_for"),createdAt:integer("created_at").notNull()},t=>[index("attempts_owner_course").on(t.owner,t.courseId)]);
export const projects=sqliteTable("projects",{id:text("id").primaryKey(),owner:text("owner").notNull(),courseId:text("course_id").notNull(),levelId:text("level_id").notNull(),body:text("body").notNull(),status:text("status").notNull(),feedback:text("feedback").notNull(),createdAt:integer("created_at").notNull()},t=>[uniqueIndex("projects_owner_course_level").on(t.owner,t.courseId,t.levelId)]);
export const chats=sqliteTable("chats",{id:text("id").primaryKey(),owner:text("owner").notNull(),attemptId:text("attempt_id").notNull(),role:text("role").notNull(),body:text("body").notNull(),createdAt:integer("created_at").notNull()},t=>[index("chats_owner_attempt").on(t.owner,t.attemptId,t.createdAt)]);
export const aiUsage=sqliteTable("ai_usage",{id:text("id").primaryKey(),count:integer("count").notNull()});
export const xpEvents=sqliteTable("xp_events",{id:text("id").primaryKey(),owner:text("owner").notNull(),eventKey:text("event_key").notNull(),courseId:text("course_id").notNull(),subject:text("subject").notNull(),points:integer("points").notNull(),label:text("label").notNull(),createdAt:integer("created_at").notNull()},t=>[uniqueIndex("xp_owner_event").on(t.owner,t.eventKey),index("xp_owner_course").on(t.owner,t.courseId)]);
export const cardDecks=sqliteTable("card_decks",{id:text("id").primaryKey(),owner:text("owner").notNull(),courseId:text("course_id").notNull(),lessonId:text("lesson_id").notNull(),data:text("data").notNull(),createdAt:integer("created_at").notNull()},t=>[uniqueIndex("decks_owner_lesson").on(t.owner,t.courseId,t.lessonId)]);
export const cardReviews=sqliteTable("card_reviews",{id:text("id").primaryKey(),owner:text("owner").notNull(),courseId:text("course_id").notNull(),lessonId:text("lesson_id").notNull(),cardId:text("card_id").notNull(),nextReviewAt:integer("next_review_at").notNull(),stage:integer("stage").notNull().default(0),successfulReviews:integer("successful_reviews").notNull().default(0),lastCorrect:integer("last_correct").notNull().default(0),lastReviewAt:integer("last_review_at").notNull(),revision:integer("revision").notNull().default(1),lastReviewId:text("last_review_id").notNull()},t=>[uniqueIndex("review_owner_card").on(t.owner,t.courseId,t.lessonId,t.cardId),index("review_owner_due").on(t.owner,t.nextReviewAt)]);

export const accounts=sqliteTable("accounts",{
 id:text("id").primaryKey(),username:text("username").notNull(),passwordHash:text("password_hash").notNull(),
 ownerId:text("owner_id").notNull(),legacyId:text("legacy_id"),createdAt:integer("created_at").notNull(),
},t=>[uniqueIndex("accounts_username").on(t.username),uniqueIndex("accounts_owner").on(t.ownerId),uniqueIndex("accounts_legacy").on(t.legacyId)]);
export const authSessions=sqliteTable("auth_sessions",{
 tokenHash:text("token_hash").primaryKey(),accountId:text("account_id").notNull().references(()=>accounts.id,{onDelete:"cascade"}),
 createdAt:integer("created_at").notNull(),expiresAt:integer("expires_at").notNull(),
},t=>[index("auth_sessions_account").on(t.accountId),index("auth_sessions_expiry").on(t.expiresAt)]);
export const authLimits=sqliteTable("auth_limits",{
 key:text("key").primaryKey(),count:integer("count").notNull(),expiresAt:integer("expires_at").notNull(),
},t=>[index("auth_limits_expiry").on(t.expiresAt)]);

import { sql } from 'drizzle-orm';import { sql } from 'drizzle-orm';

import { relations } from 'drizzle-orm';import { relations } from 'drizzle-orm';

import {import {

  index,  index,

  uniqueIndex,  uniqueIndex,

  jsonb,  jsonb,

  pgTable,  pgTable,

  timestamp,  timestamp,

  varchar,  varchar,

  text,  text,

  integer,  integer,

  boolean,  boolean,

  pgEnum,  pgEnum,

  decimal,  decimal,

} from "drizzle-orm/pg-core";} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";import { createInsertSchema } from "drizzle-zod";

import { z } from "zod";import { z } from "zod";



// Enums with snake_case// Enums

export const user_role_enum = pgEnum('user_role', ['teacher', 'student', 'super_user']);export const userRoleEnum = pgEnum('user_role', ['teacher', 'student', 'super_user']);

export const payment_status_enum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'cancelled']);export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'cancelled']);

export const subject_enum = pgEnum('subject', ['math', 'higher_math', 'science']);export const subjectEnum = pgEnum('subject', ['math', 'higher_math', 'science']);

export const attendance_status_enum = pgEnum("attendance_status", ["present", "excused", "absent"]);export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "excused", "absent"]);

export const sms_type_enum = pgEnum('sms_type', ['attendance', 'exam_result', 'exam_notification', 'notice', 'reminder']);export const smsTypeEnum = pgEnum('sms_type', ['attendance', 'exam_result', 'exam_notification', 'notice', 'reminder']);

export const batch_status_enum = pgEnum('batch_status', ['active', 'inactive', 'completed']);export const batchStatusEnum = pgEnum('batch_status', ['active', 'inactive', 'completed']);

export const online_exam_status_enum = pgEnum('online_exam_status', ['draft', 'published', 'archived']);

export const option_enum = pgEnum('option_enum', ['A', 'B', 'C', 'D']);// Session storage table

export const sessions = pgTable(

// Session storage table  "sessions",

export const sessions = pgTable(  {

  "sessions",    sid: varchar("sid").primaryKey(),

  {    sess: jsonb("sess").notNull(),

    sid: varchar("sid").primaryKey(),    expire: timestamp("expire").notNull(),

    sess: jsonb("sess").notNull(),  },

    expire: timestamp("expire").notNull(),  (table) => [index("IDX_session_expire").on(table.expire)],

  },);

  (table) => [index("idx_session_expire").on(table.expire)],

);// Batches table

export const batches = pgTable("batches", {

// Batches table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const batches = pgTable("batches", {  name: varchar("name").notNull(),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  subject: subjectEnum("subject").notNull(),

  name: varchar("name").notNull(),  batchCode: varchar("batch_code").notNull().unique(),

  subject: subject_enum("subject").notNull(),  password: varchar("password").notNull(),

  batch_code: varchar("batch_code").notNull().unique(),  maxStudents: integer("max_students").default(50),

  password: varchar("password").notNull(),  currentStudents: integer("current_students").default(0),

  max_students: integer("max_students").default(50),  startDate: timestamp("start_date"),

  current_students: integer("current_students").default(0),  endDate: timestamp("end_date"),

  start_date: timestamp("start_date"),  classTime: varchar("class_time"),

  end_date: timestamp("end_date"),  classDays: text("class_days"),

  class_time: varchar("class_time"),  schedule: text("schedule"),

  class_days: text("class_days"),  status: batchStatusEnum("status").notNull().default('active'),

  schedule: text("schedule"),  createdBy: varchar("created_by").notNull(),

  status: batch_status_enum("status").notNull().default('active'),  createdAt: timestamp("created_at").defaultNow(),

  created_by: varchar("created_by").notNull(),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Users table

export const users = pgTable("users", {

// Users table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const users = pgTable("users", {  username: varchar("username"),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  password: varchar("password"),

  username: varchar("username"),  firstName: varchar("first_name"),

  password: varchar("password"),  lastName: varchar("last_name"),

  first_name: varchar("first_name"),  profileImageUrl: varchar("profile_image_url"),

  last_name: varchar("last_name"),  role: userRoleEnum("role").notNull().default('student'),

  profile_image_url: varchar("profile_image_url"),  email: varchar("email"),

  role: user_role_enum("role").notNull().default('student'),  smsCount: integer("sms_count").default(0),

  email: varchar("email"),  studentId: varchar("student_id"),

  sms_count: integer("sms_count").default(0),  phoneNumber: varchar("phone_number"),

  student_id: varchar("student_id"),  studentPassword: varchar("student_password"),

  phone_number: varchar("phone_number"),  address: text("address"),

  student_password: varchar("student_password"),  dateOfBirth: timestamp("date_of_birth"),

  address: text("address"),  gender: varchar("gender"),

  date_of_birth: timestamp("date_of_birth"),  institution: varchar("institution"),

  gender: varchar("gender"),  classLevel: varchar("class_level"),

  institution: varchar("institution"),  batchId: varchar("batch_id"),

  class_level: varchar("class_level"),  admissionDate: timestamp("admission_date"),

  batch_id: varchar("batch_id"),  isActive: boolean("is_active").default(true),

  admission_date: timestamp("admission_date"),  lastLogin: timestamp("last_login"),

  is_active: boolean("is_active").default(true),  createdAt: timestamp("created_at").defaultNow(),

  last_login: timestamp("last_login"),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Exams table

export const exams = pgTable("exams", {

// Exams table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const exams = pgTable("exams", {  title: varchar("title").notNull(),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  subject: subjectEnum("subject").notNull(),

  title: varchar("title").notNull(),  chapter: varchar("chapter"),

  subject: subject_enum("subject").notNull(),  targetClass: varchar("target_class"),

  chapter: varchar("chapter"),  description: text("description"),

  target_class: varchar("target_class"),  instructions: text("instructions"),

  description: text("description"),  examDate: timestamp("exam_date"),

  instructions: text("instructions"),  duration: integer("duration").notNull(),

  exam_date: timestamp("exam_date"),  examType: varchar("exam_type").notNull(),

  duration: integer("duration").notNull(),  examMode: varchar("exam_mode").notNull(),

  exam_type: varchar("exam_type").notNull(),  batchId: varchar("batch_id").references(() => batches.id),

  exam_mode: varchar("exam_mode").notNull(),  targetStudents: jsonb("target_students"),

  batch_id: varchar("batch_id").references(() => batches.id),  questionSource: varchar("question_source"),

  target_students: jsonb("target_students"),  questionContent: text("question_content"),

  question_source: varchar("question_source"),  questionPaperImage: text("question_paper_image"),

  question_content: text("question_content"),  totalMarks: integer("total_marks").default(0),

  question_paper_image: text("question_paper_image"),  isActive: boolean("is_active").default(true),

  total_marks: integer("total_marks").default(0),  createdBy: varchar("created_by").notNull().references(() => users.id),

  is_active: boolean("is_active").default(true),  createdAt: timestamp("created_at").defaultNow(),

  created_by: varchar("created_by").notNull().references(() => users.id),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Questions table

export const questions = pgTable("questions", {

// Questions table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const questions = pgTable("questions", {  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  questionText: text("question_text").notNull(),

  exam_id: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),  questionType: varchar("question_type").notNull(),

  question_text: text("question_text").notNull(),  options: jsonb("options"),

  question_type: varchar("question_type").notNull(),  correctAnswer: varchar("correct_answer"),

  options: jsonb("options"),  questionImage: text("question_image"),

  correct_answer: varchar("correct_answer"),  driveLink: text("drive_link"),

  question_image: text("question_image"),  marks: integer("marks").notNull().default(1),

  drive_link: text("drive_link"),  orderIndex: integer("order_index").notNull(),

  marks: integer("marks").notNull().default(1),  createdAt: timestamp("created_at").defaultNow(),

  order_index: integer("order_index").notNull(),});

  created_at: timestamp("created_at").defaultNow(),

});// Exam submissions table

export const examSubmissions = pgTable("exam_submissions", {

// Exam submissions table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const exam_submissions = pgTable("exam_submissions", {  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  studentId: varchar("student_id").notNull().references(() => users.id),

  exam_id: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),  answers: jsonb("answers"),

  student_id: varchar("student_id").notNull().references(() => users.id),  score: integer("score"),

  answers: jsonb("answers"),  manualMarks: integer("manual_marks"),

  score: integer("score"),  totalMarks: integer("total_marks"),

  manual_marks: integer("manual_marks"),  percentage: integer("percentage"),

  total_marks: integer("total_marks"),  rank: integer("rank"),

  percentage: integer("percentage"),  isSubmitted: boolean("is_submitted").default(false),

  rank: integer("rank"),  submittedAt: timestamp("submitted_at"),

  is_submitted: boolean("is_submitted").default(false),  timeSpent: integer("time_spent"),

  submitted_at: timestamp("submitted_at"),  feedback: text("feedback"),

  time_spent: integer("time_spent"),  createdAt: timestamp("created_at").defaultNow(),

  feedback: text("feedback"),});

  created_at: timestamp("created_at").defaultNow(),

});// Attendance table

export const attendance = pgTable("attendance", {

// Attendance table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const attendance = pgTable("attendance", {  studentId: varchar("student_id").notNull().references(() => users.id),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  batchId: varchar("batch_id").notNull().references(() => batches.id),

  student_id: varchar("student_id").notNull().references(() => users.id),  date: timestamp("date").notNull(),

  batch_id: varchar("batch_id").notNull().references(() => batches.id),  attendanceStatus: attendanceStatusEnum("attendance_status").notNull().default("present"),

  date: timestamp("date").notNull(),  subject: subjectEnum("subject"),

  attendance_status: attendance_status_enum("attendance_status").notNull().default("present"),  notes: text("notes"),

  subject: subject_enum("subject"),  markedBy: varchar("marked_by").notNull().references(() => users.id),

  notes: text("notes"),  markedAt: timestamp("marked_at").defaultNow(),

  marked_by: varchar("marked_by").notNull().references(() => users.id),  createdAt: timestamp("created_at").defaultNow(),

  marked_at: timestamp("marked_at").defaultNow(),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Student fees table

export const studentFees = pgTable("student_fees", {

// Student fees table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const student_fees = pgTable("student_fees", {  studentId: varchar("student_id").notNull().references(() => users.id),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  batchId: varchar("batch_id").notNull().references(() => batches.id),

  student_id: varchar("student_id").notNull().references(() => users.id),  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  batch_id: varchar("batch_id").notNull().references(() => batches.id),  month: varchar("month").notNull(),

  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),  year: integer("year").notNull(),

  month: varchar("month").notNull(),  status: paymentStatusEnum("status").notNull().default('pending'),

  year: integer("year").notNull(),  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),

  status: payment_status_enum("status").notNull().default('pending'),  paidDate: timestamp("paid_date"),

  paid_amount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),  dueDate: timestamp("due_date"),

  paid_date: timestamp("paid_date"),  notes: text("notes"),

  due_date: timestamp("due_date"),  createdBy: varchar("created_by").notNull().references(() => users.id),

  notes: text("notes"),  createdAt: timestamp("created_at").defaultNow(),

  created_by: varchar("created_by").notNull().references(() => users.id),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),}, (table) => ({

  updated_at: timestamp("updated_at").defaultNow(),  uniqueStudentMonthYear: uniqueIndex("unique_student_month_year").on(table.studentId, table.batchId, table.month, table.year),

}, (table) => ({}));

  unique_student_month_year: uniqueIndex("unique_student_month_year").on(table.student_id, table.batch_id, table.month, table.year),

}));// SMS logs table

export const smsLogs = pgTable("sms_logs", {

// SMS logs table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const sms_logs = pgTable("sms_logs", {  recipientType: varchar("recipient_type").notNull(),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  recipientPhone: varchar("recipient_phone").notNull(),

  recipient_type: varchar("recipient_type").notNull(),  recipientName: varchar("recipient_name"),

  recipient_phone: varchar("recipient_phone").notNull(),  studentId: varchar("student_id").references(() => users.id),

  recipient_name: varchar("recipient_name"),  smsType: smsTypeEnum("sms_type").notNull(),

  student_id: varchar("student_id").references(() => users.id),  subject: varchar("subject"),

  sms_type: sms_type_enum("sms_type").notNull(),  message: text("message").notNull(),

  subject: varchar("subject"),  status: varchar("status").notNull().default('pending'),

  message: text("message").notNull(),  sentBy: varchar("sent_by").notNull().references(() => users.id),

  status: varchar("status").notNull().default('pending'),  sentAt: timestamp("sent_at").defaultNow(),

  sent_by: varchar("sent_by").notNull().references(() => users.id),  createdAt: timestamp("created_at").defaultNow(),

  sent_at: timestamp("sent_at").defaultNow(),});

  created_at: timestamp("created_at").defaultNow(),

});// Question Bank table

export const questionBank = pgTable("question_bank", {

// Question Bank table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const question_bank = pgTable("question_bank", {  teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  subject: varchar("subject").notNull(),

  teacher_id: varchar("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),  category: varchar("category").notNull(),

  subject: varchar("subject").notNull(),  subCategory: varchar("sub_category").notNull(),

  category: varchar("category").notNull(),  chapter: varchar("chapter").notNull(),

  sub_category: varchar("sub_category").notNull(),  questionText: text("question_text").notNull(),

  chapter: varchar("chapter").notNull(),  questionType: varchar("question_type").notNull(),

  question_text: text("question_text").notNull(),  options: jsonb("options"),

  question_type: varchar("question_type").notNull(),  correctAnswer: varchar("correct_answer"),

  options: jsonb("options"),  questionImage: text("question_image"),

  correct_answer: varchar("correct_answer"),  driveLink: text("drive_link"),

  question_image: text("question_image"),  difficulty: varchar("difficulty").notNull().default('medium'),

  drive_link: text("drive_link"),  marks: integer("marks").notNull().default(1),

  difficulty: varchar("difficulty").notNull().default('medium'),  isPublic: boolean("is_public").notNull().default(true),

  marks: integer("marks").notNull().default(1),  createdAt: timestamp("created_at").defaultNow(),

  is_public: boolean("is_public").notNull().default(true),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Notices table

export const notices = pgTable("notices", {

// Notices table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const notices = pgTable("notices", {  title: varchar("title").notNull(),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  content: text("content").notNull(),

  title: varchar("title").notNull(),  createdBy: varchar("created_by").notNull().references(() => users.id),

  content: text("content").notNull(),  isActive: boolean("is_active").default(true),

  created_by: varchar("created_by").notNull().references(() => users.id),  createdAt: timestamp("created_at").defaultNow(),

  is_active: boolean("is_active").default(true),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Monthly Exams table - For monthly exam periods

export const monthlyExams = pgTable("monthly_exams", {

// Monthly Exams table - For monthly exam periods  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const monthly_exams = pgTable("monthly_exams", {  month: integer("month").notNull(), // 1-12

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  year: integer("year").notNull(),

  month: integer("month").notNull(), // 1-12  batchId: varchar("batch_id").notNull().references(() => batches.id),

  year: integer("year").notNull(),  title: varchar("title").notNull(),

  batch_id: varchar("batch_id").notNull().references(() => batches.id),  isFinalized: boolean("is_finalized").default(false),

  title: varchar("title").notNull(),  createdBy: varchar("created_by").notNull().references(() => users.id),

  is_finalized: boolean("is_finalized").default(false),  createdAt: timestamp("created_at").defaultNow(),

  created_by: varchar("created_by").notNull().references(() => users.id),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Individual Exams table - Individual exams within a monthly exam period

export const individualExams = pgTable("individual_exams", {

// Individual Exams table - Individual exams within a monthly exam period  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const individual_exams = pgTable("individual_exams", {  monthlyExamId: varchar("monthly_exam_id").notNull().references(() => monthlyExams.id, { onDelete: 'cascade' }),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  name: varchar("name").notNull(), // e.g., "Algebra Test", "Physics Quiz"

  monthly_exam_id: varchar("monthly_exam_id").notNull().references(() => monthly_exams.id, { onDelete: 'cascade' }),  subject: subjectEnum("subject").notNull().default('math'),

  name: varchar("name").notNull(), // e.g., "Algebra Test", "Physics Quiz"  totalMarks: integer("total_marks").notNull().default(100),

  subject: subject_enum("subject").notNull().default('math'),  createdAt: timestamp("created_at").defaultNow(),

  total_marks: integer("total_marks").notNull().default(100),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Monthly Marks table - Individual exam marks within a month

export const monthlyMarks = pgTable("monthly_marks", {

// Monthly Marks table - Individual exam marks within a month  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const monthly_marks = pgTable("monthly_marks", {  monthlyExamId: varchar("monthly_exam_id").notNull().references(() => monthlyExams.id, { onDelete: 'cascade' }),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  individualExamId: varchar("individual_exam_id").notNull().references(() => individualExams.id, { onDelete: 'cascade' }),

  monthly_exam_id: varchar("monthly_exam_id").notNull().references(() => monthly_exams.id, { onDelete: 'cascade' }),  studentId: varchar("student_id").notNull().references(() => users.id),

  individual_exam_id: varchar("individual_exam_id").notNull().references(() => individual_exams.id, { onDelete: 'cascade' }),  obtainedMarks: integer("obtained_marks").notNull(),

  student_id: varchar("student_id").notNull().references(() => users.id),  createdAt: timestamp("created_at").defaultNow(),

  obtained_marks: integer("obtained_marks").notNull(),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),}, (table) => [

  updated_at: timestamp("updated_at").defaultNow(),  uniqueIndex("unique_monthly_mark").on(table.monthlyExamId, table.individualExamId, table.studentId),

}, (table) => []);

  uniqueIndex("unique_monthly_mark").on(table.monthly_exam_id, table.individual_exam_id, table.student_id),

]);// Monthly Results table - Final calculated results with ranks

export const monthlyResults = pgTable("monthly_results", {

// Monthly Results table - Final calculated results with ranks  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const monthly_results = pgTable("monthly_results", {  monthlyExamId: varchar("monthly_exam_id").notNull().references(() => monthlyExams.id, { onDelete: 'cascade' }),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  studentId: varchar("student_id").notNull().references(() => users.id),

  monthly_exam_id: varchar("monthly_exam_id").notNull().references(() => monthly_exams.id, { onDelete: 'cascade' }),  totalExamMarks: integer("total_exam_marks").default(0), // Sum of all exam marks

  student_id: varchar("student_id").notNull().references(() => users.id),  attendanceMarks: integer("attendance_marks").default(0), // 1 mark per present day

  total_exam_marks: integer("total_exam_marks").default(0), // Sum of all exam marks  bonusMarks: integer("bonus_marks").default(0), // Bonus from teacher

  attendance_marks: integer("attendance_marks").default(0), // 1 mark per present day  finalTotal: integer("final_total").default(0), // Total of all marks

  bonus_marks: integer("bonus_marks").default(0), // Bonus from teacher  rank: integer("rank"),

  final_total: integer("final_total").default(0), // Total of all marks  percentage: decimal("percentage", { precision: 5, scale: 2 }),

  rank: integer("rank"),  gpa: decimal("gpa", { precision: 3, scale: 2 }),

  percentage: decimal("percentage", { precision: 5, scale: 2 }),  createdAt: timestamp("created_at").defaultNow(),

  gpa: decimal("gpa", { precision: 3, scale: 2 }),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),}, (table) => ({

  updated_at: timestamp("updated_at").defaultNow(),  uniqueMonthlyExamStudent: uniqueIndex("unique_monthly_exam_student").on(table.monthlyExamId, table.studentId),

}, (table) => ({}));

  unique_monthly_exam_student: uniqueIndex("unique_monthly_exam_student").on(table.monthly_exam_id, table.student_id),

}));// SMS Templates table

export const smsTemplates = pgTable("sms_templates", {

// SMS Templates table  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const sms_templates = pgTable("sms_templates", {  name: varchar("name").notNull(),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  templateType: varchar("template_type").notNull(), // 'exam_marks', 'monthly_result', 'attendance', 'custom'

  name: varchar("name").notNull(),  message: text("message").notNull(), // Can contain placeholders like {studentName}, {marks}, {totalMarks}

  template_type: varchar("template_type").notNull(), // 'exam_marks', 'monthly_result', 'attendance', 'custom'  isActive: boolean("is_active").default(true),

  message: text("message").notNull(), // Can contain placeholders like {studentName}, {marks}, {totalMarks}  createdBy: varchar("created_by").notNull().references(() => users.id),

  is_active: boolean("is_active").default(true),  createdAt: timestamp("created_at").defaultNow(),

  created_by: varchar("created_by").notNull().references(() => users.id),  updatedAt: timestamp("updated_at").defaultNow(),

  created_at: timestamp("created_at").defaultNow(),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Settings table - System settings for SMS and other configurations

export const settings = pgTable("settings", {

// Settings table - System settings for SMS and other configurations  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export const settings = pgTable("settings", {  smsCount: integer("sms_count").notNull().default(0),

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  smsApiKey: varchar("sms_api_key"),

  sms_count: integer("sms_count").notNull().default(0),  smsSenderId: varchar("sms_sender_id").default('8809617628909'),

  sms_api_key: varchar("sms_api_key"),  smsApiUrl: varchar("sms_api_url").default('http://bulksmsbd.net/api/smsapi'),

  sms_sender_id: varchar("sms_sender_id").default('8809617628909'),  updatedBy: varchar("updated_by").references(() => users.id),

  sms_api_url: varchar("sms_api_url").default('http://bulksmsbd.net/api/smsapi'),  updatedAt: timestamp("updated_at").defaultNow(),

  updated_by: varchar("updated_by").references(() => users.id),});

  updated_at: timestamp("updated_at").defaultNow(),

});// Insert schemas

export const insertUserSchema = createInsertSchema(users).omit({

// Syllabus structure for Praggo AI  id: true,

export const syllabus_classes = pgTable("syllabus_classes", {  createdAt: true,

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  updatedAt: true,

  name: varchar("name").notNull(),});

  display_name: varchar("display_name").notNull(),

  level: varchar("level").notNull(),export const insertBatchSchema = createInsertSchema(batches).omit({

  display_order: integer("display_order").notNull(),  id: true,

  created_at: timestamp("created_at").defaultNow(),  createdAt: true,

});  updatedAt: true,

});

export const syllabus_subjects = pgTable("syllabus_subjects", {

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),export const insertExamSchema = createInsertSchema(exams).omit({

  class_id: varchar("class_id").notNull().references(() => syllabus_classes.id, { onDelete: 'cascade' }),  id: true,

  name: varchar("name").notNull(),  createdAt: true,

  display_name: varchar("display_name").notNull(),  updatedAt: true,

  code: varchar("code").notNull(),});

  description: text("description"),

  display_order: integer("display_order").notNull(),export const insertQuestionSchema = createInsertSchema(questions).omit({

  created_at: timestamp("created_at").defaultNow(),  id: true,

});  createdAt: true,

});

export const syllabus_chapters = pgTable("syllabus_chapters", {

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),export const insertExamSubmissionSchema = createInsertSchema(examSubmissions).omit({

  subject_id: varchar("subject_id").notNull().references(() => syllabus_subjects.id, { onDelete: 'cascade' }),  id: true,

  title: varchar("title").notNull(),  createdAt: true,

  title_bn: varchar("title_bn"),});

  code: varchar("code"),

  sequence: integer("sequence").notNull(),export const insertAttendanceSchema = createInsertSchema(attendance).omit({

  topics: text("topics").array(),  id: true,

  created_at: timestamp("created_at").defaultNow(),  markedAt: true,

});  createdAt: true,

  updatedAt: true,

// Online Exams System});

export const online_exams = pgTable("online_exams", {

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),export const insertStudentFeeSchema = createInsertSchema(studentFees).omit({

  title: varchar("title").notNull(),  id: true,

  class_id: varchar("class_id").notNull().references(() => syllabus_classes.id),  createdAt: true,

  subject_id: varchar("subject_id").notNull().references(() => syllabus_subjects.id),  updatedAt: true,

  duration_minutes: integer("duration_minutes").notNull(),});

  max_questions: integer("max_questions").notNull().default(30),

  status: online_exam_status_enum("status").notNull().default('draft'),export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({

  created_by: varchar("created_by").notNull().references(() => users.id),  id: true,

  created_at: timestamp("created_at").defaultNow(),  createdAt: true,

  updated_at: timestamp("updated_at").defaultNow(),});

});

export const insertQuestionBankSchema = createInsertSchema(questionBank).omit({

export const exam_questions = pgTable("exam_questions", {  id: true,

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),  createdAt: true,

  exam_id: varchar("exam_id").notNull().references(() => online_exams.id, { onDelete: 'cascade' }),  updatedAt: true,

  question_text: text("question_text").notNull(),});

  option_a: text("option_a").notNull(),

  option_b: text("option_b").notNull(),export const insertNoticeSchema = createInsertSchema(notices).omit({

  option_c: text("option_c").notNull(),  id: true,

  option_d: text("option_d").notNull(),  createdAt: true,

  correct_option: option_enum("correct_option").notNull(),  updatedAt: true,

  explanation: text("explanation"),});

  order_index: integer("order_index").notNull(),

  created_at: timestamp("created_at").defaultNow(),export const insertMonthlyExamSchema = createInsertSchema(monthlyExams).omit({

});  id: true,

  createdAt: true,

export const exam_attempts = pgTable("exam_attempts", {  updatedAt: true,

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),});

  exam_id: varchar("exam_id").notNull().references(() => online_exams.id, { onDelete: 'cascade' }),

  student_id: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),export const insertIndividualExamSchema = createInsertSchema(individualExams).omit({

  attempt_number: integer("attempt_number").notNull(),  id: true,

  start_time: timestamp("start_time").notNull(),  createdAt: true,

  end_time: timestamp("end_time"),  updatedAt: true,

  score: integer("score").default(0),});

  total_questions: integer("total_questions").notNull(),

  completed: boolean("completed").default(false),export const insertMonthlyMarkSchema = createInsertSchema(monthlyMarks).omit({

  auto_submitted: boolean("auto_submitted").default(false),  id: true,

  created_at: timestamp("created_at").defaultNow(),  createdAt: true,

});  updatedAt: true,

});

export const attempt_answers = pgTable("attempt_answers", {

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),export const insertMonthlyResultSchema = createInsertSchema(monthlyResults).omit({

  attempt_id: varchar("attempt_id").notNull().references(() => exam_attempts.id, { onDelete: 'cascade' }),  id: true,

  question_id: varchar("question_id").notNull().references(() => exam_questions.id, { onDelete: 'cascade' }),  createdAt: true,

  selected_option: option_enum("selected_option"),  updatedAt: true,

  is_correct: boolean("is_correct").default(false),});

  created_at: timestamp("created_at").defaultNow(),

});export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({

  id: true,

// Insert schemas  createdAt: true,

export const insertUserSchema = createInsertSchema(users).omit({  updatedAt: true,

  id: true,});

  created_at: true,

  updated_at: true,export const insertSettingsSchema = createInsertSchema(settings).omit({

});  id: true,

  updatedAt: true,

export const insertBatchSchema = createInsertSchema(batches).omit({});

  id: true,

  created_at: true,// Types

  updated_at: true,export type InsertUser = z.infer<typeof insertUserSchema>;

});export type User = typeof users.$inferSelect;



export const insertExamSchema = createInsertSchema(exams).omit({export type InsertBatch = z.infer<typeof insertBatchSchema>;

  id: true,export type Batch = typeof batches.$inferSelect;

  created_at: true,

  updated_at: true,export type InsertExam = z.infer<typeof insertExamSchema>;

});export type Exam = typeof exams.$inferSelect;



export const insertQuestionSchema = createInsertSchema(questions).omit({export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

  id: true,export type Question = typeof questions.$inferSelect;

  created_at: true,

});export type InsertExamSubmission = z.infer<typeof insertExamSubmissionSchema>;

export type ExamSubmission = typeof examSubmissions.$inferSelect;

export const insertExamSubmissionSchema = createInsertSchema(exam_submissions).omit({

  id: true,export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

  created_at: true,export type Attendance = typeof attendance.$inferSelect;

});

export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;

export const insertAttendanceSchema = createInsertSchema(attendance).omit({export type StudentFee = typeof studentFees.$inferSelect;

  id: true,

  marked_at: true,export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;

  created_at: true,export type SmsLog = typeof smsLogs.$inferSelect;

  updated_at: true,

});export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;

export type QuestionBankItem = typeof questionBank.$inferSelect;

export const insertStudentFeeSchema = createInsertSchema(student_fees).omit({

  id: true,export type InsertNotice = z.infer<typeof insertNoticeSchema>;

  created_at: true,export type Notice = typeof notices.$inferSelect;

  updated_at: true,

});export type InsertMonthlyExam = z.infer<typeof insertMonthlyExamSchema>;

export type MonthlyExam = typeof monthlyExams.$inferSelect;

export const insertSmsLogSchema = createInsertSchema(sms_logs).omit({

  id: true,export type InsertIndividualExam = z.infer<typeof insertIndividualExamSchema>;

  created_at: true,export type IndividualExam = typeof individualExams.$inferSelect;

});

export type InsertMonthlyMark = z.infer<typeof insertMonthlyMarkSchema>;

export const insertQuestionBankSchema = createInsertSchema(question_bank).omit({export type MonthlyMark = typeof monthlyMarks.$inferSelect;

  id: true,

  created_at: true,export type InsertMonthlyResult = z.infer<typeof insertMonthlyResultSchema>;

  updated_at: true,export type MonthlyResult = typeof monthlyResults.$inferSelect;

});

export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;

export const insertNoticeSchema = createInsertSchema(notices).omit({export type SmsTemplate = typeof smsTemplates.$inferSelect;

  id: true,

  created_at: true,export type InsertSettings = z.infer<typeof insertSettingsSchema>;

  updated_at: true,export type Settings = typeof settings.$inferSelect;

});

// Relations

export const insertMonthlyExamSchema = createInsertSchema(monthly_exams).omit({export const usersRelations = relations(users, ({ one, many }) => ({

  id: true,  batch: one(batches, {

  created_at: true,    fields: [users.batchId],

  updated_at: true,    references: [batches.id],

});  }),

  examSubmissions: many(examSubmissions),

export const insertIndividualExamSchema = createInsertSchema(individual_exams).omit({  attendance: many(attendance),

  id: true,  fees: many(studentFees),

  created_at: true,}));

  updated_at: true,

});export const batchesRelations = relations(batches, ({ many }) => ({

  students: many(users),

export const insertMonthlyMarkSchema = createInsertSchema(monthly_marks).omit({  exams: many(exams),

  id: true,  attendance: many(attendance),

  created_at: true,  fees: many(studentFees),

  updated_at: true,}));

});

export const examsRelations = relations(exams, ({ one, many }) => ({

export const insertMonthlyResultSchema = createInsertSchema(monthly_results).omit({  batch: one(batches, {

  id: true,    fields: [exams.batchId],

  created_at: true,    references: [batches.id],

  updated_at: true,  }),

});  questions: many(questions),

  submissions: many(examSubmissions),

export const insertSmsTemplateSchema = createInsertSchema(sms_templates).omit({}));

  id: true,

  created_at: true,export const questionsRelations = relations(questions, ({ one }) => ({

  updated_at: true,  exam: one(exams, {

});    fields: [questions.examId],

    references: [exams.id],

export const insertSettingsSchema = createInsertSchema(settings).omit({  }),

  id: true,}));

  updated_at: true,

});export const examSubmissionsRelations = relations(examSubmissions, ({ one }) => ({

  exam: one(exams, {

export const insertSyllabusClassSchema = createInsertSchema(syllabus_classes).omit({    fields: [examSubmissions.examId],

  id: true,    references: [exams.id],

  created_at: true,  }),

});  student: one(users, {

    fields: [examSubmissions.studentId],

export const insertSyllabusSubjectSchema = createInsertSchema(syllabus_subjects).omit({    references: [users.id],

  id: true,  }),

  created_at: true,}));

});

export const attendanceRelations = relations(attendance, ({ one }) => ({

export const insertSyllabusChapterSchema = createInsertSchema(syllabus_chapters).omit({  student: one(users, {

  id: true,    fields: [attendance.studentId],

  created_at: true,    references: [users.id],

});  }),

  batch: one(batches, {

export const insertOnlineExamSchema = createInsertSchema(online_exams).omit({    fields: [attendance.batchId],

  id: true,    references: [batches.id],

  created_at: true,  }),

  updated_at: true,}));

});

export const studentFeesRelations = relations(studentFees, ({ one }) => ({

export const insertExamQuestionSchema = createInsertSchema(exam_questions).omit({  student: one(users, {

  id: true,    fields: [studentFees.studentId],

  created_at: true,    references: [users.id],

});  }),

  batch: one(batches, {

export const insertExamAttemptSchema = createInsertSchema(exam_attempts).omit({    fields: [studentFees.batchId],

  id: true,    references: [batches.id],

  created_at: true,  }),

});}));



export const insertAttemptAnswerSchema = createInsertSchema(attempt_answers).omit({// Syllabus structure for Praggo AI

  id: true,export const syllabusClasses = pgTable("syllabus_classes", {

  created_at: true,  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

});  name: varchar("name").notNull(),

  displayName: varchar("display_name").notNull(),

// Types  level: varchar("level").notNull(),

export type InsertUser = z.infer<typeof insertUserSchema>;  displayOrder: integer("display_order").notNull(),

export type User = typeof users.$inferSelect;  createdAt: timestamp("created_at").defaultNow(),

});

export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Batch = typeof batches.$inferSelect;export const syllabusSubjects = pgTable("syllabus_subjects", {

  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export type InsertExam = z.infer<typeof insertExamSchema>;  classId: varchar("class_id").notNull().references(() => syllabusClasses.id, { onDelete: 'cascade' }),

export type Exam = typeof exams.$inferSelect;  name: varchar("name").notNull(),

  displayName: varchar("display_name").notNull(),

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;  code: varchar("code").notNull(),

export type Question = typeof questions.$inferSelect;  description: text("description"),

  displayOrder: integer("display_order").notNull(),

export type InsertExamSubmission = z.infer<typeof insertExamSubmissionSchema>;  createdAt: timestamp("created_at").defaultNow(),

export type ExamSubmission = typeof exam_submissions.$inferSelect;});



export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;export const syllabusChapters = pgTable("syllabus_chapters", {

export type Attendance = typeof attendance.$inferSelect;  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  subjectId: varchar("subject_id").notNull().references(() => syllabusSubjects.id, { onDelete: 'cascade' }),

export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;  title: varchar("title").notNull(),

export type StudentFee = typeof student_fees.$inferSelect;  titleBn: varchar("title_bn"),

  code: varchar("code"),

export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;  sequence: integer("sequence").notNull(),

export type SmsLog = typeof sms_logs.$inferSelect;  topics: text("topics").array(),

  createdAt: timestamp("created_at").defaultNow(),

export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;});

export type QuestionBankItem = typeof question_bank.$inferSelect;

// Insert schemas for syllabus tables

export type InsertNotice = z.infer<typeof insertNoticeSchema>;export const insertSyllabusClassSchema = createInsertSchema(syllabusClasses).omit({

export type Notice = typeof notices.$inferSelect;  id: true,

  createdAt: true,

export type InsertMonthlyExam = z.infer<typeof insertMonthlyExamSchema>;});

export type MonthlyExam = typeof monthly_exams.$inferSelect;

export const insertSyllabusSubjectSchema = createInsertSchema(syllabusSubjects).omit({

export type InsertIndividualExam = z.infer<typeof insertIndividualExamSchema>;  id: true,

export type IndividualExam = typeof individual_exams.$inferSelect;  createdAt: true,

});

export type InsertMonthlyMark = z.infer<typeof insertMonthlyMarkSchema>;

export type MonthlyMark = typeof monthly_marks.$inferSelect;export const insertSyllabusChapterSchema = createInsertSchema(syllabusChapters).omit({

  id: true,

export type InsertMonthlyResult = z.infer<typeof insertMonthlyResultSchema>;  createdAt: true,

export type MonthlyResult = typeof monthly_results.$inferSelect;});



export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;// Types for syllabus

export type SmsTemplate = typeof sms_templates.$inferSelect;export type SyllabusClass = typeof syllabusClasses.$inferSelect;

export type InsertSyllabusClass = z.infer<typeof insertSyllabusClassSchema>;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type Settings = typeof settings.$inferSelect;export type SyllabusSubject = typeof syllabusSubjects.$inferSelect;

export type InsertSyllabusSubject = z.infer<typeof insertSyllabusSubjectSchema>;

export type SyllabusClass = typeof syllabus_classes.$inferSelect;

export type InsertSyllabusClass = z.infer<typeof insertSyllabusClassSchema>;export type SyllabusChapter = typeof syllabusChapters.$inferSelect;

export type InsertSyllabusChapter = z.infer<typeof insertSyllabusChapterSchema>;

export type SyllabusSubject = typeof syllabus_subjects.$inferSelect;

export type InsertSyllabusSubject = z.infer<typeof insertSyllabusSubjectSchema>;// Online Exams System

export const onlineExamStatusEnum = pgEnum('online_exam_status', ['draft', 'published', 'archived']);

export type SyllabusChapter = typeof syllabus_chapters.$inferSelect;export const optionEnum = pgEnum('option_enum', ['A', 'B', 'C', 'D']);

export type InsertSyllabusChapter = z.infer<typeof insertSyllabusChapterSchema>;

export const onlineExams = pgTable("online_exams", {

export type OnlineExam = typeof online_exams.$inferSelect;  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

export type InsertOnlineExam = z.infer<typeof insertOnlineExamSchema>;  title: varchar("title").notNull(),

  classId: varchar("class_id").notNull().references(() => syllabusClasses.id),

export type ExamQuestion = typeof exam_questions.$inferSelect;  subjectId: varchar("subject_id").notNull().references(() => syllabusSubjects.id),

export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;  durationMinutes: integer("duration_minutes").notNull(),

  maxQuestions: integer("max_questions").notNull().default(30),

export type ExamAttempt = typeof exam_attempts.$inferSelect;  status: onlineExamStatusEnum("status").notNull().default('draft'),

export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;  createdBy: varchar("created_by").notNull().references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),

export type AttemptAnswer = typeof attempt_answers.$inferSelect;  updatedAt: timestamp("updated_at").defaultNow(),

export type InsertAttemptAnswer = z.infer<typeof insertAttemptAnswerSchema>;});



// Relationsexport const examQuestions = pgTable("exam_questions", {

export const usersRelations = relations(users, ({ one, many }) => ({  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  batch: one(batches, {  examId: varchar("exam_id").notNull().references(() => onlineExams.id, { onDelete: 'cascade' }),

    fields: [users.batch_id],  questionText: text("question_text").notNull(),

    references: [batches.id],  optionA: text("option_a").notNull(),

  }),  optionB: text("option_b").notNull(),

  exam_submissions: many(exam_submissions),  optionC: text("option_c").notNull(),

  attendance: many(attendance),  optionD: text("option_d").notNull(),

  fees: many(student_fees),  correctOption: optionEnum("correct_option").notNull(),

}));  explanation: text("explanation"),

  orderIndex: integer("order_index").notNull(),

export const batchesRelations = relations(batches, ({ many }) => ({  createdAt: timestamp("created_at").defaultNow(),

  students: many(users),});

  exams: many(exams),

  attendance: many(attendance),export const examAttempts = pgTable("exam_attempts", {

  fees: many(student_fees),  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

}));  examId: varchar("exam_id").notNull().references(() => onlineExams.id, { onDelete: 'cascade' }),

  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),

export const examsRelations = relations(exams, ({ one, many }) => ({  attemptNumber: integer("attempt_number").notNull(),

  batch: one(batches, {  startTime: timestamp("start_time").notNull(),

    fields: [exams.batch_id],  endTime: timestamp("end_time"),

    references: [batches.id],  score: integer("score").default(0),

  }),  totalQuestions: integer("total_questions").notNull(),

  questions: many(questions),  completed: boolean("completed").default(false),

  submissions: many(exam_submissions),  autoSubmitted: boolean("auto_submitted").default(false),

}));  createdAt: timestamp("created_at").defaultNow(),

});

export const questionsRelations = relations(questions, ({ one }) => ({

  exam: one(exams, {export const attemptAnswers = pgTable("attempt_answers", {

    fields: [questions.exam_id],  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

    references: [exams.id],  attemptId: varchar("attempt_id").notNull().references(() => examAttempts.id, { onDelete: 'cascade' }),

  }),  questionId: varchar("question_id").notNull().references(() => examQuestions.id, { onDelete: 'cascade' }),

}));  selectedOption: optionEnum("selected_option"),

  isCorrect: boolean("is_correct").default(false),

export const examSubmissionsRelations = relations(exam_submissions, ({ one }) => ({  createdAt: timestamp("created_at").defaultNow(),

  exam: one(exams, {});

    fields: [exam_submissions.exam_id],

    references: [exams.id],// Insert schemas for online exams

  }),export const insertOnlineExamSchema = createInsertSchema(onlineExams).omit({

  student: one(users, {  id: true,

    fields: [exam_submissions.student_id],  createdAt: true,

    references: [users.id],  updatedAt: true,

  }),});

}));

export const insertExamQuestionSchema = createInsertSchema(examQuestions).omit({

export const attendanceRelations = relations(attendance, ({ one }) => ({  id: true,

  student: one(users, {  createdAt: true,

    fields: [attendance.student_id],});

    references: [users.id],

  }),export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({

  batch: one(batches, {  id: true,

    fields: [attendance.batch_id],  createdAt: true,

    references: [batches.id],});

  }),

}));export const insertAttemptAnswerSchema = createInsertSchema(attemptAnswers).omit({

  id: true,

export const studentFeesRelations = relations(student_fees, ({ one }) => ({  createdAt: true,

  student: one(users, {});

    fields: [student_fees.student_id],

    references: [users.id],// Types for online exams

  }),export type OnlineExam = typeof onlineExams.$inferSelect;

  batch: one(batches, {export type InsertOnlineExam = z.infer<typeof insertOnlineExamSchema>;

    fields: [student_fees.batch_id],

    references: [batches.id],export type ExamQuestion = typeof examQuestions.$inferSelect;

  }),export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;

}));

export type ExamAttempt = typeof examAttempts.$inferSelect;

export const syllabusClassesRelations = relations(syllabus_classes, ({ many }) => ({export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;

  subjects: many(syllabus_subjects),

}));export type AttemptAnswer = typeof attemptAnswers.$inferSelect;

export type InsertAttemptAnswer = z.infer<typeof insertAttemptAnswerSchema>;

export const syllabusSubjectsRelations = relations(syllabus_subjects, ({ one, many }) => ({

  class: one(syllabus_classes, {// Relations

    fields: [syllabus_subjects.class_id],export const syllabusClassesRelations = relations(syllabusClasses, ({ many }) => ({

    references: [syllabus_classes.id],  subjects: many(syllabusSubjects),

  }),}));

  chapters: many(syllabus_chapters),

}));export const syllabusSubjectsRelations = relations(syllabusSubjects, ({ one, many }) => ({

  class: one(syllabusClasses, {

export const syllabusChaptersRelations = relations(syllabus_chapters, ({ one }) => ({    fields: [syllabusSubjects.classId],

  subject: one(syllabus_subjects, {    references: [syllabusClasses.id],

    fields: [syllabus_chapters.subject_id],  }),

    references: [syllabus_subjects.id],  chapters: many(syllabusChapters),

  }),}));

}));
export const syllabusChaptersRelations = relations(syllabusChapters, ({ one }) => ({
  subject: one(syllabusSubjects, {
    fields: [syllabusChapters.subjectId],
    references: [syllabusSubjects.id],
  }),
}));

import { MigrationInterface, QueryRunner } from 'typeorm';

export class PodcastsCoursesNewsletters1785900100000 implements MigrationInterface {
  name = 'PodcastsCoursesNewsletters1785900100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Podcasts
    await queryRunner.query(`
      CREATE TABLE "podcasts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying(500) NOT NULL, "description" text NOT NULL, "coverImage" character varying, "audioUrl" character varying, "durationSeconds" integer NOT NULL DEFAULT 0, "authorId" uuid, "status" character varying NOT NULL DEFAULT 'draft', "tags" character varying[] array, "playCount" integer NOT NULL DEFAULT 0, "likeCount" integer NOT NULL DEFAULT 0, "commentCount" integer NOT NULL DEFAULT 0, "isGated" boolean NOT NULL DEFAULT false, "tokenPrice" numeric(10,2), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_podcasts_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_podcasts_slug" UNIQUE ("slug"), CONSTRAINT "FK_podcasts_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE)
    `);
    await queryRunner.query(`CREATE INDEX "IDX_podcasts_slug" ON "podcasts" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_podcasts_status" ON "podcasts" ("status")`);

    // Courses
    await queryRunner.query(`
      CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying(500) NOT NULL, "description" text NOT NULL, "coverImage" character varying, "curriculum" text, "authorId" uuid, "status" character varying NOT NULL DEFAULT 'draft', "enrollmentCount" integer NOT NULL DEFAULT 0, "lessonCount" integer NOT NULL DEFAULT 0, "isGated" boolean NOT NULL DEFAULT false, "price" numeric(10,2), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_courses_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_courses_slug" UNIQUE ("slug"), CONSTRAINT "FK_courses_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE)
    `);
    await queryRunner.query(`CREATE INDEX "IDX_courses_slug" ON "courses" ("slug")`);

    // Course Lessons
    await queryRunner.query(`
      CREATE TABLE "course_lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "title" character varying(500) NOT NULL, "content" text NOT NULL, "orderIndex" integer NOT NULL, "durationMinutes" integer NOT NULL DEFAULT 0, "videoUrl" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_course_lessons_id" PRIMARY KEY ("id"), CONSTRAINT "FK_course_lessons_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE)
    `);

    // Course Enrollments
    await queryRunner.query(`
      CREATE TABLE "course_enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "userId" uuid NOT NULL, "progress" integer NOT NULL DEFAULT 0, "completedLessons" character varying[] array, "isCompleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_course_enrollments_id" PRIMARY KEY ("id"), CONSTRAINT "FK_course_enrollments_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE, CONSTRAINT "FK_course_enrollments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE)
    `);

    // Newsletters
    await queryRunner.query(`
      CREATE TABLE "newsletters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying(500) NOT NULL, "content" text NOT NULL, "excerpt" text, "coverImage" character varying, "authorId" uuid, "status" character varying NOT NULL DEFAULT 'draft', "scheduledAt" TIMESTAMP WITH TIME ZONE, "sentAt" TIMESTAMP WITH TIME ZONE, "subscriberCount" integer NOT NULL DEFAULT 0, "openCount" integer NOT NULL DEFAULT 0, "clickCount" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_newsletters_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_newsletters_slug" UNIQUE ("slug"), CONSTRAINT "FK_newsletters_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE)
    `);

    // Newsletter Subscribers
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscribers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "userId" uuid, "subscribedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_newsletter_subscribers_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE ("email"), CONSTRAINT "FK_newsletter_subscribers_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL)
    `);

    // Newsletter Subscriptions (author-subscriber mapping)
    await queryRunner.query(`
      CREATE TABLE "newsletter_newslettersubscribers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authorId" uuid NOT NULL, "subscriberId" uuid NOT NULL, "subscribedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_newsletter_newslettersubscribers_id" PRIMARY KEY ("id"), CONSTRAINT "FK_nns_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_nns_subscriberId" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "newsletter_newslettersubscribers"`);
    await queryRunner.query(`DROP TABLE "newsletter_subscribers"`);
    await queryRunner.query(`DROP TABLE "newsletters"`);
    await queryRunner.query(`DROP TABLE "course_enrollments"`);
    await queryRunner.query(`DROP TABLE "course_lessons"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "podcasts"`);
  }
}

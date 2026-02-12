--
-- PostgreSQL database dump
--

\restrict KKR3gJFG0ud2klA1WEyE6CyFRTp6A3w9CIpCm1l8hYTTSI8bSoCvfyV9H1FgUpl

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: FinancialEntryType; Type: TYPE; Schema: public; Owner: mustafa
--

CREATE TYPE public."FinancialEntryType" AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public."FinancialEntryType" OWNER TO mustafa;

--
-- Name: IssueStatus; Type: TYPE; Schema: public; Owner: mustafa
--

CREATE TYPE public."IssueStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED'
);


ALTER TYPE public."IssueStatus" OWNER TO mustafa;

--
-- Name: ItemStatus; Type: TYPE; Schema: public; Owner: mustafa
--

CREATE TYPE public."ItemStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED'
);


ALTER TYPE public."ItemStatus" OWNER TO mustafa;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: mustafa
--

CREATE TYPE public."NotificationType" AS ENUM (
    'MESSAGE',
    'REPORT_PUBLISHED',
    'REPORT_COMMENT',
    'REACTION',
    'SYSTEM'
);


ALTER TYPE public."NotificationType" OWNER TO mustafa;

--
-- Name: ReactionType; Type: TYPE; Schema: public; Owner: mustafa
--

CREATE TYPE public."ReactionType" AS ENUM (
    'THUMBS_UP',
    'THUMBS_DOWN',
    'COMMENT'
);


ALTER TYPE public."ReactionType" OWNER TO mustafa;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: mustafa
--

CREATE TYPE public."UserRole" AS ENUM (
    'GM',
    'TRUSTEE'
);


ALTER TYPE public."UserRole" OWNER TO mustafa;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AlertConfig; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."AlertConfig" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    threshold double precision NOT NULL,
    operator text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    recipients text DEFAULT 'all'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AlertConfig" OWNER TO mustafa;

--
-- Name: AlertHistory; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."AlertHistory" (
    id text NOT NULL,
    "configId" text NOT NULL,
    school text,
    metric text NOT NULL,
    "expectedValue" double precision NOT NULL,
    "actualValue" double precision NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    message text NOT NULL,
    "isResolved" boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AlertHistory" OWNER TO mustafa;

--
-- Name: BudgetEntry; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."BudgetEntry" (
    id text NOT NULL,
    year integer NOT NULL,
    term integer DEFAULT 1 NOT NULL,
    category text NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BudgetEntry" OWNER TO mustafa;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "reportId" text NOT NULL,
    field text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO mustafa;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Department" OWNER TO mustafa;

--
-- Name: Enrollment; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Enrollment" (
    id text NOT NULL,
    school text NOT NULL,
    class text NOT NULL,
    term integer NOT NULL,
    year integer NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Enrollment" OWNER TO mustafa;

--
-- Name: FinancialEntry; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."FinancialEntry" (
    id text NOT NULL,
    type public."FinancialEntryType" NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    year integer NOT NULL,
    term integer DEFAULT 1 NOT NULL,
    month integer DEFAULT 1 NOT NULL,
    week integer,
    school text,
    source text,
    category text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FinancialEntry" OWNER TO mustafa;

--
-- Name: GMProject; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."GMProject" (
    id text NOT NULL,
    "projectName" text NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    "projectManager" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."ItemStatus" DEFAULT 'ACTIVE'::public."ItemStatus" NOT NULL
);


ALTER TABLE public."GMProject" OWNER TO mustafa;

--
-- Name: Goal; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Goal" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'enrollment'::text NOT NULL,
    "targetValue" double precision NOT NULL,
    "currentValue" double precision DEFAULT 0 NOT NULL,
    unit text NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    year integer NOT NULL,
    term integer,
    status text DEFAULT 'not-started'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Goal" OWNER TO mustafa;

--
-- Name: IncomeSource; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."IncomeSource" (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IncomeSource" OWNER TO mustafa;

--
-- Name: KPIData; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."KPIData" (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "feesCollectionPercent" double precision DEFAULT 0 NOT NULL,
    "schoolsExpenditurePercent" double precision DEFAULT 0 NOT NULL,
    "infrastructurePercent" double precision DEFAULT 0 NOT NULL,
    "totalEnrollment" integer DEFAULT 0 NOT NULL,
    "theologyEnrollment" integer DEFAULT 0 NOT NULL,
    "p7PrepExamsPercent" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."KPIData" OWNER TO mustafa;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    content text NOT NULL,
    "senderId" text NOT NULL,
    "recipientId" text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "attachmentName" text,
    "attachmentType" text,
    "attachmentUrl" text
);


ALTER TABLE public."Message" OWNER TO mustafa;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data text,
    "userId" text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO mustafa;

--
-- Name: OrganizationalGoal; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."OrganizationalGoal" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    "targetValue" double precision NOT NULL,
    "currentValue" double precision DEFAULT 0 NOT NULL,
    unit text NOT NULL,
    year integer NOT NULL,
    term integer,
    progress double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'in-progress'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrganizationalGoal" OWNER TO mustafa;

--
-- Name: OtherIncome; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."OtherIncome" (
    id text NOT NULL,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    source text NOT NULL,
    percentage double precision DEFAULT 0 NOT NULL,
    month integer DEFAULT 1 NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    term integer DEFAULT 1 NOT NULL,
    week integer
);


ALTER TABLE public."OtherIncome" OWNER TO mustafa;

--
-- Name: P6PromotionResult; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."P6PromotionResult" (
    id text NOT NULL,
    school text NOT NULL,
    year integer NOT NULL,
    "setNumber" integer NOT NULL,
    popn integer DEFAULT 0 NOT NULL,
    absences integer DEFAULT 0 NOT NULL,
    "actualPopn" integer DEFAULT 0 NOT NULL,
    agg4 integer DEFAULT 0 NOT NULL,
    "divisionI" integer DEFAULT 0 NOT NULL,
    "divisionII" integer DEFAULT 0 NOT NULL,
    "divisionIII" integer DEFAULT 0 NOT NULL,
    "divisionIV" integer DEFAULT 0 NOT NULL,
    ungraded integer DEFAULT 0 NOT NULL,
    api double precision DEFAULT 0 NOT NULL,
    rank text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."P6PromotionResult" OWNER TO mustafa;

--
-- Name: P7PleResult; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."P7PleResult" (
    id text NOT NULL,
    school text NOT NULL,
    year integer NOT NULL,
    popn integer DEFAULT 0 NOT NULL,
    agg4 integer DEFAULT 0 NOT NULL,
    "divisionI" integer DEFAULT 0 NOT NULL,
    "divisionII" integer DEFAULT 0 NOT NULL,
    "divisionIII" integer DEFAULT 0 NOT NULL,
    "divisionIV" integer DEFAULT 0 NOT NULL,
    "divisionU" integer DEFAULT 0 NOT NULL,
    api double precision DEFAULT 0 NOT NULL,
    rank text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."P7PleResult" OWNER TO mustafa;

--
-- Name: P7PrepPerformance; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."P7PrepPerformance" (
    id text NOT NULL,
    year integer NOT NULL,
    prep1 double precision DEFAULT 0 NOT NULL,
    prep2 double precision DEFAULT 0 NOT NULL,
    prep3 double precision DEFAULT 0 NOT NULL,
    prep4 double precision DEFAULT 0 NOT NULL,
    prep5 double precision DEFAULT 0 NOT NULL,
    prep6 double precision DEFAULT 0 NOT NULL,
    prep7 double precision DEFAULT 0 NOT NULL,
    prep8 double precision DEFAULT 0 NOT NULL,
    prep9 double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "p6Promotion" double precision DEFAULT 0 NOT NULL,
    ple double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."P7PrepPerformance" OWNER TO mustafa;

--
-- Name: P7PrepResult; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."P7PrepResult" (
    id text NOT NULL,
    school text NOT NULL,
    "prepNumber" integer NOT NULL,
    term integer NOT NULL,
    year integer NOT NULL,
    enrollment integer DEFAULT 0 NOT NULL,
    "divisionI" integer DEFAULT 0 NOT NULL,
    "divisionII" integer DEFAULT 0 NOT NULL,
    "divisionIII" integer DEFAULT 0 NOT NULL,
    "divisionIV" integer DEFAULT 0 NOT NULL,
    "averageScore" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    agg4 integer DEFAULT 0 NOT NULL,
    "divisionU" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."P7PrepResult" OWNER TO mustafa;

--
-- Name: PLEResult; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."PLEResult" (
    id text NOT NULL,
    school text NOT NULL,
    year integer NOT NULL,
    "candidatesEnrolled" integer DEFAULT 0 NOT NULL,
    "divisionI" integer DEFAULT 0 NOT NULL,
    "divisionII" integer DEFAULT 0 NOT NULL,
    "divisionIII" integer DEFAULT 0 NOT NULL,
    "divisionIV" integer DEFAULT 0 NOT NULL,
    "divisionC5" integer DEFAULT 0 NOT NULL,
    "divisionC6" integer DEFAULT 0 NOT NULL,
    "divisionP7" integer DEFAULT 0 NOT NULL,
    "divisionP8" integer DEFAULT 0 NOT NULL,
    "divisionU" integer DEFAULT 0 NOT NULL,
    "englishD1" integer DEFAULT 0 NOT NULL,
    "englishD2" integer DEFAULT 0 NOT NULL,
    "englishC3" integer DEFAULT 0 NOT NULL,
    "englishC4" integer DEFAULT 0 NOT NULL,
    "englishC5" integer DEFAULT 0 NOT NULL,
    "englishC6" integer DEFAULT 0 NOT NULL,
    "englishP7" integer DEFAULT 0 NOT NULL,
    "englishP8" integer DEFAULT 0 NOT NULL,
    "englishP9" integer DEFAULT 0 NOT NULL,
    "mathsD1" integer DEFAULT 0 NOT NULL,
    "mathsD2" integer DEFAULT 0 NOT NULL,
    "mathsC3" integer DEFAULT 0 NOT NULL,
    "mathsC4" integer DEFAULT 0 NOT NULL,
    "mathsC5" integer DEFAULT 0 NOT NULL,
    "mathsC6" integer DEFAULT 0 NOT NULL,
    "mathsP7" integer DEFAULT 0 NOT NULL,
    "mathsP8" integer DEFAULT 0 NOT NULL,
    "mathsP9" integer DEFAULT 0 NOT NULL,
    "scienceD1" integer DEFAULT 0 NOT NULL,
    "scienceD2" integer DEFAULT 0 NOT NULL,
    "scienceC3" integer DEFAULT 0 NOT NULL,
    "scienceC4" integer DEFAULT 0 NOT NULL,
    "scienceC5" integer DEFAULT 0 NOT NULL,
    "scienceC6" integer DEFAULT 0 NOT NULL,
    "scienceP7" integer DEFAULT 0 NOT NULL,
    "scienceP8" integer DEFAULT 0 NOT NULL,
    "scienceP9" integer DEFAULT 0 NOT NULL,
    "sstD1" integer DEFAULT 0 NOT NULL,
    "sstD2" integer DEFAULT 0 NOT NULL,
    "sstC3" integer DEFAULT 0 NOT NULL,
    "sstC4" integer DEFAULT 0 NOT NULL,
    "sstC5" integer DEFAULT 0 NOT NULL,
    "sstC6" integer DEFAULT 0 NOT NULL,
    "sstP7" integer DEFAULT 0 NOT NULL,
    "sstP8" integer DEFAULT 0 NOT NULL,
    "sstP9" integer DEFAULT 0 NOT NULL,
    agg4 integer DEFAULT 0 NOT NULL,
    agg5 integer DEFAULT 0 NOT NULL,
    agg6 integer DEFAULT 0 NOT NULL,
    agg7 integer DEFAULT 0 NOT NULL,
    agg8 integer DEFAULT 0 NOT NULL,
    agg9 integer DEFAULT 0 NOT NULL,
    agg10 integer DEFAULT 0 NOT NULL,
    agg11 integer DEFAULT 0 NOT NULL,
    agg12 integer DEFAULT 0 NOT NULL,
    agg13 integer DEFAULT 0 NOT NULL,
    agg14 integer DEFAULT 0 NOT NULL,
    agg15 integer DEFAULT 0 NOT NULL,
    agg16 integer DEFAULT 0 NOT NULL,
    agg17 integer DEFAULT 0 NOT NULL,
    agg18 integer DEFAULT 0 NOT NULL,
    agg19 integer DEFAULT 0 NOT NULL,
    agg20 integer DEFAULT 0 NOT NULL,
    agg21 integer DEFAULT 0 NOT NULL,
    agg22 integer DEFAULT 0 NOT NULL,
    agg23 integer DEFAULT 0 NOT NULL,
    agg24 integer DEFAULT 0 NOT NULL,
    agg25 integer DEFAULT 0 NOT NULL,
    agg26 integer DEFAULT 0 NOT NULL,
    agg27 integer DEFAULT 0 NOT NULL,
    agg28 integer DEFAULT 0 NOT NULL,
    agg29 integer DEFAULT 0 NOT NULL,
    agg30 integer DEFAULT 0 NOT NULL,
    agg31 integer DEFAULT 0 NOT NULL,
    agg32 integer DEFAULT 0 NOT NULL,
    agg33 integer DEFAULT 0 NOT NULL,
    agg34 integer DEFAULT 0 NOT NULL,
    agg35 integer DEFAULT 0 NOT NULL,
    agg36 integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PLEResult" OWNER TO mustafa;

--
-- Name: PushSubscription; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."PushSubscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    endpoint text NOT NULL,
    auth text NOT NULL,
    p256dh text NOT NULL,
    "userAgent" text,
    "deviceName" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PushSubscription" OWNER TO mustafa;

--
-- Name: Reaction; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Reaction" (
    id text NOT NULL,
    type public."ReactionType" NOT NULL,
    comment text,
    "sectionId" text NOT NULL,
    "weeklyReportId" text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Reaction" OWNER TO mustafa;

--
-- Name: RedIssue; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."RedIssue" (
    id text NOT NULL,
    issue text NOT NULL,
    "inCharge" text NOT NULL,
    status public."IssueStatus" DEFAULT 'OPEN'::public."IssueStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "itemStatus" public."ItemStatus" DEFAULT 'ACTIVE'::public."ItemStatus" NOT NULL
);


ALTER TABLE public."RedIssue" OWNER TO mustafa;

--
-- Name: School; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."School" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."School" OWNER TO mustafa;

--
-- Name: SchoolKPIData; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."SchoolKPIData" (
    id text NOT NULL,
    "weeklyReportId" text NOT NULL,
    school text NOT NULL,
    year integer NOT NULL,
    term integer NOT NULL,
    week integer NOT NULL,
    "feesCollectionPercent" double precision DEFAULT 0 NOT NULL,
    "expenditurePercent" double precision DEFAULT 0 NOT NULL,
    "infrastructurePercent" double precision DEFAULT 0 NOT NULL,
    "syllabusCoveragePercent" double precision DEFAULT 0 NOT NULL,
    "admissionsCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SchoolKPIData" OWNER TO mustafa;

--
-- Name: TermSetting; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."TermSetting" (
    id text NOT NULL,
    term integer NOT NULL,
    year integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "weeksCount" integer DEFAULT 13 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TermSetting" OWNER TO mustafa;

--
-- Name: TheologyEnrollment; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."TheologyEnrollment" (
    id text NOT NULL,
    school text NOT NULL,
    year integer NOT NULL,
    term integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    class text NOT NULL,
    count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."TheologyEnrollment" OWNER TO mustafa;

--
-- Name: Todo; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."Todo" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "isDeferred" boolean DEFAULT false NOT NULL,
    "deferredUntil" timestamp(3) without time zone,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    category text DEFAULT 'GENERAL'::text NOT NULL,
    "reminderSent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Todo" OWNER TO mustafa;

--
-- Name: UpcomingEvent; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."UpcomingEvent" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    activity text NOT NULL,
    "inCharge" text NOT NULL,
    rate text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."ItemStatus" DEFAULT 'ACTIVE'::public."ItemStatus" NOT NULL
);


ALTER TABLE public."UpcomingEvent" OWNER TO mustafa;

--
-- Name: User; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."UserRole" DEFAULT 'GM'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO mustafa;

--
-- Name: WeeklyReport; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."WeeklyReport" (
    id text NOT NULL,
    "weekNumber" integer NOT NULL,
    year integer NOT NULL,
    "weekStartDate" timestamp(3) without time zone NOT NULL,
    "weekEndDate" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "isDraft" boolean DEFAULT true NOT NULL,
    "feesCollectionPercent" double precision DEFAULT 0 NOT NULL,
    "schoolsExpenditurePercent" double precision DEFAULT 0 NOT NULL,
    "infrastructurePercent" double precision DEFAULT 0 NOT NULL,
    "totalEnrollment" integer DEFAULT 0 NOT NULL,
    "theologyEnrollment" integer DEFAULT 0 NOT NULL,
    "p7PrepExamsPercent" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    admissions integer DEFAULT 0 NOT NULL,
    "syllabusCoveragePercent" double precision DEFAULT 0 NOT NULL,
    term integer DEFAULT 1 NOT NULL,
    "generalManager" text
);


ALTER TABLE public."WeeklyReport" OWNER TO mustafa;

--
-- Name: WeeklyScorecard; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public."WeeklyScorecard" (
    id text NOT NULL,
    week integer NOT NULL,
    year integer NOT NULL,
    school text NOT NULL,
    "academicPercent" double precision DEFAULT 0 NOT NULL,
    "financePercent" double precision DEFAULT 0 NOT NULL,
    "qualityPercent" double precision DEFAULT 0 NOT NULL,
    "tdpPercent" double precision DEFAULT 0 NOT NULL,
    "theologyPercent" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    term integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."WeeklyScorecard" OWNER TO mustafa;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: mustafa
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO mustafa;

--
-- Data for Name: AlertConfig; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."AlertConfig" (id, name, type, threshold, operator, "isActive", recipients, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AlertHistory; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."AlertHistory" (id, "configId", school, metric, "expectedValue", "actualValue", severity, message, "isResolved", "resolvedAt", "resolvedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: BudgetEntry; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."BudgetEntry" (id, year, term, category, amount, notes, "createdAt", "updatedAt") FROM stdin;
cmljukeqf000011ms9jiwkigu	2026	1	salary	2348000000	\N	2026-02-12 19:23:57.207	2026-02-12 19:23:57.207
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Comment" (id, "reportId", field, text, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Department" (id, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Enrollment; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Enrollment" (id, school, class, term, year, count, "createdAt", "updatedAt") FROM stdin;
cml56ukwe002shkebzodx0vj5	OLD K'LA	KG1	1	2025	0	2026-02-02 13:11:14.51	2026-02-02 13:11:14.51
cml56uky6002thkebzdj5fh5r	OLD K'LA	KG2	1	2025	0	2026-02-02 13:11:14.574	2026-02-02 13:11:14.574
cml56ul01002uhkebaz3ew9lq	OLD K'LA	KG3	1	2025	0	2026-02-02 13:11:14.641	2026-02-02 13:11:14.641
cml56ul22002vhkeb4bzknqyj	OLD K'LA	P.1	1	2025	0	2026-02-02 13:11:14.715	2026-02-02 13:11:14.715
cml56ul37002whkebgqm3zq61	OLD K'LA	P.2	1	2025	0	2026-02-02 13:11:14.756	2026-02-02 13:11:14.756
cml56ul4a002xhkeb6k39xrhk	OLD K'LA	P.3	1	2025	0	2026-02-02 13:11:14.795	2026-02-02 13:11:14.795
cml56ul5u002yhkeb0cqp5z3y	OLD K'LA	P.4	1	2025	0	2026-02-02 13:11:14.851	2026-02-02 13:11:14.851
cml56ul7h002zhkebye2fnfgb	OLD K'LA	P.5	1	2025	0	2026-02-02 13:11:14.91	2026-02-02 13:11:14.91
cml56ul8q0030hkebeacb0toe	OLD K'LA	P.6	1	2025	0	2026-02-02 13:11:14.955	2026-02-02 13:11:14.955
cml56ul9w0031hkebxkn193xz	OLD K'LA	P.7	1	2025	0	2026-02-02 13:11:14.996	2026-02-02 13:11:14.996
cml6kknko000vsyubu5r62jog	KISASI	KG2	3	2025	76	2026-02-03 12:23:12.216	2026-02-03 12:23:12.216
cml6kknlq000wsyubujk2gtte	KISASI	KG3	3	2025	105	2026-02-03 12:23:12.254	2026-02-03 12:23:12.254
cml6kknny000xsyub0plw41ho	KISASI	P.1	3	2025	197	2026-02-03 12:23:12.334	2026-02-03 12:23:12.334
cml6kknox000ysyubk1brhbsg	KISASI	P.2	3	2025	186	2026-02-03 12:23:12.369	2026-02-03 12:23:12.369
cml6kknpy000zsyubsua00l4i	KISASI	P.3	3	2025	161	2026-02-03 12:23:12.406	2026-02-03 12:23:12.406
cml6kknqx0010syubaszqlx6l	KISASI	P.4	3	2025	201	2026-02-03 12:23:12.441	2026-02-03 12:23:12.441
cml6kknrs0011syubvkhgl0ws	KISASI	P.5	3	2025	162	2026-02-03 12:23:12.472	2026-02-03 12:23:12.472
cml6kknsu0012syubxdrwj2zk	KISASI	P.6	3	2025	163	2026-02-03 12:23:12.511	2026-02-03 12:23:12.511
cml6kknu00013syubcied2q5i	KISASI	P.7	3	2025	123	2026-02-03 12:23:12.552	2026-02-03 12:23:12.552
cml6k3i4p000vu4p2lvk8lfml	KISASI	KG2	2	2025	75	2026-02-03 12:09:52.009	2026-02-03 12:50:29.369
cml6k3i5x000wu4p29lopc0gm	KISASI	KG3	2	2025	101	2026-02-03 12:09:52.054	2026-02-03 12:50:29.409
cml6k3i7l000xu4p2ccjahbmt	KISASI	P.1	2	2025	197	2026-02-03 12:09:52.113	2026-02-03 12:50:29.457
cml6k3i9e000yu4p2jcm6t3wg	KISASI	P.2	2	2025	185	2026-02-03 12:09:52.178	2026-02-03 12:50:29.501
cml6k3ian000zu4p2i1i9ywuz	KISASI	P.3	2	2025	162	2026-02-03 12:09:52.223	2026-02-03 12:50:29.545
cml6k3icm0010u4p2wbfe9789	KISASI	P.4	2	2025	204	2026-02-03 12:09:52.295	2026-02-03 12:50:29.593
cml6k3iea0011u4p2jc89bu4a	KISASI	P.5	2	2025	168	2026-02-03 12:09:52.355	2026-02-03 12:50:29.629
cml6k3ifu0012u4p2b9w7rynl	KISASI	P.6	2	2025	164	2026-02-03 12:09:52.41	2026-02-03 12:50:29.678
cml6k3igv0013u4p22f3olbhm	KISASI	P.7	2	2025	123	2026-02-03 12:09:52.448	2026-02-03 12:50:29.708
cml6k3i3m000uu4p2rngbwis0	KISASI	KG1	2	2025	70	2026-02-03 12:09:51.97	2026-02-03 12:50:29.329
cml6kknjm000usyub0udpg9ww	KISASI	KG1	3	2025	70	2026-02-03 12:23:12.178	2026-02-03 12:23:12.178
cml6kkmfo0000syub1r2v0v5p	KITINTALE	KG1	3	2025	29	2026-02-03 12:23:10.739	2026-02-03 12:23:10.739
cml6kkmiz0001syubm742aosn	KITINTALE	KG2	3	2025	34	2026-02-03 12:23:10.86	2026-02-03 12:23:10.86
cml6kkmk70002syubgr58y3bt	KITINTALE	KG3	3	2025	35	2026-02-03 12:23:10.904	2026-02-03 12:23:10.904
cml6kkmm20003syubiollumks	KITINTALE	P.1	3	2025	75	2026-02-03 12:23:10.97	2026-02-03 12:23:10.97
cml6kkmnj0004syubmuggf86z	KITINTALE	P.2	3	2025	54	2026-02-03 12:23:11.023	2026-02-03 12:23:11.023
cml6kkmp10005syubnp444gqb	KITINTALE	P.3	3	2025	72	2026-02-03 12:23:11.077	2026-02-03 12:23:11.077
cml6kkmq10006syubgh9wd8yc	KITINTALE	P.4	3	2025	96	2026-02-03 12:23:11.113	2026-02-03 12:23:11.113
cml6kkmr70007syubyf8d6hnj	KITINTALE	P.5	3	2025	83	2026-02-03 12:23:11.156	2026-02-03 12:23:11.156
cml6kkmti0008syubt3v3hkvp	KITINTALE	P.6	3	2025	73	2026-02-03 12:23:11.238	2026-02-03 12:23:11.238
cml6kkmux0009syub6zg3j5s2	KITINTALE	P.7	3	2025	78	2026-02-03 12:23:11.289	2026-02-03 12:23:11.289
cml6kkmw9000asyubc1mri189	MENGO	KG1	3	2025	99	2026-02-03 12:23:11.337	2026-02-03 12:23:11.337
cml6kkmxk000bsyubr5l83uf4	MENGO	KG2	3	2025	111	2026-02-03 12:23:11.384	2026-02-03 12:23:11.384
cml6kkmyo000csyubzdj60nx1	MENGO	KG3	3	2025	143	2026-02-03 12:23:11.424	2026-02-03 12:23:11.424
cml6kkmzy000dsyubby36yeiv	MENGO	P.1	3	2025	230	2026-02-03 12:23:11.469	2026-02-03 12:23:11.469
cml6kkn0u000esyubg0eqnagq	MENGO	P.2	3	2025	183	2026-02-03 12:23:11.502	2026-02-03 12:23:11.502
cml6kkn21000fsyubgfiuyci4	MENGO	P.3	3	2025	176	2026-02-03 12:23:11.545	2026-02-03 12:23:11.545
cml6kkn31000gsyub9t96z6qs	MENGO	P.4	3	2025	238	2026-02-03 12:23:11.582	2026-02-03 12:23:11.582
cml6kkn42000hsyubb6vc5inq	MENGO	P.5	3	2025	226	2026-02-03 12:23:11.618	2026-02-03 12:23:11.618
cml6kkn54000isyub6yikzcf5	MENGO	P.6	3	2025	171	2026-02-03 12:23:11.656	2026-02-03 12:23:11.656
cml6kkn6a000jsyuboe2kslv1	MENGO	P.7	3	2025	157	2026-02-03 12:23:11.698	2026-02-03 12:23:11.698
cml6kkn7i000ksyubycvr6eug	CPS	KG1	3	2025	70	2026-02-03 12:23:11.743	2026-02-03 12:23:11.743
cml6kkn8m000lsyub9iwg23kx	CPS	KG2	3	2025	98	2026-02-03 12:23:11.782	2026-02-03 12:23:11.782
cml6kkn9w000msyubifn2jodo	CPS	KG3	3	2025	105	2026-02-03 12:23:11.829	2026-02-03 12:23:11.829
cml6kknb3000nsyubvm4xeqel	CPS	P.1	3	2025	205	2026-02-03 12:23:11.872	2026-02-03 12:23:11.872
cml6kkncb000osyubs547xqkp	CPS	P.2	3	2025	191	2026-02-03 12:23:11.916	2026-02-03 12:23:11.916
cml6kkne4000psyub5n15446o	CPS	P.3	3	2025	185	2026-02-03 12:23:11.98	2026-02-03 12:23:11.98
cml6kknfm000qsyubeafriin6	CPS	P.4	3	2025	198	2026-02-03 12:23:12.034	2026-02-03 12:23:12.034
cml6kkngo000rsyub7clrfuld	CPS	P.5	3	2025	238	2026-02-03 12:23:12.072	2026-02-03 12:23:12.072
cml6kknhm000ssyubqwvzctxi	CPS	P.6	3	2025	223	2026-02-03 12:23:12.106	2026-02-03 12:23:12.106
cml6kknij000tsyub54hrpnk0	CPS	P.7	3	2025	216	2026-02-03 12:23:12.139	2026-02-03 12:23:12.139
cml6kknve0014syubv8g3xlei	NAKASERO	KG1	3	2025	45	2026-02-03 12:23:12.603	2026-02-03 12:23:12.603
cml6kknwl0015syub7xn3n39y	NAKASERO	KG2	3	2025	41	2026-02-03 12:23:12.645	2026-02-03 12:23:12.645
cml6kknxo0016syubf1pq6rme	NAKASERO	KG3	3	2025	53	2026-02-03 12:23:12.684	2026-02-03 12:23:12.684
cml6kknyq0017syubz36fe6bf	NAKASERO	P.1	3	2025	121	2026-02-03 12:23:12.723	2026-02-03 12:23:12.723
cml6kknzk0018syubgt5ljl3z	NAKASERO	P.2	3	2025	126	2026-02-03 12:23:12.753	2026-02-03 12:23:12.753
cml6kko0f0019syubezeffs47	NAKASERO	P.3	3	2025	113	2026-02-03 12:23:12.784	2026-02-03 12:23:12.784
cml6kko1b001asyub2t59131k	NAKASERO	P.4	3	2025	133	2026-02-03 12:23:12.815	2026-02-03 12:23:12.815
cml6kko2f001bsyub84iznxvb	NAKASERO	P.5	3	2025	125	2026-02-03 12:23:12.856	2026-02-03 12:23:12.856
cml6kko3h001csyubbipd6xuh	NAKASERO	P.6	3	2025	85	2026-02-03 12:23:12.893	2026-02-03 12:23:12.893
cml6kko4k001dsyubk4cs77pm	NAKASERO	P.7	3	2025	82	2026-02-03 12:23:12.933	2026-02-03 12:23:12.933
cml6kko5l001esyub6z6wovck	FAIRWAYS	KG1	3	2025	26	2026-02-03 12:23:12.969	2026-02-03 12:23:12.969
cml6kko6w001fsyub5ztnrg7k	FAIRWAYS	KG2	3	2025	42	2026-02-03 12:23:13.016	2026-02-03 12:23:13.016
cml6kko87001gsyub4mrqo9o8	FAIRWAYS	KG3	3	2025	52	2026-02-03 12:23:13.064	2026-02-03 12:23:13.064
cml6kko9f001hsyub4h284xo1	FAIRWAYS	P.1	3	2025	90	2026-02-03 12:23:13.107	2026-02-03 12:23:13.107
cml6kkoar001isyubpg2znw7z	FAIRWAYS	P.2	3	2025	90	2026-02-03 12:23:13.155	2026-02-03 12:23:13.155
cml6kkoc9001jsyubwia7bvo6	FAIRWAYS	P.3	3	2025	77	2026-02-03 12:23:13.209	2026-02-03 12:23:13.209
cml6kkodf001ksyub77iaogvd	FAIRWAYS	P.4	3	2025	95	2026-02-03 12:23:13.252	2026-02-03 12:23:13.252
cml6kkoej001lsyubl7bwljzw	FAIRWAYS	P.5	3	2025	87	2026-02-03 12:23:13.291	2026-02-03 12:23:13.291
cml6kkofm001msyub90c034ho	FAIRWAYS	P.6	3	2025	63	2026-02-03 12:23:13.331	2026-02-03 12:23:13.331
cml6kkogr001nsyubu53khvcs	FAIRWAYS	P.7	3	2025	56	2026-02-03 12:23:13.37	2026-02-03 12:23:13.37
cml6kkoi0001osyub9yu3ltx7	KPS	KG1	3	2025	11	2026-02-03 12:23:13.416	2026-02-03 12:23:13.416
cml6kkojg001psyub71c5e7ok	KPS	KG2	3	2025	17	2026-02-03 12:23:13.468	2026-02-03 12:23:13.468
cml6kkokk001qsyubv958ivjc	KPS	KG3	3	2025	16	2026-02-03 12:23:13.508	2026-02-03 12:23:13.508
cml6kkom6001rsyubb0608bvj	KPS	P.1	3	2025	54	2026-02-03 12:23:13.566	2026-02-03 12:23:13.566
cml6kkoph001ssyub8cejr9yw	KPS	P.2	3	2025	49	2026-02-03 12:23:13.685	2026-02-03 12:23:13.685
cml6kkot4001tsyubk0j2quup	KPS	P.3	3	2025	60	2026-02-03 12:23:13.816	2026-02-03 12:23:13.816
cml6kkow9001usyuby9qcy4i4	KPS	P.4	3	2025	85	2026-02-03 12:23:13.929	2026-02-03 12:23:13.929
cml6kkoze001vsyubo2dzxpeq	KPS	P.5	3	2025	108	2026-02-03 12:23:14.042	2026-02-03 12:23:14.042
cml6kkp1e001wsyubxjwwnrms	KPS	P.6	3	2025	96	2026-02-03 12:23:14.114	2026-02-03 12:23:14.114
cml6kkp38001xsyubmz16x6gm	KPS	P.7	3	2025	81	2026-02-03 12:23:14.18	2026-02-03 12:23:14.18
cml6kkp5p001ysyubb6rafo57	WINSTON	KG1	3	2025	31	2026-02-03 12:23:14.269	2026-02-03 12:23:14.269
cml6kkpkz001zsyub9qx11yvs	WINSTON	KG2	3	2025	37	2026-02-03 12:23:14.819	2026-02-03 12:23:14.819
cml6kkpmt0020syubqjjta2l3	WINSTON	KG3	3	2025	36	2026-02-03 12:23:14.886	2026-02-03 12:23:14.886
cml6kkprj0021syub72y2wrs4	WINSTON	P.1	3	2025	79	2026-02-03 12:23:15.056	2026-02-03 12:23:15.056
cml6kkpx20022syubirif2ffk	WINSTON	P.2	3	2025	53	2026-02-03 12:23:15.254	2026-02-03 12:23:15.254
cml6kkpzr0023syubuy4srphe	WINSTON	P.3	3	2025	100	2026-02-03 12:23:15.351	2026-02-03 12:23:15.351
cml6kkq3w0024syub3akqdwhi	WINSTON	P.4	3	2025	115	2026-02-03 12:23:15.5	2026-02-03 12:23:15.5
cml6kkqm20025syub0f4glk1w	WINSTON	P.5	3	2025	133	2026-02-03 12:23:16.154	2026-02-03 12:23:16.154
cml6kkqpe0026syubfnimoyyr	WINSTON	P.6	3	2025	119	2026-02-03 12:23:16.274	2026-02-03 12:23:16.274
cml6kkqsj0027syubeflxsaec	WINSTON	P.7	3	2025	104	2026-02-03 12:23:16.388	2026-02-03 12:23:16.388
cml6kkr000028syubz2tbhuyj	KPM	KG1	3	2025	14	2026-02-03 12:23:16.656	2026-02-03 12:23:16.656
cml6kkr190029syublhx5qfjm	KPM	KG2	3	2025	10	2026-02-03 12:23:16.701	2026-02-03 12:23:16.701
cml6kkr2k002asyub4oatlfj0	KPM	KG3	3	2025	22	2026-02-03 12:23:16.749	2026-02-03 12:23:16.749
cml6kkr46002bsyubenmavwu3	KPM	P.1	3	2025	38	2026-02-03 12:23:16.806	2026-02-03 12:23:16.806
cml6kkr65002csyubekngqar3	KPM	P.2	3	2025	33	2026-02-03 12:23:16.877	2026-02-03 12:23:16.877
cml6kkr86002dsyubdq2bwyox	KPM	P.3	3	2025	54	2026-02-03 12:23:16.95	2026-02-03 12:23:16.95
cml6kkra8002esyub7v7ve5ku	KPM	P.4	3	2025	73	2026-02-03 12:23:17.024	2026-02-03 12:23:17.024
cml6kkrbv002fsyub47nqbd1e	KPM	P.5	3	2025	80	2026-02-03 12:23:17.083	2026-02-03 12:23:17.083
cml6kkrep002gsyub94ckyi0k	KPM	P.6	3	2025	84	2026-02-03 12:23:17.185	2026-02-03 12:23:17.185
cml6kkrgv002hsyubw3dvx6br	KPM	P.7	3	2025	85	2026-02-03 12:23:17.264	2026-02-03 12:23:17.264
cml6kkrj4002isyubfbrwz7um	KIRA	KG1	3	2025	75	2026-02-03 12:23:17.344	2026-02-03 12:23:17.344
cml6kkrk3002jsyub8cywqoe9	KIRA	KG2	3	2025	111	2026-02-03 12:23:17.379	2026-02-03 12:23:17.379
cml6kkrl2002ksyubiigkvktk	KIRA	KG3	3	2025	81	2026-02-03 12:23:17.414	2026-02-03 12:23:17.414
cml6kkrm6002lsyub15ct370h	KIRA	P.1	3	2025	203	2026-02-03 12:23:17.454	2026-02-03 12:23:17.454
cml6kkro2002msyub7r6ibovv	KIRA	P.2	3	2025	149	2026-02-03 12:23:17.522	2026-02-03 12:23:17.522
cml6kkrp8002nsyubzaph4coa	KIRA	P.3	3	2025	128	2026-02-03 12:23:17.565	2026-02-03 12:23:17.565
cml6kkrq9002osyubzr2yy833	KIRA	P.4	3	2025	112	2026-02-03 12:23:17.601	2026-02-03 12:23:17.601
cml6kkrr7002psyubuiish1yf	KIRA	P.5	3	2025	87	2026-02-03 12:23:17.635	2026-02-03 12:23:17.635
cml6kkrs1002qsyubncqnzdf7	KIRA	P.6	3	2025	66	2026-02-03 12:23:17.665	2026-02-03 12:23:17.665
cml6kkrsv002rsyubx2h19nhc	KIRA	P.7	3	2025	38	2026-02-03 12:23:17.695	2026-02-03 12:23:17.695
cml6kkrtv002ssyubvvjgpe5j	OLD K'LA	KG1	3	2025	0	2026-02-03 12:23:17.731	2026-02-03 12:23:17.731
cml6kkrv5002tsyubixh5j4it	OLD K'LA	KG2	3	2025	0	2026-02-03 12:23:17.778	2026-02-03 12:23:17.778
cml6kkrw6002usyubi9spxy56	OLD K'LA	KG3	3	2025	14	2026-02-03 12:23:17.814	2026-02-03 12:23:17.814
cml6kkrx5002vsyubuvxm0pfj	OLD K'LA	P.1	3	2025	52	2026-02-03 12:23:17.849	2026-02-03 12:23:17.849
cml6kkry7002wsyubh7tyk0ku	OLD K'LA	P.2	3	2025	61	2026-02-03 12:23:17.888	2026-02-03 12:23:17.888
cml6kkrz2002xsyubuju62w7e	OLD K'LA	P.3	3	2025	80	2026-02-03 12:23:17.918	2026-02-03 12:23:17.918
cml6kks06002ysyubkt3eo82a	OLD K'LA	P.4	3	2025	127	2026-02-03 12:23:17.958	2026-02-03 12:23:17.958
cml6kks2s002zsyub3dt4e0ke	OLD K'LA	P.5	3	2025	127	2026-02-03 12:23:18.052	2026-02-03 12:23:18.052
cml6kks470030syubz7l693ez	OLD K'LA	P.6	3	2025	163	2026-02-03 12:23:18.103	2026-02-03 12:23:18.103
cml6kks5e0031syub02g3n7a1	OLD K'LA	P.7	3	2025	146	2026-02-03 12:23:18.146	2026-02-03 12:23:18.146
cml6ljplx0032syubt4o6snhs	KITINTALE	KG1	2	2025	29	2026-02-03 12:50:27.812	2026-02-03 12:50:27.812
cml6ljpo80033syubynlwbs6e	KITINTALE	KG2	2	2025	35	2026-02-03 12:50:27.896	2026-02-03 12:50:27.896
cml6ljpqj0034syubnjivszno	KITINTALE	KG3	2	2025	35	2026-02-03 12:50:27.98	2026-02-03 12:50:27.98
cml6ljps90035syubpln84lpl	KITINTALE	P.1	2	2025	78	2026-02-03 12:50:28.041	2026-02-03 12:50:28.041
cml6ljpth0036syubduaymq1x	KITINTALE	P.2	2	2025	56	2026-02-03 12:50:28.085	2026-02-03 12:50:28.085
cml6ljpup0037syubklqcyena	KITINTALE	P.3	2	2025	72	2026-02-03 12:50:28.129	2026-02-03 12:50:28.129
cml6ljpvz0038syubkq2e5w6f	KITINTALE	P.4	2	2025	98	2026-02-03 12:50:28.175	2026-02-03 12:50:28.175
cml6ljpxn0039syub38my0elo	KITINTALE	P.5	2	2025	88	2026-02-03 12:50:28.235	2026-02-03 12:50:28.235
cml6ljpz0003asyubrscftz9x	KITINTALE	P.6	2	2025	76	2026-02-03 12:50:28.284	2026-02-03 12:50:28.284
cml6ljq0p003bsyubwxlorddg	KITINTALE	P.7	2	2025	78	2026-02-03 12:50:28.345	2026-02-03 12:50:28.345
cml6ljq1v003csyubqxyh1a1u	MENGO	KG1	2	2025	99	2026-02-03 12:50:28.388	2026-02-03 12:50:28.388
cml6ljq3a003dsyubfl5d9jt1	MENGO	KG2	2	2025	109	2026-02-03 12:50:28.438	2026-02-03 12:50:28.438
cml6ljq4p003esyubvn94zt0o	MENGO	KG3	2	2025	143	2026-02-03 12:50:28.489	2026-02-03 12:50:28.489
cml6ljq5k003fsyubn5rqddeq	MENGO	P.1	2	2025	226	2026-02-03 12:50:28.52	2026-02-03 12:50:28.52
cml6ljq6y003gsyubvj8tw5ph	MENGO	P.2	2	2025	180	2026-02-03 12:50:28.57	2026-02-03 12:50:28.57
cml6ljq7z003hsyub09j8jnd1	MENGO	P.3	2	2025	176	2026-02-03 12:50:28.607	2026-02-03 12:50:28.607
cml6ljq9b003isyubqam54ce8	MENGO	P.4	2	2025	239	2026-02-03 12:50:28.656	2026-02-03 12:50:28.656
cml6ljqaq003jsyubw74nu33u	MENGO	P.5	2	2025	226	2026-02-03 12:50:28.707	2026-02-03 12:50:28.707
cml6ljqc0003ksyublk7ljhwy	MENGO	P.6	2	2025	177	2026-02-03 12:50:28.753	2026-02-03 12:50:28.753
cml6ljqd7003lsyubtm495att	MENGO	P.7	2	2025	157	2026-02-03 12:50:28.795	2026-02-03 12:50:28.795
cml6ljqe8003msyubf3vo3wht	CPS	KG1	2	2025	70	2026-02-03 12:50:28.833	2026-02-03 12:50:28.833
cml6ljqfr003nsyub8f360uis	CPS	KG2	2	2025	99	2026-02-03 12:50:28.887	2026-02-03 12:50:28.887
cml6ljqh9003osyubffv50pav	CPS	KG3	2	2025	106	2026-02-03 12:50:28.941	2026-02-03 12:50:28.941
cml6ljqi9003psyubf08pafzn	CPS	P.1	2	2025	206	2026-02-03 12:50:28.977	2026-02-03 12:50:28.977
cml6ljqjh003qsyub25irud1b	CPS	P.2	2	2025	195	2026-02-03 12:50:29.021	2026-02-03 12:50:29.021
cml6ljqlh003rsyubb1glovlo	CPS	P.3	2	2025	186	2026-02-03 12:50:29.093	2026-02-03 12:50:29.093
cml6ljqmy003ssyub55yqc8x9	CPS	P.4	2	2025	205	2026-02-03 12:50:29.147	2026-02-03 12:50:29.147
cml6ljqoc003tsyubxrgqjdax	CPS	P.5	2	2025	240	2026-02-03 12:50:29.196	2026-02-03 12:50:29.196
cml6ljqpr003usyubv3esljcu	CPS	P.6	2	2025	230	2026-02-03 12:50:29.248	2026-02-03 12:50:29.248
cml6ljqqx003vsyubel0pje0i	CPS	P.7	2	2025	216	2026-02-03 12:50:29.289	2026-02-03 12:50:29.289
cml6ljr3z0046syub8h6xr8tx	NAKASERO	KG1	2	2025	45	2026-02-03 12:50:29.759	2026-02-03 12:50:29.759
cml6ljr5g0047syubsrk7hf2h	NAKASERO	KG2	2	2025	40	2026-02-03 12:50:29.813	2026-02-03 12:50:29.813
cml6ljr720048syub6fvu77mn	NAKASERO	KG3	2	2025	53	2026-02-03 12:50:29.87	2026-02-03 12:50:29.87
cml6ljr8a0049syub790c3vpp	NAKASERO	P.1	2	2025	119	2026-02-03 12:50:29.913	2026-02-03 12:50:29.913
cml6ljra0004asyubhvdivlin	NAKASERO	P.2	2	2025	126	2026-02-03 12:50:29.976	2026-02-03 12:50:29.976
cml6ljrb9004bsyubo4gn6jv9	NAKASERO	P.3	2	2025	115	2026-02-03 12:50:30.021	2026-02-03 12:50:30.021
cml6ljrc4004csyub38wimuvp	NAKASERO	P.4	2	2025	132	2026-02-03 12:50:30.05	2026-02-03 12:50:30.05
cml6ljrdl004dsyuba8iwjjut	NAKASERO	P.5	2	2025	126	2026-02-03 12:50:30.105	2026-02-03 12:50:30.105
cml6ljrey004esyubxta9uu45	NAKASERO	P.6	2	2025	90	2026-02-03 12:50:30.154	2026-02-03 12:50:30.154
cml6ljrfy004fsyubki0f19x9	NAKASERO	P.7	2	2025	82	2026-02-03 12:50:30.19	2026-02-03 12:50:30.19
cml6ljrh4004gsyub5u4angnc	FAIRWAYS	KG1	2	2025	26	2026-02-03 12:50:30.233	2026-02-03 12:50:30.233
cml6ljrip004hsyuby72cv1ha	FAIRWAYS	KG2	2	2025	48	2026-02-03 12:50:30.29	2026-02-03 12:50:30.29
cml6ljrk6004isyubash387qc	FAIRWAYS	KG3	2	2025	50	2026-02-03 12:50:30.342	2026-02-03 12:50:30.342
cml6ljrlh004jsyubqav8rso0	FAIRWAYS	P.1	2	2025	93	2026-02-03 12:50:30.39	2026-02-03 12:50:30.39
cml6ljrn2004ksyub11xh13pl	FAIRWAYS	P.2	2	2025	90	2026-02-03 12:50:30.446	2026-02-03 12:50:30.446
cml6ljroc004lsyubi36a0hu1	FAIRWAYS	P.3	2	2025	79	2026-02-03 12:50:30.493	2026-02-03 12:50:30.493
cml6ljrpz004msyubzrvtb1yn	FAIRWAYS	P.4	2	2025	96	2026-02-03 12:50:30.551	2026-02-03 12:50:30.551
cml6ljrrc004nsyub7h2774hf	FAIRWAYS	P.5	2	2025	87	2026-02-03 12:50:30.6	2026-02-03 12:50:30.6
cml6ljrsf004osyub81vbea97	FAIRWAYS	P.6	2	2025	66	2026-02-03 12:50:30.639	2026-02-03 12:50:30.639
cml6ljrtv004psyub68r6hj61	FAIRWAYS	P.7	2	2025	56	2026-02-03 12:50:30.692	2026-02-03 12:50:30.692
cml6ljrus004qsyub530g66ni	KPS	KG1	2	2025	11	2026-02-03 12:50:30.723	2026-02-03 12:50:30.723
cml6ljrvt004rsyubtd08u39g	KPS	KG2	2	2025	16	2026-02-03 12:50:30.761	2026-02-03 12:50:30.761
cml6ljrxb004ssyubnvdi7y7m	KPS	KG3	2	2025	15	2026-02-03 12:50:30.815	2026-02-03 12:50:30.815
cml6ljrys004tsyub6l10mgrp	KPS	P.1	2	2025	54	2026-02-03 12:50:30.869	2026-02-03 12:50:30.869
cml6ljs05004usyubkqr56j7v	KPS	P.2	2	2025	48	2026-02-03 12:50:30.918	2026-02-03 12:50:30.918
cml6ljs1g004vsyubt4xfusbz	KPS	P.3	2	2025	61	2026-02-03 12:50:30.964	2026-02-03 12:50:30.964
cml6ljs2j004wsyubbw0zwjij	KPS	P.4	2	2025	84	2026-02-03 12:50:31.004	2026-02-03 12:50:31.004
cml6ljs3n004xsyubrtfikxm8	KPS	P.5	2	2025	108	2026-02-03 12:50:31.043	2026-02-03 12:50:31.043
cml6ljs4p004ysyub7zduye1v	KPS	P.6	2	2025	93	2026-02-03 12:50:31.081	2026-02-03 12:50:31.081
cml6ljs63004zsyub4nu9g2fz	KPS	P.7	2	2025	81	2026-02-03 12:50:31.131	2026-02-03 12:50:31.131
cml6ljs760050syubu8axsnjn	WINSTON	KG1	2	2025	31	2026-02-03 12:50:31.171	2026-02-03 12:50:31.171
cml6ljs8u0051syubhy8zw44x	WINSTON	KG2	2	2025	36	2026-02-03 12:50:31.23	2026-02-03 12:50:31.23
cml6ljs9y0052syubcwrd7x81	WINSTON	KG3	2	2025	36	2026-02-03 12:50:31.271	2026-02-03 12:50:31.271
cml6ljsay0053syubab34ooiv	WINSTON	P.1	2	2025	80	2026-02-03 12:50:31.306	2026-02-03 12:50:31.306
cml6ljsc80054syub7uby36z3	WINSTON	P.2	2	2025	53	2026-02-03 12:50:31.352	2026-02-03 12:50:31.352
cml6ljsdl0055syubit51d6mc	WINSTON	P.3	2	2025	102	2026-02-03 12:50:31.402	2026-02-03 12:50:31.402
cml6ljseo0056syubl974ccdy	WINSTON	P.4	2	2025	112	2026-02-03 12:50:31.44	2026-02-03 12:50:31.44
cml6ljsfl0057syubn5ugysfg	WINSTON	P.5	2	2025	132	2026-02-03 12:50:31.473	2026-02-03 12:50:31.473
cml6ljsgr0058syubxfv24hhh	WINSTON	P.6	2	2025	122	2026-02-03 12:50:31.515	2026-02-03 12:50:31.515
cml6ljsi70059syubekzjfzrh	WINSTON	P.7	2	2025	104	2026-02-03 12:50:31.568	2026-02-03 12:50:31.568
cml6ljsjx005asyubh4l1309v	KPM	KG1	2	2025	14	2026-02-03 12:50:31.629	2026-02-03 12:50:31.629
cml6ljslu005bsyublznv0hy2	KPM	KG2	2	2025	11	2026-02-03 12:50:31.698	2026-02-03 12:50:31.698
cml6ljsnb005csyubmt0pgfuo	KPM	KG3	2	2025	22	2026-02-03 12:50:31.751	2026-02-03 12:50:31.751
cml6ljspd005dsyub59qtq1wx	KPM	P.1	2	2025	38	2026-02-03 12:50:31.826	2026-02-03 12:50:31.826
cml6ljsqw005esyubcijmxar6	KPM	P.2	2	2025	33	2026-02-03 12:50:31.88	2026-02-03 12:50:31.88
cml6ljssr005fsyub7zv27l7s	KPM	P.3	2	2025	54	2026-02-03 12:50:31.948	2026-02-03 12:50:31.948
cml6ljsut005gsyub1szc3nyc	KPM	P.4	2	2025	73	2026-02-03 12:50:32.022	2026-02-03 12:50:32.022
cml6ljswh005hsyubwlwso8ac	KPM	P.5	2	2025	79	2026-02-03 12:50:32.081	2026-02-03 12:50:32.081
cml6ljsxv005isyubrz569tda	KPM	P.6	2	2025	87	2026-02-03 12:50:32.131	2026-02-03 12:50:32.131
cml6ljsze005jsyubtec5qg50	KPM	P.7	2	2025	85	2026-02-03 12:50:32.185	2026-02-03 12:50:32.185
cml6ljt0e005ksyub4x7947dh	KIRA	KG1	2	2025	75	2026-02-03 12:50:32.222	2026-02-03 12:50:32.222
cml6ljt1t005lsyub4wzyu5s7	KIRA	KG2	2	2025	113	2026-02-03 12:50:32.273	2026-02-03 12:50:32.273
cml6ljt38005msyubpo11q4dh	KIRA	KG3	2	2025	77	2026-02-03 12:50:32.324	2026-02-03 12:50:32.324
cml6ljt4j005nsyubucxd0x5f	KIRA	P.1	2	2025	202	2026-02-03 12:50:32.371	2026-02-03 12:50:32.371
cml6ljt5v005osyubzl93ndzp	KIRA	P.2	2	2025	146	2026-02-03 12:50:32.419	2026-02-03 12:50:32.419
cml6ljt7m005psyub33gejnm7	KIRA	P.3	2	2025	127	2026-02-03 12:50:32.481	2026-02-03 12:50:32.481
cml6ljt97005qsyubvhwvvm12	KIRA	P.4	2	2025	113	2026-02-03 12:50:32.539	2026-02-03 12:50:32.539
cml6ljtak005rsyub7pjlkfca	KIRA	P.5	2	2025	84	2026-02-03 12:50:32.588	2026-02-03 12:50:32.588
cml6ljtbs005ssyub8kklpvlg	KIRA	P.6	2	2025	67	2026-02-03 12:50:32.631	2026-02-03 12:50:32.631
cml6ljtdf005tsyub9jb1ycu4	KIRA	P.7	2	2025	38	2026-02-03 12:50:32.691	2026-02-03 12:50:32.691
cml6ljtes005usyubieuoit14	OLD K'LA	KG1	2	2025	0	2026-02-03 12:50:32.741	2026-02-03 12:50:32.741
cml6ljth1005vsyub1rdl8y2c	OLD K'LA	KG2	2	2025	0	2026-02-03 12:50:32.821	2026-02-03 12:50:32.821
cml6ljtif005wsyubpc1zchxi	OLD K'LA	KG3	2	2025	14	2026-02-03 12:50:32.871	2026-02-03 12:50:32.871
cml6ljtjq005xsyubk5kacoa3	OLD K'LA	P.1	2	2025	51	2026-02-03 12:50:32.919	2026-02-03 12:50:32.919
cml6ljtl8005ysyubb2773wdn	OLD K'LA	P.2	2	2025	64	2026-02-03 12:50:32.972	2026-02-03 12:50:32.972
cml6ljtmf005zsyubkn7ivhi7	OLD K'LA	P.3	2	2025	81	2026-02-03 12:50:33.015	2026-02-03 12:50:33.015
cml6ljtnb0060syub7s3d2mbg	OLD K'LA	P.4	2	2025	128	2026-02-03 12:50:33.047	2026-02-03 12:50:33.047
cml6ljtol0061syubfnvo0ykp	OLD K'LA	P.5	2	2025	133	2026-02-03 12:50:33.093	2026-02-03 12:50:33.093
cml6ljtpo0062syub9n6x1h53	OLD K'LA	P.6	2	2025	167	2026-02-03 12:50:33.132	2026-02-03 12:50:33.132
cml6ljtr80063syub7e39fuxa	OLD K'LA	P.7	2	2025	146	2026-02-03 12:50:33.188	2026-02-03 12:50:33.188
\.


--
-- Data for Name: FinancialEntry; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."FinancialEntry" (id, type, amount, year, term, month, week, school, source, category, notes, "createdAt", "updatedAt") FROM stdin;
cmljunow6000111msohqv0syn	EXPENSE	67000	2026	1	2	\N	\N	\N	\N	\N	2026-02-12 19:26:30.342	2026-02-12 19:26:30.342
\.


--
-- Data for Name: GMProject; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."GMProject" (id, "projectName", progress, "projectManager", "createdAt", "updatedAt", status) FROM stdin;
cmlebm4d200aj8fau40pyp5bn	New Library Construction	75	Eng. Mukasa	2026-02-08 22:34:33.495	2026-02-08 22:34:33.495	ACTIVE
cmlho37290000v1kb7e0e7jxs	Dormitory Expansion	48	Mr. Kaggwa	2026-02-11 06:47:04.065	2026-02-11 06:47:04.065	ACTIVE
cmlho6qdl0002v1kb0hydrj95	Playground Renovation at KPM	45	Mr. Wagaba	2026-02-11 06:49:49.031	2026-02-11 06:49:49.031	ACTIVE
cmlho9m1f0003v1kbhzj6sy2r	New BUilding Construction at KPS	76	Eng. Mukasa	2026-02-11 06:52:03.411	2026-02-11 07:48:58.203	ACTIVE
\.


--
-- Data for Name: Goal; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Goal" (id, title, description, category, "targetValue", "currentValue", unit, progress, year, term, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: IncomeSource; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."IncomeSource" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmlebm4ag009s8fau95z03hl4	Uniforms	t	2026-02-08 22:34:33.4	2026-02-08 22:34:33.4
cmlebm4ak009t8fauwz99k0a7	Swimming	t	2026-02-08 22:34:33.404	2026-02-08 22:34:33.404
cmlebm4ao009u8faubyuvb02c	Canteen	t	2026-02-08 22:34:33.408	2026-02-08 22:34:33.408
cmlebm4as009v8faumj17q9kk	Saving Scheme	t	2026-02-08 22:34:33.412	2026-02-08 22:34:33.412
cmlg974180000xnw2gfuhi11v	All Income collection	t	2026-02-10 07:02:26.348	2026-02-10 07:02:26.348
\.


--
-- Data for Name: KPIData; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."KPIData" (id, month, year, "feesCollectionPercent", "schoolsExpenditurePercent", "infrastructurePercent", "totalEnrollment", "theologyEnrollment", "p7PrepExamsPercent", "createdAt", "updatedAt") FROM stdin;
cmlebm3c8000g8fauhwygshr2	1	2026	78	85	45	1250	180	72	2026-02-08 22:34:32.168	2026-02-08 22:34:32.168
cmlebm3cf000h8fau0l7ob23m	2	2026	82	88	50	1265	185	75	2026-02-08 22:34:32.175	2026-02-08 22:34:32.175
cmlebm3cl000i8faujs9x86fw	3	2026	85	90	55	1280	190	78	2026-02-08 22:34:32.181	2026-02-08 22:34:32.181
cmlebm3cr000j8fau3xd8gy54	4	2026	88	87	60	1295	195	80	2026-02-08 22:34:32.187	2026-02-08 22:34:32.187
cmlebm3cw000k8fauux41llwb	5	2026	90	85	65	1310	200	82	2026-02-08 22:34:32.193	2026-02-08 22:34:32.193
cmlebm3d3000l8fau9n16cabd	6	2026	92	83	70	1325	205	85	2026-02-08 22:34:32.199	2026-02-08 22:34:32.199
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Message" (id, content, "senderId", "recipientId", "isRead", "readAt", "createdAt", "updatedAt", "attachmentName", "attachmentType", "attachmentUrl") FROM stdin;
cmlgp5v5p0001tdtyr5aenwtd	yes	cmlebm36q00008faulhyznd0j	cmlebm39t00018fauhrqcvv6e	t	2026-02-10 14:39:42.264	2026-02-10 14:29:22.044	2026-02-10 14:39:42.266	\N	\N	\N
cmlfrbxnq00034gbndx0in9kq	hlo	cmlebm36q00008faulhyznd0j	cmlebm39t00018fauhrqcvv6e	t	2026-02-10 14:39:42.267	2026-02-09 22:42:18.278	2026-02-10 14:39:42.268	\N	\N	\N
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Notification" (id, type, title, message, data, "userId", "isRead", "readAt", "createdAt", "updatedAt") FROM stdin;
cmlesjjg10001u457yeulwjrn	REPORT_PUBLISHED	GM posted Week 3 2026 Report	Weekly report for Week 3, 2026 has been published	{"reportId":"cmlebm3c2000f8fau3v9uxxyo","weekNumber":3,"year":2026}	cmlebm39t00018fauhrqcvv6e	t	2026-02-09 22:42:53.467	2026-02-09 06:28:26.545	2026-02-09 22:42:53.47
cmlfrbxo400054gbnkbkky6er	MESSAGE	New message from General Manager	hlo	{"messageId":"cmlfrbxnq00034gbndx0in9kq","senderId":"cmlebm36q00008faulhyznd0j"}	cmlebm39t00018fauhrqcvv6e	t	2026-02-09 22:42:58.768	2026-02-09 22:42:18.292	2026-02-09 22:42:58.776
cmlgp5v5y0003tdtypz4takhl	MESSAGE	New message from General Manager	yes	{"messageId":"cmlgp5v5p0001tdtyr5aenwtd","senderId":"cmlebm36q00008faulhyznd0j"}	cmlebm39t00018fauhrqcvv6e	t	2026-02-10 14:39:34.559	2026-02-10 14:29:22.054	2026-02-10 14:39:34.563
cmlgpjdon000310vkkh2c15am	REPORT_COMMENT	Board Trustee liked a report section	Thumbs up on section: fees-collection	{"reactionId":"cmlgpjdob000110vkg8cjgipk","sectionId":"fees-collection","weeklyReportId":"cmlebm3c2000f8fau3v9uxxyo"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 06:34:00.377	2026-02-10 14:39:52.583	2026-02-11 06:34:00.379
cmlhv5vnt00036mk4vu1406a7	REPORT_COMMENT	Board Trustee commented	why low	{"reactionId":"cmlhv5vnj00016mk45ytftwbn","sectionId":"fees-collection","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 10:06:30.611	2026-02-11 10:05:06.569	2026-02-11 10:06:30.613
cmlhv5yv500076mk4lvomouyk	REPORT_COMMENT	Board Trustee liked a report section	Thumbs up on section: fees-collection	{"reactionId":"cmlhv5yuy00056mk4m6zhohnd","sectionId":"fees-collection","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 10:06:35.697	2026-02-11 10:05:10.722	2026-02-11 10:06:35.699
cmlhv69bs000b6mk47athmpn9	REPORT_COMMENT	Board Trustee commented	reflect	{"reactionId":"cmlhv69bm00096mk4nqx1l8sk","sectionId":"schools-expenditure","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 10:06:40.761	2026-02-11 10:05:24.281	2026-02-11 10:06:40.762
cmlhy4qt3000362jhjpuc2v21	REPORT_COMMENT	C. Trustee liked a report section	Thumbs up on section: schools-expenditure	{"reactionId":"cmlhy4qsv000162jhy9ua667g","sectionId":"schools-expenditure","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 11:28:50.387	2026-02-11 11:28:12.471	2026-02-11 11:28:50.389
cmlhy52en000762jhge6a5tb8	REPORT_COMMENT	C. Trustee commented	previous	{"reactionId":"cmlhy52eh000562jho5y9puz7","sectionId":"theology-enrollment","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 11:28:55.456	2026-02-11 11:28:27.504	2026-02-11 11:28:55.457
cmlhy64q9000a62jhgfl1citw	REPORT_COMMENT	GM posted a comment	test	{"reactionId":"cmlhy64q1000962jhkelwfgxh","sectionId":"fees-collection","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm39t00018fauhrqcvv6e	t	2026-02-11 11:29:43.354	2026-02-11 11:29:17.169	2026-02-11 11:29:43.356
cmlhy8fq3000e62jhphfc70b9	REPORT_COMMENT	C. Trustee commented	waiting	{"reactionId":"cmlhy8fpu000c62jhb6pujdwj","sectionId":"event-cmlebm4cp00af8fauexu82cpo","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 11:40:53.816	2026-02-11 11:31:04.731	2026-02-11 11:40:53.818
cmlhz48jd000i62jhzys8ehqm	REPORT_COMMENT	C. Trustee commented	where is the challenge?	{"reactionId":"cmlhz48j3000g62jhnmfx1cc5","sectionId":"infrastructure","weeklyReportId":"cmlht4cvi00001086il9q9ra7"}	cmlebm36q00008faulhyznd0j	t	2026-02-11 11:56:09.34	2026-02-11 11:55:48.409	2026-02-11 11:56:09.342
\.


--
-- Data for Name: OrganizationalGoal; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."OrganizationalGoal" (id, title, description, category, "targetValue", "currentValue", unit, year, term, progress, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OtherIncome; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."OtherIncome" (id, year, "createdAt", "updatedAt", source, percentage, month, amount, term, week) FROM stdin;
cmlg97jxv0001xnw23ds996d4	2024	2026-02-10 07:02:46.963	2026-02-10 07:02:46.963	All Income collection	99.6	2	0	1	\N
cmlg98bqp0002xnw2mw8n0wm3	2024	2026-02-10 07:03:22.993	2026-02-10 07:03:22.993	All Income collection	99.9	2	0	2	\N
cmlg98ljy0003xnw2jmv267gg	2024	2026-02-10 07:03:35.71	2026-02-10 07:03:35.71	All Income collection	99.3	2	0	3	\N
cmlg98wxs0004xnw2k6tws21q	2025	2026-02-10 07:03:50.465	2026-02-10 07:04:14.036	All Income collection	0	2	99.99	3	\N
cmlg99ss50005xnw27aj3301d	2025	2026-02-10 07:04:31.733	2026-02-10 07:04:31.733	All Income collection	99.7	2	0	2	\N
cmlg9a10d0006xnw2cwlieba8	2025	2026-02-10 07:04:42.397	2026-02-10 07:04:42.397	All Income collection	99.2	2	0	1	\N
\.


--
-- Data for Name: P6PromotionResult; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."P6PromotionResult" (id, school, year, "setNumber", popn, absences, "actualPopn", agg4, "divisionI", "divisionII", "divisionIII", "divisionIV", ungraded, api, rank, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: P7PleResult; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."P7PleResult" (id, school, year, popn, agg4, "divisionI", "divisionII", "divisionIII", "divisionIV", "divisionU", api, rank, "createdAt", "updatedAt") FROM stdin;
cmlf541hr000ytnhxu5ayj7l7	KISASI	2023	133	1	95	38	0	0	0	357.8947368421053	9th	2026-02-09 12:20:18.447	2026-02-09 12:20:19.232
cmlf541m70010tnhx5rfav3ux	OLD K'LA	2023	194	0	114	78	2	0	0	293.8144329896907	10th	2026-02-09 12:20:18.607	2026-02-09 12:20:19.232
cmlf540p0000mtnhx9t7zhbtp	FAIRWAYS	2024	81	0	76	5	0	0	0	469.1358024691358	1st	2026-02-09 12:20:17.412	2026-02-09 12:20:18.279
cmlf5417j000utnhxf8x20ko7	KPS	2024	91	0	75	16	0	0	0	412.0879120879121	2nd	2026-02-09 12:20:18.08	2026-02-09 12:20:18.279
cmlf540y0000qtnhxkvyrcszg	KITINTALE	2024	62	0	50	12	0	0	0	403.2258064516129	3rd	2026-02-09 12:20:17.736	2026-02-09 12:20:18.279
cmlf540r6000ntnhxnvo9tio2	KISASI	2024	121	0	97	24	0	0	0	400.8264462809917	4th	2026-02-09 12:20:17.49	2026-02-09 12:20:18.279
cmlf54159000ttnhxi61bd676	MENGO	2024	147	0	105	42	0	0	0	357.1428571428572	5th	2026-02-09 12:20:17.997	2026-02-09 12:20:18.279
cmlf537hm0000tnhxj74kvol9	FAIRWAYS	2025	54	0	52	2	0	0	0	481.4814814814815	1st	2026-02-09 12:19:39.562	2026-02-09 12:20:17.329
cmlf5410b000rtnhxhwovr8o9	WINSTON	2024	130	0	90	40	0	0	0	346.1538461538461	6th	2026-02-09 12:20:17.82	2026-02-09 12:20:18.279
cmlf537jr0001tnhx5gus428h	KISASI	2025	122	1	113	9	0	0	0	463.9344262295082	2nd	2026-02-09 12:19:39.639	2026-02-09 12:20:17.329
cmlf537lh0002tnhx593qyz6h	KPM	2025	75	0	67	8	0	0	0	446.6666666666666	3rd	2026-02-09 12:19:39.701	2026-02-09 12:20:17.329
cmlf537n90003tnhxx24c4u8a	OLD K'LA	2025	132	1	87	45	0	0	0	330.3030303030303	4th	2026-02-09 12:19:39.766	2026-02-09 12:20:17.329
cmlf537oz0004tnhxz2d1jg49	KITINTALE	2025	75	0	47	27	1	0	0	313.3333333333334	5th	2026-02-09 12:19:39.827	2026-02-09 12:20:17.329
cmlf537r40005tnhxmkl0fp7o	WINSTON	2025	98	0	61	37	0	0	0	311.2244897959184	6th	2026-02-09 12:19:39.904	2026-02-09 12:20:17.329
cmlf540tc000otnhxevmovhj5	KPM	2024	86	0	56	30	0	0	0	325.5813953488372	7th	2026-02-09 12:20:17.568	2026-02-09 12:20:18.279
cmlf537st0006tnhxafe2sbgv	NAKASERO	2025	80	0	49	30	1	0	0	306.25	7th	2026-02-09 12:19:39.965	2026-02-09 12:20:17.329
cmlf537uz0007tnhxxwdh6fer	MENGO	2025	150	0	89	60	1	0	0	296.6666666666667	8th	2026-02-09 12:19:40.044	2026-02-09 12:20:17.329
cmlf537xk0008tnhxebv3mck6	KPS	2025	76	0	45	31	0	0	0	296.0526315789473	9th	2026-02-09 12:19:40.137	2026-02-09 12:20:17.329
cmlf537zv0009tnhxlrjy9u9h	CPS	2025	201	0	95	104	1	1	0	236.318407960199	10th	2026-02-09 12:19:40.219	2026-02-09 12:20:17.329
cmlf5382c000atnhxc4ltwimc	KIRA	2025	38	0	15	23	0	0	0	197.3684210526316	11th	2026-02-09 12:19:40.309	2026-02-09 12:20:17.329
cmlf5412q000stnhxm5po4rca	NAKASERO	2024	90	0	58	32	0	0	0	322.2222222222222	8th	2026-02-09 12:20:17.906	2026-02-09 12:20:18.279
cmlf541a3000vtnhxe21aesdi	CPS	2024	161	3	102	59	0	0	0	318.6335403726708	9th	2026-02-09 12:20:18.172	2026-02-09 12:20:18.279
cmlf540vq000ptnhxpdh526j0	OLD K'LA	2024	172	1	101	71	0	0	0	294.1860465116279	10th	2026-02-09 12:20:17.654	2026-02-09 12:20:18.279
cmlf541ck000wtnhxjuhof68u	KIRA	2024	19	0	6	13	0	0	0	157.8947368421053	11th	2026-02-09 12:20:18.26	2026-02-09 12:20:18.279
cmlf5420k0015tnhxo84ym7e2	KPS	2023	76	1	72	4	0	0	0	475	1st	2026-02-09 12:20:19.125	2026-02-09 12:20:19.232
cmlf541r10012tnhxnkdj1924	WINSTON	2023	93	1	81	12	0	0	0	436.5591397849462	2nd	2026-02-09 12:20:18.781	2026-02-09 12:20:19.232
cmlf541wv0014tnhx69jtcns3	MENGO	2023	158	2	135	23	0	0	0	428.4810126582279	3rd	2026-02-09 12:20:18.991	2026-02-09 12:20:19.232
cmlf541tq0013tnhxcgj46mfr	NAKASERO	2023	106	0	90	16	0	0	0	424.5283018867925	4th	2026-02-09 12:20:18.878	2026-02-09 12:20:19.232
cmlf541fi000xtnhxetqiyim3	FAIRWAYS	2023	77	0	64	13	0	0	0	415.5844155844156	5th	2026-02-09 12:20:18.366	2026-02-09 12:20:19.232
cmlf541oj0011tnhxrihp8x5l	KITINTALE	2023	57	0	46	11	0	0	0	403.5087719298245	6th	2026-02-09 12:20:18.692	2026-02-09 12:20:19.232
cmlf541jw000ztnhxr32d5394	KPM	2023	107	0	80	27	0	0	0	373.8317757009345	7th	2026-02-09 12:20:18.524	2026-02-09 12:20:19.232
cmlf542340016tnhxl4kjjrgv	CPS	2023	167	3	124	42	1	0	0	373.0538922155689	8th	2026-02-09 12:20:19.216	2026-02-09 12:20:19.232
\.


--
-- Data for Name: P7PrepPerformance; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."P7PrepPerformance" (id, year, prep1, prep2, prep3, prep4, prep5, prep6, prep7, prep8, prep9, "createdAt", "updatedAt", "p6Promotion", ple) FROM stdin;
\.


--
-- Data for Name: P7PrepResult; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."P7PrepResult" (id, school, "prepNumber", term, year, enrollment, "divisionI", "divisionII", "divisionIII", "divisionIV", "averageScore", "createdAt", "updatedAt", agg4, "divisionU") FROM stdin;
cml71hwgo002rjfsb38t0hca3	Winston	1	1	2025	106	56	47	1	1	87.6	2026-02-03 20:16:57.239	2026-02-03 20:16:57.239	0	0
cml71hwio002sjfsbh1z32880	KISASI	1	1	2025	125	58	55	9	2	84.1	2026-02-03 20:16:57.312	2026-02-03 20:16:57.312	0	0
cml71hwkb002tjfsbs4mmhoo1	Mengo	1	1	2025	160	89	64	2	4	87.4	2026-02-03 20:16:57.371	2026-02-03 20:16:57.371	0	0
cml71hwlg002ujfsb7m7i4sz2	KPS	1	1	2025	84	49	30	3	1	88.3	2026-02-03 20:16:57.412	2026-02-03 20:16:57.412	0	0
cml71hwmu002vjfsbdugnluk8	Nakasero	1	1	2025	83	45	28	5	1	87	2026-02-03 20:16:57.462	2026-02-03 20:16:57.462	0	0
cml71hwo8002wjfsbsfkp9xdm	Fairways	1	1	2025	55	31	19	2	2	86.6	2026-02-03 20:16:57.512	2026-02-03 20:16:57.512	0	0
cml71hwpk002xjfsbvcgsh35m	Old K'LA	1	1	2025	147	68	65	10	1	84.7	2026-02-03 20:16:57.561	2026-02-03 20:16:57.561	0	0
cml71hwqs002yjfsbwdkar9o3	KPM	1	1	2025	87	36	33	8	4	81.2	2026-02-03 20:16:57.603	2026-02-03 20:16:57.603	0	0
cml71hwt3002zjfsbrgworhsb	CPS	1	1	2025	211	80	87	15	15	79.4	2026-02-03 20:16:57.687	2026-02-03 20:16:57.687	0	0
cml71hwv10030jfsb91uvx9en	Kira	1	1	2025	37	8	27	1	0	79.9	2026-02-03 20:16:57.758	2026-02-03 20:16:57.758	0	0
cml71hwxa0031jfsbqf038i8i	Kitintale	1	1	2025	80	15	48	7	3	75.7	2026-02-03 20:16:57.838	2026-02-03 20:16:57.838	0	0
cml71hwz60032jfsbrsout01v	Winston	2	1	2025	106	63	37	0	1	90.1	2026-02-03 20:16:57.906	2026-02-03 20:16:57.906	0	0
cml71hx0e0033jfsbbo9hkpdx	KISASI	2	1	2025	125	72	45	6	0	88.4	2026-02-03 20:16:57.95	2026-02-03 20:16:57.95	0	0
cml71hx250034jfsb8cq6kfw6	Mengo	2	1	2025	160	100	52	4	1	90	2026-02-03 20:16:58.012	2026-02-03 20:16:58.012	0	0
cml71hx3s0035jfsbepjr6idw	KPS	2	1	2025	84	50	30	1	1	89.3	2026-02-03 20:16:58.072	2026-02-03 20:16:58.072	0	0
cml71hx540036jfsbwkagdplw	Nakasero	2	1	2025	83	50	25	4	2	88	2026-02-03 20:16:58.119	2026-02-03 20:16:58.119	0	0
cml71hx680037jfsbnay3ktxn	Fairways	2	1	2025	55	36	15	4	0	89.5	2026-02-03 20:16:58.16	2026-02-03 20:16:58.16	0	0
cml71hx8e0038jfsbpdwcfygb	Old K'LA	2	1	2025	147	87	50	6	3	87.8	2026-02-03 20:16:58.238	2026-02-03 20:16:58.238	0	0
cml71hxaa0039jfsblbnjf7x1	KPM	2	1	2025	87	40	36	3	2	85.2	2026-02-03 20:16:58.306	2026-02-03 20:16:58.306	0	0
cml71hxbw003ajfsblysgrtl7	CPS	2	1	2025	211	83	91	12	9	81.8	2026-02-03 20:16:58.364	2026-02-03 20:16:58.364	0	0
cml71hxe1003bjfsb3bznxmp6	Kira	2	1	2025	38	11	23	2	1	79.7	2026-02-03 20:16:58.441	2026-02-03 20:16:58.441	0	0
cml71hxft003cjfsbljzqm3ic	Kitintale	2	1	2025	81	27	37	4	2	81.8	2026-02-03 20:16:58.505	2026-02-03 20:16:58.505	0	0
cml71hxhh003djfsbp42mlmeu	Winston	3	1	2025	106	68	36	0	1	90.7	2026-02-03 20:16:58.565	2026-02-03 20:16:58.565	0	0
cml71hxit003ejfsb8re4o8vd	KISASI	3	1	2025	125	74	43	6	0	88.8	2026-02-03 20:16:58.611	2026-02-03 20:16:58.611	0	0
cml71hxkj003fjfsba99wzro5	Mengo	3	1	2025	160	94	60	0	4	88.6	2026-02-03 20:16:58.675	2026-02-03 20:16:58.675	0	0
cml71hxlq003gjfsbxcfeaxgw	KPS	3	1	2025	83	48	31	2	0	89.2	2026-02-03 20:16:58.718	2026-02-03 20:16:58.718	0	0
cml71hxmw003hjfsb3a6ctzwn	Nakasero	3	1	2025	83	49	26	3	3	87.3	2026-02-03 20:16:58.761	2026-02-03 20:16:58.761	0	0
cml71hxo4003ijfsb1kxpqnrv	Fairways	3	1	2025	55	32	17	4	2	85.9	2026-02-03 20:16:58.804	2026-02-03 20:16:58.804	0	0
cml71hxpf003jjfsbmvvtgedf	Old K'LA	3	1	2025	147	78	59	6	3	86.3	2026-02-03 20:16:58.851	2026-02-03 20:16:58.851	0	0
cml71hxqz003kjfsbhidl2rvb	KPM	3	1	2025	87	44	31	5	1	86.4	2026-02-03 20:16:58.908	2026-02-03 20:16:58.908	0	0
cml71hxrz003ljfsbgf7s1syz	CPS	3	1	2025	210	89	80	16	17	79.8	2026-02-03 20:16:58.944	2026-02-03 20:16:58.944	0	0
cml71hxtp003mjfsbacmvq43p	Kira	3	1	2025	38	14	19	3	1	81.1	2026-02-03 20:16:59.005	2026-02-03 20:16:59.005	0	0
cml71hxuz003njfsb3umbh021	Kitintale	3	1	2025	81	28	38	6	2	81.1	2026-02-03 20:16:59.051	2026-02-03 20:16:59.051	0	0
cml71hxwb003ojfsbqthe9iwn	KPM	4	2	2025	85	61	17	3	1	92.1	2026-02-03 20:16:59.099	2026-02-03 20:16:59.099	0	0
cml71hxxq003pjfsbhrb2fe85	Fairways	4	2	2025	55	34	16	1	1	89.9	2026-02-03 20:16:59.15	2026-02-03 20:16:59.15	0	0
cml71hxz0003qjfsbvx38ewmd	Winston	4	2	2025	105	88	14	1	2	94.8	2026-02-03 20:16:59.196	2026-02-03 20:16:59.196	0	0
cml71hy01003rjfsbam4d4ayc	KISASI	4	2	2025	123	88	31	2	1	92.2	2026-02-03 20:16:59.233	2026-02-03 20:16:59.233	0	0
cml71hy1h003sjfsbdnaw02w3	Mengo	4	2	2025	157	108	43	0	1	92.4	2026-02-03 20:16:59.285	2026-02-03 20:16:59.285	0	0
cml71hy30003tjfsbekztadcz	Nakasero	4	2	2025	82	55	20	4	0	91.1	2026-02-03 20:16:59.341	2026-02-03 20:16:59.341	0	0
cml71hy4b003ujfsb6jbd8xhe	KPS	4	2	2025	82	58	23	0	0	92.9	2026-02-03 20:16:59.387	2026-02-03 20:16:59.387	0	0
cml71hy5n003vjfsb8uec916p	Old K'LA	4	2	2025	146	93	44	2	1	90.9	2026-02-03 20:16:59.435	2026-02-03 20:16:59.435	0	0
cml71hy6v003wjfsbtkq2jzhf	Kira	4	2	2025	38	20	16	0	1	87.2	2026-02-03 20:16:59.48	2026-02-03 20:16:59.48	0	0
cml71hy8i003xjfsbkydt32e9	Kitintale	4	2	2025	79	36	30	3	1	86.1	2026-02-03 20:16:59.538	2026-02-03 20:16:59.538	0	0
cml71hy9d003yjfsbz0a192jw	CPS	4	2	2025	214	119	68	16	2	87.1	2026-02-03 20:16:59.57	2026-02-03 20:16:59.57	0	0
cml71hyar003zjfsb2ak89p38	KPM	5	2	2025	85	66	13	2	1	93.9	2026-02-03 20:16:59.619	2026-02-03 20:16:59.619	0	0
cml71hybz0040jfsbxyy7wyb3	Fairways	5	2	2025	56	42	12	2	0	92.9	2026-02-03 20:16:59.661	2026-02-03 20:16:59.661	0	0
cml71hydx0041jfsbhn5zt643	Winston	5	2	2025	105	82	17	3	1	93.7	2026-02-03 20:16:59.733	2026-02-03 20:16:59.733	0	0
cml71hyft0042jfsbkmkhm9ja	KISASI	5	2	2025	123	93	28	0	2	93.1	2026-02-03 20:16:59.801	2026-02-03 20:16:59.801	0	0
cml71hyhf0043jfsb3ruqyi9r	Mengo	5	2	2025	157	117	34	4	0	93.2	2026-02-03 20:16:59.859	2026-02-03 20:16:59.859	0	0
cml71hyin0044jfsb441k6158	Nakasero	5	2	2025	82	58	19	3	0	92.2	2026-02-03 20:16:59.903	2026-02-03 20:16:59.903	0	0
cml71hyk70045jfsbhy0ahgfh	KPS	5	2	2025	81	62	19	0	0	94.1	2026-02-03 20:16:59.959	2026-02-03 20:16:59.959	0	0
cml71hym10046jfsbfj9bc82w	Old K'LA	5	2	2025	146	101	38	1	0	92.9	2026-02-03 20:17:00.026	2026-02-03 20:17:00.026	0	0
cml71hynf0047jfsb3p7nvbhw	Kira	5	2	2025	38	23	12	3	0	88.2	2026-02-03 20:17:00.076	2026-02-03 20:17:00.076	0	0
cml71hyop0048jfsbxl5yzu47	Kitintale	5	2	2025	79	31	32	6	2	82.4	2026-02-03 20:17:00.122	2026-02-03 20:17:00.122	0	0
cml71hyq20049jfsbd1zgsl9p	CPS	5	2	2025	214	117	82	6	3	87.6	2026-02-03 20:17:00.17	2026-02-03 20:17:00.17	0	0
cml71hyrm004ajfsbi6htxuio	KPM	6	2	2025	85	68	12	1	1	94.8	2026-02-03 20:17:00.226	2026-02-03 20:17:00.226	0	0
cml71hyt0004bjfsbrj3g6ed7	Fairways	6	2	2025	56	42	12	2	0	92.9	2026-02-03 20:17:00.277	2026-02-03 20:17:00.277	0	0
cml71hyuf004cjfsb43z2zqop	Winston	6	2	2025	105	75	24	4	0	92.2	2026-02-03 20:17:00.327	2026-02-03 20:17:00.327	0	0
cml71hyvl004djfsbapxqz5ub	KISASI	6	2	2025	123	91	24	7	0	92.2	2026-02-03 20:17:00.37	2026-02-03 20:17:00.37	0	0
cml71hywq004ejfsbl3wli1s7	Mengo	6	2	2025	157	105	43	7	2	90	2026-02-03 20:17:00.41	2026-02-03 20:17:00.41	0	0
cml71hyxt004fjfsbf899505j	Nakasero	6	2	2025	82	53	20	6	1	89.1	2026-02-03 20:17:00.449	2026-02-03 20:17:00.449	0	0
cml71hyzd004gjfsbei32vcfw	KPS	6	2	2025	81	53	24	4	0	90.1	2026-02-03 20:17:00.505	2026-02-03 20:17:00.505	0	0
cml71hz0h004hjfsbrbkfgotm	Old K'LA	6	2	2025	146	90	44	10	1	88.4	2026-02-03 20:17:00.546	2026-02-03 20:17:00.546	0	0
cml71hz1h004ijfsblrm1d56x	Kira	6	2	2025	38	22	11	4	0	87.2	2026-02-03 20:17:00.581	2026-02-03 20:17:00.581	0	0
cml71hz2x004jjfsbqp92lotc	Kitintale	6	2	2025	78	44	21	11	2	84.3	2026-02-03 20:17:00.633	2026-02-03 20:17:00.633	0	0
cml71hz4l004kjfsb8xk7rqw9	CPS	6	2	2025	214	112	77	12	7	85.3	2026-02-03 20:17:00.693	2026-02-03 20:17:00.693	0	0
cml71hz6h004ljfsbvo40aul9	KPS	7	3	2025	81	32	30	17	1	79.1	2026-02-03 20:17:00.761	2026-02-03 20:17:00.761	0	0
cml71hz7p004mjfsb0wdhbxf7	Winston	7	3	2025	104	46	37	18	3	80.3	2026-02-03 20:17:00.805	2026-02-03 20:17:00.805	0	0
cml71hz8z004njfsbferqxaei	KISASI	7	3	2025	123	47	45	29	0	78.7	2026-02-03 20:17:00.852	2026-02-03 20:17:00.852	0	0
cml71hza5004ojfsbeza757zc	Fairways	7	3	2025	56	19	21	15	1	75.9	2026-02-03 20:17:00.893	2026-02-03 20:17:00.893	0	0
cml71hzb2004pjfsbikg7vpt9	KPM	7	3	2025	85	32	32	15	1	79.7	2026-02-03 20:17:00.926	2026-02-03 20:17:00.926	0	0
cml71hzcg004qjfsbsan4jhj5	Mengo	7	3	2025	157	56	45	40	2	77.1	2026-02-03 20:17:00.976	2026-02-03 20:17:00.976	0	0
cml71hze0004rjfsbqmjz3qlm	Nakasero	7	3	2025	82	33	24	18	1	79.3	2026-02-03 20:17:01.033	2026-02-03 20:17:01.033	0	0
cml71hzf7004sjfsbi93uhi5z	Old K'LA	7	3	2025	146	42	65	30	6	75	2026-02-03 20:17:01.075	2026-02-03 20:17:01.075	0	0
cml71hzgc004tjfsbor0l1rfw	Kira	7	3	2025	38	9	17	12	0	73	2026-02-03 20:17:01.116	2026-02-03 20:17:01.116	0	0
cml71hzhb004ujfsbf15bay2p	CPS	7	3	2025	216	84	58	54	13	75.5	2026-02-03 20:17:01.151	2026-02-03 20:17:01.151	0	0
cml71hzin004vjfsbyzoonmdk	Kitintale	7	3	2025	78	18	19	31	3	68.3	2026-02-03 20:17:01.199	2026-02-03 20:17:01.199	0	0
cml71hzju004wjfsbop1k6po6	KPS	8	3	2025	81	66	13	2	0	94.8	2026-02-03 20:17:01.242	2026-02-03 20:17:01.242	0	0
cml71hzlg004xjfsb641kwu23	Winston	8	3	2025	104	78	20	6	0	92.3	2026-02-03 20:17:01.301	2026-02-03 20:17:01.301	0	0
cml71hzmx004yjfsbqmp6psj1	KISASI	8	3	2025	123	92	24	5	1	92.4	2026-02-03 20:17:01.353	2026-02-03 20:17:01.353	0	0
cml71hznx004zjfsbnksy5r8c	Fairways	8	3	2025	56	35	15	2	1	89.6	2026-02-03 20:17:01.389	2026-02-03 20:17:01.389	0	0
cml71hzp90050jfsbrbev1lu5	KPM	8	3	2025	85	59	14	2	3	91.3	2026-02-03 20:17:01.438	2026-02-03 20:17:01.438	0	0
cml71hzqf0051jfsbqypku60w	Mengo	8	3	2025	157	111	35	4	1	92.4	2026-02-03 20:17:01.48	2026-02-03 20:17:01.48	0	0
cml71hzrs0052jfsb063fosr1	Nakasero	8	3	2025	82	58	17	4	2	90.4	2026-02-03 20:17:01.528	2026-02-03 20:17:01.528	0	0
cml71hztb0053jfsbqj7q7y6f	Old K'LA	8	3	2025	146	98	36	6	1	91	2026-02-03 20:17:01.583	2026-02-03 20:17:01.583	0	0
cml71hzuq0054jfsbhp1qmo5c	Kira	8	3	2025	38	23	12	2	0	89.2	2026-02-03 20:17:01.634	2026-02-03 20:17:01.634	0	0
cml71hzvt0055jfsbba0wyebs	CPS	8	3	2025	216	114	76	7	2	87.9	2026-02-03 20:17:01.674	2026-02-03 20:17:01.674	0	0
cml71hzx60056jfsbjg1jasj3	Kitintale	8	3	2025	78	32	26	9	3	81.1	2026-02-03 20:17:01.722	2026-02-03 20:17:01.722	0	0
cml71hzy20057jfsbcdhihzmv	KPS	9	3	2025	81	79	1	0	0	99.7	2026-02-03 20:17:01.755	2026-02-03 20:17:01.755	0	0
cml71hzzs0058jfsbfarr9hh0	Winston	9	3	2025	104	98	5	1	0	98.3	2026-02-03 20:17:01.816	2026-02-03 20:17:01.816	0	0
cml71i01f0059jfsb1yap97hv	KISASI	9	3	2025	123	111	11	1	0	97.4	2026-02-03 20:17:01.875	2026-02-03 20:17:01.875	0	0
cml71i02e005ajfsbhw0g6qjv	Fairways	9	3	2025	56	49	6	0	0	97.3	2026-02-03 20:17:01.911	2026-02-03 20:17:01.911	0	0
cml71i048005bjfsbezj2ajei	KPM	9	3	2025	85	70	10	2	2	94	2026-02-03 20:17:01.976	2026-02-03 20:17:01.976	0	0
cml71i05r005cjfsbzxqazdaj	Mengo	9	3	2025	157	125	27	4	0	94.4	2026-02-03 20:17:02.031	2026-02-03 20:17:02.031	0	0
cml71i074005djfsbp4huybsm	Nakasero	9	3	2025	82	65	14	2	0	94.4	2026-02-03 20:17:02.08	2026-02-03 20:17:02.08	0	0
cml71i08o005ejfsb6vlho8ob	Old K'LA	9	3	2025	146	118	24	0	0	95.8	2026-02-03 20:17:02.136	2026-02-03 20:17:02.136	0	0
cml71i09u005fjfsbeqcikxyk	Kira	9	3	2025	38	31	7	0	0	95.4	2026-02-03 20:17:02.178	2026-02-03 20:17:02.178	0	0
cml71i0ay005gjfsb4mj1yth3	CPS	9	3	2025	216	140	66	1	0	91.8	2026-02-03 20:17:02.218	2026-02-03 20:17:02.218	0	0
cml71i0by005hjfsbeda73a04	Kitintale	9	3	2025	78	51	22	4	0	90.3	2026-02-03 20:17:02.255	2026-02-03 20:17:02.255	0	0
cmlckfqqz00003cxhxmxy5fye	KPS	1	1	2024	94	64	26	3	0	91.4	2026-02-07 17:06:00.106	2026-02-07 17:06:00.106	0	0
cmlckfqt400013cxhrlq955lv	KISASI	1	1	2024	122	67	53	0	1	88.4	2026-02-07 17:06:00.184	2026-02-07 17:06:00.184	0	0
cmlckfqvi00023cxh5cg2k4bo	Mengo	1	1	2024	148	88	58	1	1	89.4	2026-02-07 17:06:00.27	2026-02-07 17:06:00.27	0	0
cmlckfr2j00033cxhv41u6q2i	Winston	1	1	2024	137	77	55	5	0	88.1	2026-02-07 17:06:00.524	2026-02-07 17:06:00.524	0	0
cmlckfr3v00043cxhwrv1eqve	CPS	1	1	2024	179	101	68	2	3	88.4	2026-02-07 17:06:00.571	2026-02-07 17:06:00.571	0	0
cmlckfr4y00053cxhgbhii1wv	Nakasero	1	1	2024	94	50	36	5	1	86.7	2026-02-07 17:06:00.61	2026-02-07 17:06:00.61	0	0
cmlckfr6a00063cxhkn509zdu	KPM	1	1	2024	86	45	36	4	0	87.1	2026-02-07 17:06:00.658	2026-02-07 17:06:00.658	0	0
cmlckfr7u00073cxh3ez9iecf	Kitintale	1	1	2024	60	31	25	4	0	86.3	2026-02-07 17:06:00.714	2026-02-07 17:06:00.714	0	0
cmlckfr9100083cxh45ymfclv	Old K'LA	1	1	2024	187	67	97	9	8	80.8	2026-02-07 17:06:00.758	2026-02-07 17:06:00.758	0	0
cmlckfra800093cxh9teuyrhn	Fairways	1	1	2024	80	38	37	1	1	86.4	2026-02-07 17:06:00.8	2026-02-07 17:06:00.8	0	0
cmlckfrb7000a3cxhwlu7kxag	Kira	1	1	2024	17	4	4	3	3	66.1	2026-02-07 17:06:00.836	2026-02-07 17:06:00.836	0	0
cmlckfrcn000b3cxhcio8zkyo	KPS	2	1	2024	93	64	27	2	0	91.7	2026-02-07 17:06:00.887	2026-02-07 17:06:00.887	0	0
cmlckfrdi000c3cxhynracmnl	KISASI	2	1	2024	121	67	50	1	2	87.9	2026-02-07 17:06:00.919	2026-02-07 17:06:00.919	0	0
cmlckfrfh000d3cxh0pp8ggzm	Mengo	2	1	2024	146	89	56	1	0	90.1	2026-02-07 17:06:00.989	2026-02-07 17:06:00.989	0	0
cmlckfrhc000e3cxhc389pjor	Winston	2	1	2024	128	77	49	1	1	89.5	2026-02-07 17:06:01.056	2026-02-07 17:06:01.056	0	0
cmlckfriw000f3cxhf85zhu26	CPS	2	1	2024	175	100	66	2	1	89.2	2026-02-07 17:06:01.112	2026-02-07 17:06:01.112	0	0
cmlckfrk3000g3cxhsc4h6wei	Nakasero	2	1	2024	94	47	40	2	5	84.3	2026-02-07 17:06:01.155	2026-02-07 17:06:01.155	0	0
cmlckfrl1000h3cxh0arh2ube	KPM	2	1	2024	86	47	34	2	1	87.8	2026-02-07 17:06:01.19	2026-02-07 17:06:01.19	0	0
cmlckfrmg000i3cxhj2rxqnm9	Kitintale	2	1	2024	62	28	32	1	1	85.1	2026-02-07 17:06:01.24	2026-02-07 17:06:01.24	0	0
cmlckfro3000j3cxhw1xc0sh3	Old K'LA	2	1	2024	184	83	87	8	4	84.2	2026-02-07 17:06:01.299	2026-02-07 17:06:01.299	0	0
cmlckfroy000k3cxhuwpui60c	Fairways	2	1	2024	71	32	33	2	2	84.4	2026-02-07 17:06:01.331	2026-02-07 17:06:01.331	0	0
cmlckfrq5000l3cxh3tknzb5v	Kira	2	1	2024	17	3	8	1	3	68.3	2026-02-07 17:06:01.373	2026-02-07 17:06:01.373	0	0
cmlckfrrp000m3cxh5024ziaj	KPS	3	1	2024	91	62	25	2	1	91.1	2026-02-07 17:06:01.429	2026-02-07 17:06:01.429	0	0
cmlckfrt9000n3cxhf8mpuvlv	KISASI	3	1	2024	120	75	40	4	1	89.4	2026-02-07 17:06:01.485	2026-02-07 17:06:01.485	0	0
cmlckfruv000o3cxhyev2g2ug	Mengo	3	1	2024	147	91	52	4	0	89.8	2026-02-07 17:06:01.543	2026-02-07 17:06:01.543	0	0
cmlckfrwk000p3cxhv4zk5zu1	Winston	3	1	2024	136	83	43	9	1	88.2	2026-02-07 17:06:01.605	2026-02-07 17:06:01.605	0	0
cmlckfrxw000q3cxhxvkbwchk	CPS	3	1	2024	178	105	48	17	4	86.5	2026-02-07 17:06:01.652	2026-02-07 17:06:01.652	0	0
cmlckfs11000r3cxh89k15hlb	Nakasero	3	1	2024	91	51	28	7	3	85.7	2026-02-07 17:06:01.766	2026-02-07 17:06:01.766	0	0
cmlckfs2f000s3cxh83f5g9og	KPM	3	1	2024	86	44	26	14	1	83.2	2026-02-07 17:06:01.816	2026-02-07 17:06:01.816	0	0
cmlckfs3b000t3cxh2miw4pux	Kitintale	3	1	2024	63	32	20	11	0	83.3	2026-02-07 17:06:01.848	2026-02-07 17:06:01.848	0	0
cmlckfs4i000u3cxhy019bisi	Old K'LA	3	1	2024	184	87	86	9	1	85.4	2026-02-07 17:06:01.89	2026-02-07 17:06:01.89	0	0
cmlckfs5z000v3cxhpnlln6xb	Fairways	3	1	2024	82	34	39	5	2	82.8	2026-02-07 17:06:01.943	2026-02-07 17:06:01.943	0	0
cmlckfs6x000w3cxh06lq9fur	Kira	3	1	2024	17	5	5	3	1	75	2026-02-07 17:06:01.978	2026-02-07 17:06:01.978	0	0
cmlckfs8g000x3cxhvg5b1l70	KPS	4	2	2024	94	66	24	3	1	91.2	2026-02-07 17:06:02.033	2026-02-07 17:06:02.033	0	0
cmlckfs9n000y3cxhh090jjky	KISASI	4	2	2024	121	77	40	3	1	89.9	2026-02-07 17:06:02.075	2026-02-07 17:06:02.075	0	0
cmlckfsal000z3cxhm3fzh8mw	Mengo	4	2	2024	146	91	49	5	0	89.8	2026-02-07 17:06:02.109	2026-02-07 17:06:02.109	0	0
cmlckfsbv00103cxhfuhkhhcm	Winston	4	2	2024	134	70	53	9	0	86.6	2026-02-07 17:06:02.155	2026-02-07 17:06:02.155	0	0
cmlckfscx00113cxh84tyt8s8	CPS	4	2	2024	180	108	52	14	4	87.1	2026-02-07 17:06:02.194	2026-02-07 17:06:02.194	0	0
cmlckfse300123cxh3n41e2ib	Nakasero	4	2	2024	94	50	35	7	2	85.4	2026-02-07 17:06:02.235	2026-02-07 17:06:02.235	0	0
cmlckfsft00133cxhdfakxl8t	KPM	4	2	2024	86	47	24	14	1	84	2026-02-07 17:06:02.297	2026-02-07 17:06:02.297	0	0
cmlckfsh600143cxhzhqt2g0y	Kitintale	4	2	2024	63	34	21	8	0	85.3	2026-02-07 17:06:02.347	2026-02-07 17:06:02.347	0	0
cmlckfsib00153cxh3jvf2ez1	Old K'LA	4	2	2024	186	75	87	18	5	81.4	2026-02-07 17:06:02.388	2026-02-07 17:06:02.388	0	0
cmlckfsjf00163cxhv9oql7p9	Fairways	4	2	2024	82	38	32	9	2	82.7	2026-02-07 17:06:02.427	2026-02-07 17:06:02.427	0	0
cmlckfskm00173cxhtr17js94	Kira	4	2	2024	19	4	8	5	2	68.4	2026-02-07 17:06:02.47	2026-02-07 17:06:02.47	0	0
cmlckfsm900183cxhf6qb0ccu	KPS	5	2	2024	94	61	31	1	1	90.4	2026-02-07 17:06:02.53	2026-02-07 17:06:02.53	0	0
cmlckfsnh00193cxhv6670qmw	KISASI	5	2	2024	120	70	46	3	1	88.5	2026-02-07 17:06:02.573	2026-02-07 17:06:02.573	0	0
cmlckfsp4001a3cxhzwan6ux3	Mengo	5	2	2024	147	82	62	2	1	88.3	2026-02-07 17:06:02.632	2026-02-07 17:06:02.632	0	0
cmlckfsqi001b3cxhdhvegetu	Winston	5	2	2024	132	57	62	9	4	82.6	2026-02-07 17:06:02.682	2026-02-07 17:06:02.682	0	0
cmlckfsrt001c3cxh05crz6v5	CPS	5	2	2024	179	89	69	9	8	84.1	2026-02-07 17:06:02.73	2026-02-07 17:06:02.73	0	0
cmlckfsss001d3cxht917vzdt	Nakasero	5	2	2024	93	49	38	2	3	86.1	2026-02-07 17:06:02.764	2026-02-07 17:06:02.764	0	0
cmlckfsu6001e3cxhnpeq16j1	KPM	5	2	2024	84	40	33	6	4	82.8	2026-02-07 17:06:02.814	2026-02-07 17:06:02.814	0	0
cmlckfswk001f3cxhfrgbvvns	Kitintale	5	2	2024	62	27	28	6	1	82.7	2026-02-07 17:06:02.901	2026-02-07 17:06:02.901	0	0
cmlckfsy4001g3cxhtv5pt2wg	Old K'LA	5	2	2024	183	70	92	8	7	81.8	2026-02-07 17:06:02.956	2026-02-07 17:06:02.956	0	0
cmlckft02001h3cxhbkhxfwrg	Fairways	5	2	2024	81	33	44	2	1	84.1	2026-02-07 17:06:03.026	2026-02-07 17:06:03.026	0	0
cmlckft1f001i3cxhvcr0x19f	Kira	5	2	2024	19	4	8	3	3	68.1	2026-02-07 17:06:03.075	2026-02-07 17:06:03.075	0	0
cmlckft2v001j3cxh6g50tqh4	KPS	6	2	2024	91	73	17	1	0	94.8	2026-02-07 17:06:03.127	2026-02-07 17:06:03.127	0	0
cmlckft3o001k3cxhnuz8gam6	KISASI	6	2	2024	121	86	32	3	0	92.1	2026-02-07 17:06:03.156	2026-02-07 17:06:03.156	0	0
cmlckft50001l3cxh7mgnmml4	Mengo	6	2	2024	147	100	42	5	0	91.2	2026-02-07 17:06:03.204	2026-02-07 17:06:03.204	0	0
cmlckft63001m3cxhzudal95c	Winston	6	2	2024	135	81	48	6	0	88.9	2026-02-07 17:06:03.243	2026-02-07 17:06:03.243	0	0
cmlckft78001n3cxhgv8ktjuz	CPS	6	2	2024	179	103	60	9	4	87.2	2026-02-07 17:06:03.284	2026-02-07 17:06:03.284	0	0
cmlckft8l001o3cxh5117hbaa	Nakasero	6	2	2024	94	55	30	5	4	86.2	2026-02-07 17:06:03.333	2026-02-07 17:06:03.333	0	0
cmlckft9u001p3cxhwv8fq6p3	KPM	6	2	2024	86	48	26	9	3	84.6	2026-02-07 17:06:03.378	2026-02-07 17:06:03.378	0	0
cmlckftaz001q3cxhnm6kav4d	Kitintale	6	2	2024	62	33	24	5	0	86.3	2026-02-07 17:06:03.42	2026-02-07 17:06:03.42	0	0
cmlckftbz001r3cxhv2l7d1ij	Old K'LA	6	2	2024	187	87	77	15	6	83.1	2026-02-07 17:06:03.455	2026-02-07 17:06:03.455	0	0
cmlckftdg001s3cxhkitc1osl	Fairways	6	2	2024	82	44	32	5	0	87	2026-02-07 17:06:03.509	2026-02-07 17:06:03.509	0	0
cmlckftff001t3cxhv463wkvq	Kira	6	2	2024	19	6	10	2	1	77.6	2026-02-07 17:06:03.579	2026-02-07 17:06:03.579	0	0
cmlckftgy001u3cxh4qbrmmna	Winston	7	3	2024	135	80	50	4	1	88.7	2026-02-07 17:06:03.634	2026-02-07 17:06:03.634	0	0
cmlckfti5001v3cxh9c92f7ht	Fairways	7	3	2024	81	56	24	0	0	92.5	2026-02-07 17:06:03.678	2026-02-07 17:06:03.678	0	0
cmlckftjj001w3cxhc1sxgov1	KISASI	7	3	2024	119	75	37	7	0	89.3	2026-02-07 17:06:03.727	2026-02-07 17:06:03.727	0	0
cmlckftkl001x3cxhhjn2r2xp	KPS	7	3	2024	94	65	26	2	1	91.2	2026-02-07 17:06:03.766	2026-02-07 17:06:03.766	0	0
cmlckftlz001y3cxh99xpm91o	Mengo	7	3	2024	144	94	42	7	1	89.8	2026-02-07 17:06:03.815	2026-02-07 17:06:03.815	0	0
cmlckftn4001z3cxh83362b5t	Kitintale	7	3	2024	64	32	20	11	1	82.4	2026-02-07 17:06:03.856	2026-02-07 17:06:03.856	0	0
cmlckfto000203cxh0tcpomt9	Mugongo	7	3	2024	86	54	27	5	0	89.2	2026-02-07 17:06:03.888	2026-02-07 17:06:03.888	0	0
cmlckftpb00213cxh0pw4znpa	CPS	7	3	2024	177	96	52	18	4	85.3	2026-02-07 17:06:03.935	2026-02-07 17:06:03.935	0	0
cmlckftqd00223cxhfrw3meyn	Nakasero	7	3	2024	94	50	35	5	3	85.5	2026-02-07 17:06:03.973	2026-02-07 17:06:03.973	0	0
cmlckftrj00233cxhl8mmx65v	Old K'LA	7	3	2024	187	90	67	23	6	82.4	2026-02-07 17:06:04.016	2026-02-07 17:06:04.016	0	0
cmlckftt000243cxh8e9nae0g	Kira	7	3	2024	19	5	7	6	1	71.1	2026-02-07 17:06:04.068	2026-02-07 17:06:04.068	0	0
cmlckftu200253cxh8ux8u6sc	Winston	8	3	2024	135	95	32	8	0	91.1	2026-02-07 17:06:04.106	2026-02-07 17:06:04.106	0	0
cmlckftva00263cxhhgj5w8uy	Fairways	8	3	2024	82	65	16	0	0	95.1	2026-02-07 17:06:04.15	2026-02-07 17:06:04.15	0	0
cmlckftw800273cxhaca0kx4r	KISASI	8	3	2024	118	78	37	3	0	90.9	2026-02-07 17:06:04.185	2026-02-07 17:06:04.185	0	0
cmlckftxf00283cxh6drtl2ai	KPS	8	3	2024	92	72	19	1	0	94.3	2026-02-07 17:06:04.228	2026-02-07 17:06:04.228	0	0
cmlckftyb00293cxhxy4cungo	Mengo	8	3	2024	144	111	27	6	0	93.2	2026-02-07 17:06:04.259	2026-02-07 17:06:04.259	0	0
cmlckftzm002a3cxhxcuk52k6	Kitintale	8	3	2024	61	43	16	2	0	91.8	2026-02-07 17:06:04.306	2026-02-07 17:06:04.306	0	0
cmlckfu0j002b3cxh9m8gt4qi	Mugongo	8	3	2024	86	69	13	4	0	93.9	2026-02-07 17:06:04.339	2026-02-07 17:06:04.339	0	0
cmlckfu2m002c3cxhqep9975c	CPS	8	3	2024	180	104	53	19	3	86	2026-02-07 17:06:04.414	2026-02-07 17:06:04.414	0	0
cmlckfu46002d3cxhsno8rvvx	Nakasero	8	3	2024	94	55	31	6	2	87	2026-02-07 17:06:04.471	2026-02-07 17:06:04.471	0	0
cmlckfu64002e3cxhimvif6h4	Old K'LA	8	3	2024	187	116	49	16	5	87.1	2026-02-07 17:06:04.54	2026-02-07 17:06:04.54	0	0
cmlckfu6x002f3cxhr4hor2p4	Kira	8	3	2024	19	7	7	4	1	76.3	2026-02-07 17:06:04.569	2026-02-07 17:06:04.569	0	0
cmlckfu7t002g3cxhd9i9o9oe	Winston	9	3	2024	135	95	13	5	0	94.9	2026-02-07 17:06:04.601	2026-02-07 17:06:04.601	0	0
cmlckfu8n002h3cxhkiwry9kk	Fairways	9	3	2024	82	65	9	2	0	95.7	2026-02-07 17:06:04.631	2026-02-07 17:06:04.631	0	0
cmlckfua3002i3cxhpacdfr2h	KISASI	9	3	2024	119	78	19	2	0	94.2	2026-02-07 17:06:04.683	2026-02-07 17:06:04.683	0	0
cmlckfubq002j3cxhx37iu9p5	KPS	9	3	2024	94	72	15	1	1	94.4	2026-02-07 17:06:04.743	2026-02-07 17:06:04.743	0	0
cmlckfud0002k3cxh2frbws6t	Mengo	9	3	2024	146	111	25	6	0	93.5	2026-02-07 17:06:04.788	2026-02-07 17:06:04.788	0	0
cmlckfuef002l3cxh0kp38767	Kitintale	9	3	2024	62	43	11	2	0	93.3	2026-02-07 17:06:04.84	2026-02-07 17:06:04.84	0	0
cmlckfugf002m3cxh259wpwsb	CPS	9	3	2024	179	104	49	11	1	88.8	2026-02-07 17:06:04.912	2026-02-07 17:06:04.912	0	0
cmlckfuh9002n3cxh4k1lafb1	Nakasero	9	3	2024	94	55	27	4	1	89.1	2026-02-07 17:06:04.941	2026-02-07 17:06:04.941	0	0
cmlckfui3002o3cxh7plwiqd8	Old K'LA	9	3	2024	187	116	47	23	1	87.2	2026-02-07 17:06:04.971	2026-02-07 17:06:04.971	0	0
cmlckfuj5002p3cxhpr8e8gr7	Kira	9	3	2024	19	7	6	4	1	76.4	2026-02-07 17:06:05.009	2026-02-07 17:06:05.009	0	0
cmlcqgfsa00001237vj8357u6	Mengo	4	2	2023	164	78	73	10	2	84.8	2026-02-07 19:54:30.249	2026-02-07 19:54:30.249	0	0
cmlcqgfty00011237raz0ehcy	Nakasero	4	2	2023	105	61	40	2	2	88.1	2026-02-07 19:54:30.31	2026-02-07 19:54:30.31	0	0
cmlcqgfut00021237b73dm0en	KPS	4	2	2023	79	38	35	3	2	84.9	2026-02-07 19:54:30.342	2026-02-07 19:54:30.342	0	0
cmlcqgfvq00031237qpcwcc1v	Winston	4	2	2023	95	44	33	15	3	81.1	2026-02-07 19:54:30.374	2026-02-07 19:54:30.374	0	0
cmlcqgfwp00041237s71pto9x	Fairways	4	2	2023	80	31	39	6	2	81.7	2026-02-07 19:54:30.409	2026-02-07 19:54:30.409	0	0
cmlcqgfxu0005123732v344qp	Kitintale	4	2	2023	61	23	30	5	2	80.8	2026-02-07 19:54:30.45	2026-02-07 19:54:30.45	0	0
cmlcqgfzd000612374nwg5m57	KPM	4	2	2023	112	43	52	12	1	81.7	2026-02-07 19:54:30.505	2026-02-07 19:54:30.505	0	0
cmlcqgg1o00071237pts6gxg7	KISASI	4	2	2023	134	56	57	18	3	81	2026-02-07 19:54:30.588	2026-02-07 19:54:30.588	0	0
cmlcqgg8200081237dczkljym	CPS	4	2	2023	171	64	64	14	8	80.7	2026-02-07 19:54:30.819	2026-02-07 19:54:30.819	0	0
cmlcqgg9m00091237you14elb	Old K'LA	4	2	2023	198	60	92	30	8	76.8	2026-02-07 19:54:30.874	2026-02-07 19:54:30.874	0	0
cmlcqggan000a1237opgn0fbf	Mengo	5	2	2023	164	123	35	4	1	92.9	2026-02-07 19:54:30.911	2026-02-07 19:54:30.911	0	0
cmlcqggc7000b12378dx8d55l	Nakasero	5	2	2023	106	82	21	3	0	93.6	2026-02-07 19:54:30.967	2026-02-07 19:54:30.967	0	0
cmlcqggd9000c123748x6gm1w	KPS	5	2	2023	80	64	13	2	1	93.8	2026-02-07 19:54:31.006	2026-02-07 19:54:31.006	0	0
cmlcqggf0000d1237yf5f2a3v	Winston	5	2	2023	98	67	22	9	0	89.8	2026-02-07 19:54:31.068	2026-02-07 19:54:31.068	0	0
cmlcqgggv000e1237b2t90q29	Fairways	5	2	2023	78	61	12	4	1	92.6	2026-02-07 19:54:31.135	2026-02-07 19:54:31.135	0	0
cmlcqggi6000f1237pdmmiha2	Kitintale	5	2	2023	61	38	13	7	2	86.3	2026-02-07 19:54:31.182	2026-02-07 19:54:31.182	0	0
cmlcqggk6000g1237gg7r7hx5	KPM	5	2	2023	116	79	24	9	3	88.9	2026-02-07 19:54:31.254	2026-02-07 19:54:31.254	0	0
cmlcqggll000h1237xy1930qn	KISASI	5	2	2023	137	94	31	12	0	90	2026-02-07 19:54:31.305	2026-02-07 19:54:31.305	0	0
cmlcqggp5000i1237zcpvjvwv	CPS	5	2	2023	196	104	53	18	8	84.6	2026-02-07 19:54:31.433	2026-02-07 19:54:31.433	0	0
cmlcqggt0000j1237nymf6idb	Old K'LA	5	2	2023	189	91	75	18	2	84.3	2026-02-07 19:54:31.572	2026-02-07 19:54:31.572	0	0
cmlcqgguu000k1237csp75pw0	Mengo	6	2	2023	167	148	13	4	1	96.4	2026-02-07 19:54:31.638	2026-02-07 19:54:31.638	0	0
cmlcqggvr000l1237yq2p5tt2	Nakasero	6	2	2023	105	96	8	1	0	97.6	2026-02-07 19:54:31.671	2026-02-07 19:54:31.671	0	0
cmlcqggx5000m1237lvv2c9k9	KPS	6	2	2023	83	69	12	1	1	94.9	2026-02-07 19:54:31.721	2026-02-07 19:54:31.721	0	0
cmlcqggyb000n1237kj1s2p9n	Winston	6	2	2023	97	79	15	3	0	94.6	2026-02-07 19:54:31.763	2026-02-07 19:54:31.763	0	0
cmlcqggzp000o1237si06xb7y	Fairways	6	2	2023	78	66	6	6	0	94.2	2026-02-07 19:54:31.813	2026-02-07 19:54:31.813	0	0
cmlcqgh0t000p1237528i1fr5	Kitintale	6	2	2023	61	48	10	3	0	93.4	2026-02-07 19:54:31.853	2026-02-07 19:54:31.853	0	0
cmlcqgh2c000q1237429z5otj	KPM	6	2	2023	118	92	14	11	0	92.3	2026-02-07 19:54:31.909	2026-02-07 19:54:31.909	0	0
cmlcqgh9j000r1237x54l0lr7	KISASI	6	2	2023	138	99	33	6	0	91.8	2026-02-07 19:54:32.168	2026-02-07 19:54:32.168	0	0
cmlcqghb1000s1237ngmj628l	CPS	6	2	2023	194	131	32	21	7	87.6	2026-02-07 19:54:32.221	2026-02-07 19:54:32.221	0	0
cmlcqghbv000t1237v1m0dnuq	Old K'LA	6	2	2023	202	129	59	13	1	89.1	2026-02-07 19:54:32.251	2026-02-07 19:54:32.251	0	0
cmlcqghdd000u1237xb4i0d4v	Nakasero	1	1	2023	105	44	52	7	1	83.4	2026-02-07 19:54:32.305	2026-02-07 19:54:32.305	0	0
cmlcqghef000v1237khotkgbc	Mengo	1	1	2023	166	69	69	20	2	82	2026-02-07 19:54:32.343	2026-02-07 19:54:32.343	0	0
cmlcqghfl000w1237zudt7eb2	Winston	1	1	2023	101	36	39	24	1	77.5	2026-02-07 19:54:32.385	2026-02-07 19:54:32.385	0	0
cmlcqghha000x1237ikbqwyat	KISASI	1	1	2023	138	43	59	15	12	75.8	2026-02-07 19:54:32.445	2026-02-07 19:54:32.445	0	0
cmlcqghix000y1237x19htu0e	KPM	1	1	2023	118	32	52	21	7	74.3	2026-02-07 19:54:32.505	2026-02-07 19:54:32.505	0	0
cmlcqghkb000z1237noyh12zn	Fairways	1	1	2023	81	37	31	9	2	82.6	2026-02-07 19:54:32.555	2026-02-07 19:54:32.555	0	0
cmlcqghld00101237brl62vhj	KPS	1	1	2023	80	35	40	1	1	85.4	2026-02-07 19:54:32.594	2026-02-07 19:54:32.594	0	0
cmlcqghn200111237cyna10cl	CPS	1	1	2023	196	58	73	19	17	75.7	2026-02-07 19:54:32.654	2026-02-07 19:54:32.654	0	0
cmlcqghpo00121237lmvnjqwm	Kitintale	1	1	2023	63	14	27	11	5	71.9	2026-02-07 19:54:32.749	2026-02-07 19:54:32.749	0	0
cmlcqgij100131237zsdso329	Old K'LA	1	1	2023	204	48	87	28	19	72.5	2026-02-07 19:54:33.805	2026-02-07 19:54:33.805	0	0
cmlcqgikq00141237mqu9bw97	Nakasero	2	1	2023	106	46	54	3	1	84.9	2026-02-07 19:54:33.867	2026-02-07 19:54:33.867	0	0
cmlcqgim7001512372920qdl0	Mengo	2	1	2023	164	72	79	6	1	85.1	2026-02-07 19:54:33.919	2026-02-07 19:54:33.919	0	0
cmlcqgina00161237ues2k4gg	Winston	2	1	2023	100	41	43	10	6	79.8	2026-02-07 19:54:33.958	2026-02-07 19:54:33.958	0	0
cmlcqgioh001712377vm9tx0m	KISASI	2	1	2023	135	48	63	12	7	79.2	2026-02-07 19:54:34.001	2026-02-07 19:54:34.001	0	0
cmlcqgips00181237j407efjs	KPM	2	1	2023	117	43	56	7	5	80.9	2026-02-07 19:54:34.049	2026-02-07 19:54:34.049	0	0
cmlcqgis700191237ynd6b4td	Fairways	2	1	2023	81	31	40	5	2	82.1	2026-02-07 19:54:34.135	2026-02-07 19:54:34.135	0	0
cmlcqgitn001a1237vjtrwodf	KPS	2	1	2023	80	33	36	4	5	81.1	2026-02-07 19:54:34.187	2026-02-07 19:54:34.187	0	0
cmlcqgium001b12374pz5tlyi	CPS	2	1	2023	195	60	81	15	7	79.8	2026-02-07 19:54:34.223	2026-02-07 19:54:34.223	0	0
cmlcqgivj001c123747smyimr	Kitintale	2	1	2023	61	17	30	9	2	76.7	2026-02-07 19:54:34.255	2026-02-07 19:54:34.255	0	0
cmlcqgixk001d1237s6dfu49n	Old K'LA	2	1	2023	205	54	99	18	16	75.5	2026-02-07 19:54:34.328	2026-02-07 19:54:34.328	0	0
cmlcqgizk001e1237tzz7lurv	Nakasero	3	1	2023	106	80	24	1	1	93.2	2026-02-07 19:54:34.4	2026-02-07 19:54:34.4	0	0
cmlcqgj0u001f123703jvwirj	Mengo	3	1	2023	167	119	41	2	1	92.6	2026-02-07 19:54:34.446	2026-02-07 19:54:34.446	0	0
cmlcqgj27001g1237lz7uyk1n	Winston	3	1	2023	101	70	25	6	0	90.8	2026-02-07 19:54:34.496	2026-02-07 19:54:34.496	0	0
cmlcqgj3t001h1237badauvm3	KISASI	3	1	2023	139	87	44	4	4	88.5	2026-02-07 19:54:34.553	2026-02-07 19:54:34.553	0	0
cmlcqgj4w001i1237brd98907	KPM	3	1	2023	114	71	29	5	5	87.7	2026-02-07 19:54:34.592	2026-02-07 19:54:34.592	0	0
cmlcqgj6e001j12374f62d0ns	Fairways	3	1	2023	80	49	23	5	2	87.7	2026-02-07 19:54:34.646	2026-02-07 19:54:34.646	0	0
cmlcqgj7n001k1237ptjox732	KPS	3	1	2023	82	48	30	0	1	89.6	2026-02-07 19:54:34.692	2026-02-07 19:54:34.692	0	0
cmlcqgj8p001l12377znvw189	CPS	3	1	2023	185	101	54	8	5	87.4	2026-02-07 19:54:34.729	2026-02-07 19:54:34.729	0	0
cmlcqgja3001m12377cinm1vm	Kitintale	3	1	2023	62	34	22	4	0	87.5	2026-02-07 19:54:34.779	2026-02-07 19:54:34.779	0	0
cmlcqgjb4001n1237szaozypr	Old K'LA	3	1	2023	202	93	86	13	6	83.6	2026-02-07 19:54:34.816	2026-02-07 19:54:34.816	0	0
cmlcqgjcf001o1237an1i7103	Mengo	7	3	2023	165	88	65	11	1	86.4	2026-02-07 19:54:34.863	2026-02-07 19:54:34.863	0	0
cmlcqgjeg001p12379i5bga85	Nakasero	7	3	2023	106	70	31	5	0	90.3	2026-02-07 19:54:34.937	2026-02-07 19:54:34.937	0	0
cmlcqgjg1001q12378fjmygxp	Fairways	7	3	2023	78	50	17	11	0	87.5	2026-02-07 19:54:34.994	2026-02-07 19:54:34.994	0	0
cmlcqgjha001r1237o4w8yt0s	KISASI	7	3	2023	137	74	31	32	0	82.7	2026-02-07 19:54:35.039	2026-02-07 19:54:35.039	0	0
cmlcqgjic001s12375cd6syro	Winston	7	3	2023	99	57	27	15	0	85.6	2026-02-07 19:54:35.076	2026-02-07 19:54:35.076	0	0
cmlcqgjk9001t1237u393wqrp	KPM	7	3	2023	114	60	32	21	0	83.6	2026-02-07 19:54:35.146	2026-02-07 19:54:35.146	0	0
cmlcqgjlt001u1237x3joa2sx	Kitintale	7	3	2023	59	31	12	15	1	80.9	2026-02-07 19:54:35.201	2026-02-07 19:54:35.201	0	0
cmlcqgjnc001v1237vu6cg3wt	CPS	7	3	2023	195	82	62	27	16	78.1	2026-02-07 19:54:35.255	2026-02-07 19:54:35.255	0	0
cmlcqgjoq001w1237v6vmwsdd	Old K'LA	7	3	2023	198	77	63	51	5	77	2026-02-07 19:54:35.306	2026-02-07 19:54:35.306	0	0
cmlcqgjq7001x1237wkvmccl3	Mengo	8	3	2023	160	146	11	3	0	97.3	2026-02-07 19:54:35.36	2026-02-07 19:54:35.36	0	0
cmlcqgjrn001y1237vylae4xb	Nakasero	8	3	2023	106	100	5	1	0	98.3	2026-02-07 19:54:35.411	2026-02-07 19:54:35.411	0	0
cmlcqgjsp001z1237yapdlyg5	Fairways	8	3	2023	81	72	4	5	0	95.7	2026-02-07 19:54:35.45	2026-02-07 19:54:35.45	0	0
cmlcqgjtw00201237xjeomz02	KISASI	8	3	2023	137	107	21	9	0	92.9	2026-02-07 19:54:35.492	2026-02-07 19:54:35.492	0	0
cmlcqgjv600211237nknja9jx	Winston	8	3	2023	97	78	12	7	0	93.3	2026-02-07 19:54:35.538	2026-02-07 19:54:35.538	0	0
cmlcqgjwd00221237cpd6zozc	KPS	8	3	2023	84	77	5	1	1	97	2026-02-07 19:54:35.581	2026-02-07 19:54:35.581	0	0
cmlcqgjxp00231237enaf01aa	KPM	8	3	2023	113	96	6	9	2	93.4	2026-02-07 19:54:35.63	2026-02-07 19:54:35.63	0	0
cmlcqgjz500241237jz92yujf	Kitintale	8	3	2023	59	48	8	3	0	94.1	2026-02-07 19:54:35.681	2026-02-07 19:54:35.681	0	0
cmlcqgk1300251237s72fy8tc	CPS	8	3	2023	193	137	31	15	4	90.2	2026-02-07 19:54:35.751	2026-02-07 19:54:35.751	0	0
cmlcqgk2c00261237xa46on4v	Old K'LA	8	3	2023	198	143	45	9	1	91.7	2026-02-07 19:54:35.796	2026-02-07 19:54:35.796	0	0
cmlcqgk3700271237gc1445a7	Mengo	9	3	2023	162	140	16	6	0	95.7	2026-02-07 19:54:35.828	2026-02-07 19:54:35.828	0	0
cmlcqgk4k00281237shh2ngcs	Nakasero	9	3	2023	106	91	10	5	0	95.3	2026-02-07 19:54:35.877	2026-02-07 19:54:35.877	0	0
cmlcqgk5v00291237ttfbl9av	Fairways	9	3	2023	76	59	9	8	0	91.8	2026-02-07 19:54:35.923	2026-02-07 19:54:35.923	0	0
cmlcqgk8b002a1237kf68epa7	KISASI	9	3	2023	137	101	25	11	0	91.4	2026-02-07 19:54:36.011	2026-02-07 19:54:36.011	0	0
cmlcqgkah002b1237svchetlu	Winston	9	3	2023	99	73	18	8	0	91.4	2026-02-07 19:54:36.089	2026-02-07 19:54:36.089	0	0
cmlcqgkd5002c12376a9gs2lg	KPS	9	3	2023	82	63	16	2	1	93	2026-02-07 19:54:36.185	2026-02-07 19:54:36.185	0	0
cmlcqgkfg002d1237e663fssu	KPM	9	3	2023	117	85	22	6	3	90.7	2026-02-07 19:54:36.269	2026-02-07 19:54:36.269	0	0
cmlcqgkti002e1237vt9ulmfg	Kitintale	9	3	2023	57	40	15	2	0	91.7	2026-02-07 19:54:36.774	2026-02-07 19:54:36.774	0	0
cmlcqgkv1002f1237poez3dlo	CPS	9	3	2023	194	122	34	15	12	86.3	2026-02-07 19:54:36.829	2026-02-07 19:54:36.829	0	0
cmlcqgkw3002g1237u9djtjwc	Old K'LA	9	3	2023	195	107	66	18	3	85.7	2026-02-07 19:54:36.867	2026-02-07 19:54:36.867	0	0
\.


--
-- Data for Name: PLEResult; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."PLEResult" (id, school, year, "candidatesEnrolled", "divisionI", "divisionII", "divisionIII", "divisionIV", "divisionC5", "divisionC6", "divisionP7", "divisionP8", "divisionU", "englishD1", "englishD2", "englishC3", "englishC4", "englishC5", "englishC6", "englishP7", "englishP8", "englishP9", "mathsD1", "mathsD2", "mathsC3", "mathsC4", "mathsC5", "mathsC6", "mathsP7", "mathsP8", "mathsP9", "scienceD1", "scienceD2", "scienceC3", "scienceC4", "scienceC5", "scienceC6", "scienceP7", "scienceP8", "scienceP9", "sstD1", "sstD2", "sstC3", "sstC4", "sstC5", "sstC6", "sstP7", "sstP8", "sstP9", agg4, agg5, agg6, agg7, agg8, agg9, agg10, agg11, agg12, agg13, agg14, agg15, agg16, agg17, agg18, agg19, agg20, agg21, agg22, agg23, agg24, agg25, agg26, agg27, agg28, agg29, agg30, agg31, agg32, agg33, agg34, agg35, agg36, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PushSubscription; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."PushSubscription" (id, "userId", endpoint, auth, p256dh, "userAgent", "deviceName", "isActive", "createdAt", "updatedAt") FROM stdin;
cmlfrbgjb00014gbnvk0d1lpm	cmlebm36q00008faulhyznd0j	https://updates.push.services.mozilla.com/wpush/v2/gAAAAABpimKxbCfVH0dyJsUiBfF8q7f8vQzPcsFd0kXGNdzzFzs1XUfbS_TsBrN_U-TxdCYOBSq9ehIrXnz4tfhamARx8m3V8ajiyvzo4kkKW-A_OvQFgOCOudYGeWPa4iDD62unZLPgQb9x0Fcqy4A0psLYC1MIURKAJ-XqRxc7PWw5hqEFCxY	igFQssY+E8dN1J+nuKm91g==	BLMCLcFosug/qiYxSIN18hDLoNO6BOhmkFst/LSrR0EJyccQByTBGe7/0Yy4QkHI+ZViKAxJhs9y9xoozIJGR5g=	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0	Linux PC	f	2026-02-09 22:41:56.086	2026-02-09 22:42:11.877
\.


--
-- Data for Name: Reaction; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Reaction" (id, type, comment, "sectionId", "weeklyReportId", "userId", "createdAt") FROM stdin;
cmlhv5vnj00016mk45ytftwbn	COMMENT	why low	fees-collection	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 10:05:06.56
cmlhv5yuy00056mk4m6zhohnd	THUMBS_DOWN	\N	fees-collection	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 10:05:10.714
cmlhv69bm00096mk4nqx1l8sk	COMMENT	reflect	schools-expenditure	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 10:05:24.274
cmlhy4qsv000162jhy9ua667g	THUMBS_UP	\N	schools-expenditure	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 11:28:12.463
cmlhy52eh000562jho5y9puz7	COMMENT	previous	theology-enrollment	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 11:28:27.497
cmlhy64q1000962jhkelwfgxh	COMMENT	test	fees-collection	cmlht4cvi00001086il9q9ra7	cmlebm36q00008faulhyznd0j	2026-02-11 11:29:17.162
cmlhy8fpu000c62jhb6pujdwj	COMMENT	waiting	event-cmlebm4cp00af8fauexu82cpo	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 11:31:04.722
cmlhz48j3000g62jhnmfx1cc5	COMMENT	where is the challenge?	infrastructure	cmlht4cvi00001086il9q9ra7	cmlebm39t00018fauhrqcvv6e	2026-02-11 11:55:48.399
\.


--
-- Data for Name: RedIssue; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."RedIssue" (id, issue, "inCharge", status, "createdAt", "updatedAt", "itemStatus") FROM stdin;
cmlebm4ii00bv8fauksaqr5gs	Water supply disruption in Block A	Maintenance Team	IN_PROGRESS	2026-02-08 22:34:33.69	2026-02-08 22:34:33.69	ACTIVE
cmlebm4in00bw8fau8dvi043n	Delay in textbook delivery	Procurement Officer	OPEN	2026-02-08 22:34:33.695	2026-02-08 22:34:33.695	ACTIVE
cmlebm4iq00bx8fauu797clgy	Staff transport breakdown	Transport Manager	RESOLVED	2026-02-08 22:34:33.698	2026-02-08 22:34:33.698	ACTIVE
cmlebm4iu00by8faudceczsqu	Kitchen equipment malfunction	Catering Manager	IN_PROGRESS	2026-02-08 22:34:33.702	2026-02-08 22:34:33.702	ACTIVE
cmlebtdj100mvnua1puze5apw	Water supply disruption in Block A	Maintenance Team	IN_PROGRESS	2026-02-08 22:40:11.965	2026-02-08 22:40:11.965	ACTIVE
cmlebtdj500mwnua1vodqzq29	Delay in textbook delivery	Procurement Officer	OPEN	2026-02-08 22:40:11.97	2026-02-08 22:40:11.97	ACTIVE
cmlebtdja00mxnua1pxv9nrhr	Staff transport breakdown	Transport Manager	RESOLVED	2026-02-08 22:40:11.974	2026-02-08 22:40:11.974	ACTIVE
cmlebtnpi00mx5v6w1rh7ow8b	Staff transport breakdown	Transport Manager	RESOLVED	2026-02-08 22:40:25.158	2026-02-08 22:40:25.158	ACTIVE
cmlebtnpl00my5v6wocje4ajy	Kitchen equipment malfunction	Catering Manager	IN_PROGRESS	2026-02-08 22:40:25.161	2026-02-08 22:40:25.161	ACTIVE
cmlebtnp900mv5v6ws71ps4wi	Water supply disruption in Block A	Maintenance Team	RESOLVED	2026-02-08 22:40:25.15	2026-02-09 21:13:34.897	ACTIVE
cmlebtdjf00mynua1h96b9w3a	Kitchen equipment malfunction	Catering Manager	RESOLVED	2026-02-08 22:40:11.98	2026-02-09 21:13:41.106	ACTIVE
cmlebtnpf00mw5v6wgdl1b2c9	Delay in textbook delivery	Procurement Officer	IN_PROGRESS	2026-02-08 22:40:25.155	2026-02-09 21:13:55.527	ACTIVE
\.


--
-- Data for Name: School; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."School" (id, name, "createdAt", "updatedAt") FROM stdin;
cmlebm39x00028fauooacfi74	CPS	2026-02-08 22:34:32.086	2026-02-08 22:34:32.086
cmlebm3a500038fauvqjlis4d	MENGO	2026-02-08 22:34:32.093	2026-02-08 22:34:32.093
cmlebm3aa00048faucb20q0r0	NAKASERO	2026-02-08 22:34:32.099	2026-02-08 22:34:32.099
cmlebm3af00058fau4h55jvn0	KISASI	2026-02-08 22:34:32.104	2026-02-08 22:34:32.104
cmlebm3ak00068fau3r6jjilm	OLD K'LA	2026-02-08 22:34:32.109	2026-02-08 22:34:32.109
cmlebm3ap00078fau6cqaencm	WINSTON	2026-02-08 22:34:32.114	2026-02-08 22:34:32.114
cmlebm3av00088faurwzwd8bh	FAIRWAYS	2026-02-08 22:34:32.119	2026-02-08 22:34:32.119
cmlebm3b000098faufw5pmxsl	KPM	2026-02-08 22:34:32.125	2026-02-08 22:34:32.125
cmlebm3b5000a8faus8css45c	KPS	2026-02-08 22:34:32.13	2026-02-08 22:34:32.13
cmlebm3b9000b8faux3m6notr	KITINTALE	2026-02-08 22:34:32.133	2026-02-08 22:34:32.133
cmlebm3bd000c8fau0306ru8b	KIRA	2026-02-08 22:34:32.138	2026-02-08 22:34:32.138
\.


--
-- Data for Name: SchoolKPIData; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."SchoolKPIData" (id, "weeklyReportId", school, year, term, week, "feesCollectionPercent", "expenditurePercent", "infrastructurePercent", "syllabusCoveragePercent", "admissionsCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TermSetting; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."TermSetting" (id, term, year, "startDate", "endDate", "weeksCount", "createdAt", "updatedAt") FROM stdin;
cmlexfzfv0002u457tg2b75lg	1	2026	2026-02-09 00:00:00	2026-05-01 00:00:00	13	2026-02-09 08:45:38.729	2026-02-09 08:45:45.505
\.


--
-- Data for Name: TheologyEnrollment; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."TheologyEnrollment" (id, school, year, term, "createdAt", "updatedAt", class, count) FROM stdin;
cml4vnpgx00021djvceghmfxw	WINSTON	2025	2	2026-02-02 07:57:58.065	2026-02-02 07:57:58.065	KG1	12
cml4vnpqa00031djvsxad3v0c	WINSTON	2025	2	2026-02-02 07:57:58.402	2026-02-02 07:57:58.402	KG2	15
cml4vnprh00041djvxjcdw13e	WINSTON	2025	2	2026-02-02 07:57:58.445	2026-02-02 07:57:58.445	KG3	13
cml4vnpso00051djvmuxok8fg	WINSTON	2025	2	2026-02-02 07:57:58.488	2026-02-02 07:57:58.488	P.1	22
cml4vnptt00061djv25wz86jr	WINSTON	2025	2	2026-02-02 07:57:58.529	2026-02-02 07:57:58.529	P.2	19
cml4vnpuq00071djvfmfkwql3	WINSTON	2025	2	2026-02-02 07:57:58.562	2026-02-02 07:57:58.562	P.3	43
cml4vnpvq00081djv9hlezgoj	WINSTON	2025	2	2026-02-02 07:57:58.599	2026-02-02 07:57:58.599	P.4	44
cml4vnpwr00091djvtv9u7g9c	WINSTON	2025	2	2026-02-02 07:57:58.635	2026-02-02 07:57:58.635	P.5	52
cml4vnpy0000a1djv9olvrv5i	WINSTON	2025	2	2026-02-02 07:57:58.681	2026-02-02 07:57:58.681	P.6	53
cml4vnpzr000b1djvivbegbum	WINSTON	2025	2	2026-02-02 07:57:58.743	2026-02-02 07:57:58.743	P.7	39
cml4vxkbm000c1djvyz3ygta4	OLD K'LA	2025	2	2026-02-02 08:05:37.954	2026-02-02 08:05:37.954	KG1	0
cml4vxkcz000d1djv3rhsbhso	OLD K'LA	2025	2	2026-02-02 08:05:38.003	2026-02-02 08:05:38.003	KG2	0
cml4vxkeh000e1djvgve3898j	OLD K'LA	2025	2	2026-02-02 08:05:38.057	2026-02-02 08:05:38.057	KG3	8
cml4vxkft000f1djvcyfnxlyo	OLD K'LA	2025	2	2026-02-02 08:05:38.105	2026-02-02 08:05:38.105	P.1	19
cml4vxkgu000g1djvds1aw0yp	OLD K'LA	2025	2	2026-02-02 08:05:38.142	2026-02-02 08:05:38.142	P.2	20
cml4vxki0000h1djvcezc6zg3	OLD K'LA	2025	2	2026-02-02 08:05:38.184	2026-02-02 08:05:38.184	P.3	29
cml4vxkiz000i1djvxc3if14c	OLD K'LA	2025	2	2026-02-02 08:05:38.219	2026-02-02 08:05:38.219	P.4	40
cml4vxkk0000j1djvl9ylk35x	OLD K'LA	2025	2	2026-02-02 08:05:38.256	2026-02-02 08:05:38.256	P.5	40
cml4vxkl7000k1djvmpwoez27	OLD K'LA	2025	2	2026-02-02 08:05:38.299	2026-02-02 08:05:38.299	P.6	66
cml4vxkmk000l1djvjmq72tp5	OLD K'LA	2025	2	2026-02-02 08:05:38.348	2026-02-02 08:05:38.348	P.7	49
cml4wbz260000evk5g7usdzup	NAKASERO	2025	2	2026-02-02 08:16:50.236	2026-02-02 08:16:50.236	KG1	16
cml4wbz4c0001evk5is5181j8	NAKASERO	2025	2	2026-02-02 08:16:50.316	2026-02-02 08:16:50.316	KG2	9
cml4wbz5j0002evk5mpbgp8p8	NAKASERO	2025	2	2026-02-02 08:16:50.359	2026-02-02 08:16:50.359	KG3	22
cml4wbz720003evk565a8jk98	NAKASERO	2025	2	2026-02-02 08:16:50.414	2026-02-02 08:16:50.414	P.1	26
cml4wbz860004evk5txjbyqrc	NAKASERO	2025	2	2026-02-02 08:16:50.455	2026-02-02 08:16:50.455	P.2	38
cml4wbz9e0005evk56ne4tv08	NAKASERO	2025	2	2026-02-02 08:16:50.498	2026-02-02 08:16:50.498	P.3	34
cml4wbzav0006evk53oyq7d4k	NAKASERO	2025	2	2026-02-02 08:16:50.551	2026-02-02 08:16:50.551	P.4	32
cml4wbzck0007evk5ug1zal7n	NAKASERO	2025	2	2026-02-02 08:16:50.612	2026-02-02 08:16:50.612	P.5	31
cml4wbze50008evk54kocfjw0	NAKASERO	2025	2	2026-02-02 08:16:50.669	2026-02-02 08:16:50.669	P.6	21
cml4wbzff0009evk56zvbmsk1	NAKASERO	2025	2	2026-02-02 08:16:50.716	2026-02-02 08:16:50.716	P.7	20
cml4we1io000aevk5wl2762h9	KISASI	2025	2	2026-02-02 08:18:26.734	2026-02-02 08:18:26.734	KG1	29
cml4we1ke000bevk5nesr0bc5	KISASI	2025	2	2026-02-02 08:18:26.798	2026-02-02 08:18:26.798	KG2	17
cml4we1mc000cevk580ixt93z	KISASI	2025	2	2026-02-02 08:18:26.867	2026-02-02 08:18:26.867	KG3	37
cml4we1nf000devk5btl1hcce	KISASI	2025	2	2026-02-02 08:18:26.907	2026-02-02 08:18:26.907	P.1	45
cml4we1os000eevk5vf8jtsxg	KISASI	2025	2	2026-02-02 08:18:26.957	2026-02-02 08:18:26.957	P.2	53
cml4we1pv000fevk593b2gi20	KISASI	2025	2	2026-02-02 08:18:26.995	2026-02-02 08:18:26.995	P.3	49
cml4we1rr000gevk5e5cs9ujk	KISASI	2025	2	2026-02-02 08:18:27.063	2026-02-02 08:18:27.063	P.4	53
cml4we1tl000hevk59r9jpb2d	KISASI	2025	2	2026-02-02 08:18:27.129	2026-02-02 08:18:27.129	P.5	38
cml4we1v5000ievk5tmb9evgy	KISASI	2025	2	2026-02-02 08:18:27.186	2026-02-02 08:18:27.186	P.6	38
cml4we1w1000jevk5t4mjridr	KISASI	2025	2	2026-02-02 08:18:27.218	2026-02-02 08:18:27.218	P.7	27
cml4wgt2x000kevk5hc40pmv4	MENGO	2025	2	2026-02-02 08:20:35.737	2026-02-02 08:20:35.737	KG1	35
cml4wgt4c000levk5rxctuaz9	MENGO	2025	2	2026-02-02 08:20:35.82	2026-02-02 08:20:35.82	KG2	49
cml4wgt64000mevk56y7m1133	MENGO	2025	2	2026-02-02 08:20:35.884	2026-02-02 08:20:35.884	KG3	46
cml4wgt71000nevk51x1y5fp8	MENGO	2025	2	2026-02-02 08:20:35.917	2026-02-02 08:20:35.917	P.1	61
cml4wgt8f000oevk5robr6vyk	MENGO	2025	2	2026-02-02 08:20:35.968	2026-02-02 08:20:35.968	P.2	62
cml4wgt9t000pevk5qz0wcbyy	MENGO	2025	2	2026-02-02 08:20:36.017	2026-02-02 08:20:36.017	P.3	62
cml4wgtb8000qevk5pjkk540f	MENGO	2025	2	2026-02-02 08:20:36.069	2026-02-02 08:20:36.069	P.4	72
cml4wgtcq000revk5r0j1nlmi	MENGO	2025	2	2026-02-02 08:20:36.122	2026-02-02 08:20:36.122	P.5	71
cml4wgtdz000sevk5tl6eajvx	MENGO	2025	2	2026-02-02 08:20:36.167	2026-02-02 08:20:36.167	P.6	53
cml4wgtfc000tevk55im4b2m6	MENGO	2025	2	2026-02-02 08:20:36.216	2026-02-02 08:20:36.216	P.7	48
cml4wj8he000uevk57e8g4saz	KPS	2025	2	2026-02-02 08:22:29.042	2026-02-02 08:22:29.042	KG1	0
cml4wj8ja000vevk5e8a9unr5	KPS	2025	2	2026-02-02 08:22:29.11	2026-02-02 08:22:29.11	KG2	4
cml4wj8kz000wevk5ehjvukdn	KPS	2025	2	2026-02-02 08:22:29.172	2026-02-02 08:22:29.172	KG3	2
cml4wj8mf000xevk51g4e7ydi	KPS	2025	2	2026-02-02 08:22:29.223	2026-02-02 08:22:29.223	P.1	13
cml4wj8nq000yevk54pzzdekr	KPS	2025	2	2026-02-02 08:22:29.27	2026-02-02 08:22:29.27	P.2	11
cml4wj8p1000zevk5gps9qm3a	KPS	2025	2	2026-02-02 08:22:29.318	2026-02-02 08:22:29.318	P.3	11
cml4wj8q10010evk5rrks5t5l	KPS	2025	2	2026-02-02 08:22:29.354	2026-02-02 08:22:29.354	P.4	13
cml4wj8re0011evk5x3ggstrd	KPS	2025	2	2026-02-02 08:22:29.402	2026-02-02 08:22:29.402	P.5	18
cml4wj8sp0012evk5souuoshi	KPS	2025	2	2026-02-02 08:22:29.45	2026-02-02 08:22:29.45	P.6	14
cml4wj8tt0013evk5kd85rs6k	KPS	2025	2	2026-02-02 08:22:29.489	2026-02-02 08:22:29.489	P.7	17
cml4wl47x0014evk53in2rmfk	KPM	2025	2	2026-02-02 08:23:56.828	2026-02-02 08:23:56.828	KG1	3
cml4wl4940015evk5vq5ysyrq	KPM	2025	2	2026-02-02 08:23:56.872	2026-02-02 08:23:56.872	KG2	1
cml4wl4ah0016evk5jne4zwxm	KPM	2025	2	2026-02-02 08:23:56.922	2026-02-02 08:23:56.922	KG3	1
cml4wl4bt0017evk59fq7mr58	KPM	2025	2	2026-02-02 08:23:56.969	2026-02-02 08:23:56.969	P.1	5
cml4wl4cz0018evk5sm1e9nj9	KPM	2025	2	2026-02-02 08:23:57.011	2026-02-02 08:23:57.011	P.2	12
cml4wl4e50019evk5l06qk83p	KPM	2025	2	2026-02-02 08:23:57.053	2026-02-02 08:23:57.053	P.3	12
cml4wl4fb001aevk57umcgyli	KPM	2025	2	2026-02-02 08:23:57.095	2026-02-02 08:23:57.095	P.4	15
cml4wl4gl001bevk5m9s6kgd3	KPM	2025	2	2026-02-02 08:23:57.141	2026-02-02 08:23:57.141	P.5	14
cml4wl4i1001cevk5ko12lgv1	KPM	2025	2	2026-02-02 08:23:57.193	2026-02-02 08:23:57.193	P.6	24
cml4wl4jg001devk515lh0tvg	KPM	2025	2	2026-02-02 08:23:57.245	2026-02-02 08:23:57.245	P.7	19
cml4wo6cc001eevk56adh3u38	FAIRWAYS	2025	2	2026-02-02 08:26:19.524	2026-02-02 08:26:19.524	KG1	3
cml4wo6d9001fevk52d7td6kr	FAIRWAYS	2025	2	2026-02-02 08:26:19.582	2026-02-02 08:26:19.582	KG2	12
cml4wo6e6001gevk5qaaemjbd	FAIRWAYS	2025	2	2026-02-02 08:26:19.614	2026-02-02 08:26:19.614	KG3	5
cml4wo6ik001hevk5xkm5g1ex	FAIRWAYS	2025	2	2026-02-02 08:26:19.772	2026-02-02 08:26:19.772	P.1	14
cml4wo6l1001ievk5l912dnn7	FAIRWAYS	2025	2	2026-02-02 08:26:19.862	2026-02-02 08:26:19.862	P.2	17
cml4wo6ny001jevk50ik5zmni	FAIRWAYS	2025	2	2026-02-02 08:26:19.967	2026-02-02 08:26:19.967	P.3	13
cml4wo6pt001kevk5u3cpuea7	FAIRWAYS	2025	2	2026-02-02 08:26:20.034	2026-02-02 08:26:20.034	P.4	7
cml4wo6qn001levk5fi8u3634	FAIRWAYS	2025	2	2026-02-02 08:26:20.063	2026-02-02 08:26:20.063	P.5	21
cml4wo6s1001mevk545ve4dwe	FAIRWAYS	2025	2	2026-02-02 08:26:20.113	2026-02-02 08:26:20.113	P.6	11
cml4wo6tz001nevk53cq03h21	FAIRWAYS	2025	2	2026-02-02 08:26:20.183	2026-02-02 08:26:20.183	P.7	8
cml4wqgrm001oevk5iwakir1a	CPS	2025	2	2026-02-02 08:28:06.37	2026-02-02 08:28:06.37	KG1	24
cml4wqgss001pevk5kac87h54	CPS	2025	2	2026-02-02 08:28:06.412	2026-02-02 08:28:06.412	KG2	28
cml4wqgu7001qevk58jh3a03i	CPS	2025	2	2026-02-02 08:28:06.464	2026-02-02 08:28:06.464	KG3	22
cml4wqgvk001revk5wfdgoxgw	CPS	2025	2	2026-02-02 08:28:06.513	2026-02-02 08:28:06.513	P.1	51
cml4wqgww001sevk5aaxakj1z	CPS	2025	2	2026-02-02 08:28:06.56	2026-02-02 08:28:06.56	P.2	45
cml4wqgy5001tevk5ki5cozxw	CPS	2025	2	2026-02-02 08:28:06.606	2026-02-02 08:28:06.606	P.3	43
cml4wqgzq001uevk55us8wjjc	CPS	2025	2	2026-02-02 08:28:06.662	2026-02-02 08:28:06.662	P.4	55
cml4wqh0n001vevk54q2zog6t	CPS	2025	2	2026-02-02 08:28:06.696	2026-02-02 08:28:06.696	P.5	51
cml4wqh29001wevk5qnts49qm	CPS	2025	2	2026-02-02 08:28:06.753	2026-02-02 08:28:06.753	P.6	43
cml4wqh37001xevk5gkrlx5r0	CPS	2025	2	2026-02-02 08:28:06.787	2026-02-02 08:28:06.787	P.7	51
cml4wub4u001yevk57waidt8d	KITINTALE	2025	2	2026-02-02 08:31:05.694	2026-02-02 08:31:05.694	KG1	8
cml4wub6c001zevk5ttb5bma5	KITINTALE	2025	2	2026-02-02 08:31:05.748	2026-02-02 08:31:05.748	KG2	9
cml4wub800020evk5a06ac0np	KITINTALE	2025	2	2026-02-02 08:31:05.809	2026-02-02 08:31:05.809	KG3	7
cml4wub990021evk5xkp3zjel	KITINTALE	2025	2	2026-02-02 08:31:05.852	2026-02-02 08:31:05.852	P.1	16
cml4wubaa0022evk5dgl80x3w	KITINTALE	2025	2	2026-02-02 08:31:05.89	2026-02-02 08:31:05.89	P.2	10
cml4wubby0023evk5k9anizhm	KITINTALE	2025	2	2026-02-02 08:31:05.95	2026-02-02 08:31:05.95	P.3	18
cml4wubdb0024evk5n6aq3s6k	KITINTALE	2025	2	2026-02-02 08:31:06	2026-02-02 08:31:06	P.4	17
cml4wube80025evk5wd3w7nqq	KITINTALE	2025	2	2026-02-02 08:31:06.032	2026-02-02 08:31:06.032	P.5	10
cml4wubfi0026evk5zpwr9qqw	KITINTALE	2025	2	2026-02-02 08:31:06.079	2026-02-02 08:31:06.079	P.6	14
cml4wubgo0027evk55hcvxc4v	KITINTALE	2025	2	2026-02-02 08:31:06.12	2026-02-02 08:31:06.12	P.7	16
cml4wvx610028evk5ogibdtwv	KIRA	2025	2	2026-02-02 08:32:20.832	2026-02-02 08:32:20.832	KG1	20
cml4wvx8l0029evk5mx8re81x	KIRA	2025	2	2026-02-02 08:32:20.998	2026-02-02 08:32:20.998	KG2	19
cml4wvxb6002aevk5uh0wct2d	KIRA	2025	2	2026-02-02 08:32:21.09	2026-02-02 08:32:21.09	KG3	16
cml4wvxd7002bevk5d0v7z3k9	KIRA	2025	2	2026-02-02 08:32:21.163	2026-02-02 08:32:21.163	P.1	42
cml4wvxes002cevk5ruita3n0	KIRA	2025	2	2026-02-02 08:32:21.22	2026-02-02 08:32:21.22	P.2	33
cml4wvxgs002devk5pmfrrtae	KIRA	2025	2	2026-02-02 08:32:21.292	2026-02-02 08:32:21.292	P.3	34
cml4wvxi1002eevk5803gmofi	KIRA	2025	2	2026-02-02 08:32:21.338	2026-02-02 08:32:21.338	P.4	21
cml4wvxjf002fevk5kyxsqkgp	KIRA	2025	2	2026-02-02 08:32:21.387	2026-02-02 08:32:21.387	P.5	15
cml4wvxln002gevk59175c9gn	KIRA	2025	2	2026-02-02 08:32:21.467	2026-02-02 08:32:21.467	P.6	13
cml4wvxor002hevk5w3efuibj	KIRA	2025	2	2026-02-02 08:32:21.58	2026-02-02 08:32:21.58	P.7	10
cml4x2ahf002ievk5hqacausn	WINSTON	2025	3	2026-02-02 08:37:18.098	2026-02-02 08:37:18.098	KG1	11
cml4x2aix002jevk5yvguabw4	WINSTON	2025	3	2026-02-02 08:37:18.153	2026-02-02 08:37:18.153	KG2	16
cml4x2akd002kevk58qt7qw31	WINSTON	2025	3	2026-02-02 08:37:18.204	2026-02-02 08:37:18.204	KG3	14
cml4x2aln002levk53x9ng9zi	WINSTON	2025	3	2026-02-02 08:37:18.251	2026-02-02 08:37:18.251	P.1	22
cml4x2aml002mevk565j3pxzb	WINSTON	2025	3	2026-02-02 08:37:18.285	2026-02-02 08:37:18.285	P.2	19
cml4x2ani002nevk5jow6meaf	WINSTON	2025	3	2026-02-02 08:37:18.319	2026-02-02 08:37:18.319	P.3	43
cml4x2aoh002oevk57pwtlkjo	WINSTON	2025	3	2026-02-02 08:37:18.353	2026-02-02 08:37:18.353	P.4	50
cml4x2apd002pevk5swtnsddd	WINSTON	2025	3	2026-02-02 08:37:18.386	2026-02-02 08:37:18.386	P.5	51
cml4x2aqa002qevk5mowstlds	WINSTON	2025	3	2026-02-02 08:37:18.419	2026-02-02 08:37:18.419	P.6	51
cml4x2ara002revk5nffpvtqz	WINSTON	2025	3	2026-02-02 08:37:18.455	2026-02-02 08:37:18.455	P.7	44
cml4x5itj0032evk5fnbxjltj	NAKASERO	2025	3	2026-02-02 08:39:48.871	2026-02-02 08:39:48.871	KG1	17
cml4x5iv00033evk5xweyv9cd	NAKASERO	2025	3	2026-02-02 08:39:48.922	2026-02-02 08:39:48.922	KG2	8
cml4x5iwi0034evk5hjoi8iob	NAKASERO	2025	3	2026-02-02 08:39:48.978	2026-02-02 08:39:48.978	KG3	22
cml4x5ixv0035evk5a0cgmcg0	NAKASERO	2025	3	2026-02-02 08:39:49.027	2026-02-02 08:39:49.027	P.1	27
cml4x5iyw0036evk5t6ydcjsz	NAKASERO	2025	3	2026-02-02 08:39:49.064	2026-02-02 08:39:49.064	P.2	37
cml4x5j090037evk55gs4kl50	NAKASERO	2025	3	2026-02-02 08:39:49.113	2026-02-02 08:39:49.113	P.3	34
cml4x5j1u0038evk5m68455fr	NAKASERO	2025	3	2026-02-02 08:39:49.17	2026-02-02 08:39:49.17	P.4	34
cml4x5j2w0039evk5ij5un8e7	NAKASERO	2025	3	2026-02-02 08:39:49.209	2026-02-02 08:39:49.209	P.5	31
cml4x5j3p003aevk5nxor78zn	NAKASERO	2025	3	2026-02-02 08:39:49.238	2026-02-02 08:39:49.238	P.6	21
cml4x5j4y003bevk5ley1vz2m	NAKASERO	2025	3	2026-02-02 08:39:49.282	2026-02-02 08:39:49.282	P.7	20
cml4x8j3w003cevk5d6sn3fo4	KISASI	2025	3	2026-02-02 08:42:09.189	2026-02-02 08:42:09.189	KG1	30
cml4x8j54003devk5i7c6sd5w	KISASI	2025	3	2026-02-02 08:42:09.256	2026-02-02 08:42:09.256	KG2	18
cml4x8j6z003eevk5qwc68u3f	KISASI	2025	3	2026-02-02 08:42:09.323	2026-02-02 08:42:09.323	KG3	39
cml4x8j8m003fevk51pjvlzmq	KISASI	2025	3	2026-02-02 08:42:09.381	2026-02-02 08:42:09.381	P.1	46
cml4x8j9h003gevk54hbh9b1e	KISASI	2025	3	2026-02-02 08:42:09.414	2026-02-02 08:42:09.414	P.2	57
cml4x8jat003hevk5xfhci3y1	KISASI	2025	3	2026-02-02 08:42:09.461	2026-02-02 08:42:09.461	P.3	51
cml4x8jca003ievk5t87qjw04	KISASI	2025	3	2026-02-02 08:42:09.514	2026-02-02 08:42:09.514	P.4	53
cml4x8jdb003jevk5y9q85mxn	KISASI	2025	3	2026-02-02 08:42:09.55	2026-02-02 08:42:09.55	P.5	36
cml4x8je5003kevk5rvyb3eh3	KISASI	2025	3	2026-02-02 08:42:09.581	2026-02-02 08:42:09.581	P.6	37
cml4x8jfn003levk5di9fohw3	KISASI	2025	3	2026-02-02 08:42:09.636	2026-02-02 08:42:09.636	P.7	27
cml4xb43k003mevk51z1l2xya	MENGO	2025	3	2026-02-02 08:44:09.727	2026-02-02 08:44:09.727	KG1	69
cml4xb44q003nevk5cadusqxe	MENGO	2025	3	2026-02-02 08:44:09.77	2026-02-02 08:44:09.77	KG2	50
cml4xb46t003oevk5w9qkrm7r	MENGO	2025	3	2026-02-02 08:44:09.846	2026-02-02 08:44:09.846	KG3	41
cml4xb4br003pevk5geh5kqtk	MENGO	2025	3	2026-02-02 08:44:10.023	2026-02-02 08:44:10.023	P.1	60
cml4x3thb002tevk50h924rzq	OLD K'LA	2025	3	2026-02-02 08:38:29.375	2026-02-02 08:55:47.562	KG2	0
cml4x3tiq002uevk5yk9tdfm6	OLD K'LA	2025	3	2026-02-02 08:38:29.426	2026-02-02 08:55:47.631	KG3	8
cml4x3tl5002vevk57qtrdd1l	OLD K'LA	2025	3	2026-02-02 08:38:29.513	2026-02-02 08:55:47.678	P.1	21
cml4x3tmm002wevk54a9hyeso	OLD K'LA	2025	3	2026-02-02 08:38:29.566	2026-02-02 08:55:47.726	P.2	21
cml4x3to3002xevk50ml3oc6g	OLD K'LA	2025	3	2026-02-02 08:38:29.62	2026-02-02 08:55:47.764	P.3	30
cml4x3tpt002yevk57b8v5t6i	OLD K'LA	2025	3	2026-02-02 08:38:29.682	2026-02-02 08:55:47.805	P.4	41
cml4x3tr6002zevk5m023b2o5	OLD K'LA	2025	3	2026-02-02 08:38:29.73	2026-02-02 08:55:47.857	P.5	43
cml4x3tsr0030evk5n6sfaghd	OLD K'LA	2025	3	2026-02-02 08:38:29.788	2026-02-02 08:55:47.909	P.6	61
cml4x3ttu0031evk5r577uk3t	OLD K'LA	2025	3	2026-02-02 08:38:29.827	2026-02-02 08:55:47.955	P.7	50
cml4xb4di003qevk596s6l9b3	MENGO	2025	3	2026-02-02 08:44:10.087	2026-02-02 08:44:10.087	P.2	60
cml4xb4f0003revk5j647ayf1	MENGO	2025	3	2026-02-02 08:44:10.14	2026-02-02 08:44:10.14	P.3	55
cml4xb4g2003sevk5e1b3w70t	MENGO	2025	3	2026-02-02 08:44:10.178	2026-02-02 08:44:10.178	P.4	68
cml4xb4h1003tevk5bzrf2u91	MENGO	2025	3	2026-02-02 08:44:10.213	2026-02-02 08:44:10.213	P.5	64
cml4xb4if003uevk5eai1i376	MENGO	2025	3	2026-02-02 08:44:10.264	2026-02-02 08:44:10.264	P.6	51
cml4xb4je003vevk5v50jbahg	MENGO	2025	3	2026-02-02 08:44:10.298	2026-02-02 08:44:10.298	P.7	48
cml4xdhdh003wevk5eoqjsrg0	KPS	2025	3	2026-02-02 08:46:00.245	2026-02-02 08:46:00.245	KG1	1
cml4xdhev003xevk5fqoould8	KPS	2025	3	2026-02-02 08:46:00.295	2026-02-02 08:46:00.295	KG2	4
cml4xdhg2003yevk5yxmnkerz	KPS	2025	3	2026-02-02 08:46:00.338	2026-02-02 08:46:00.338	KG3	2
cml4xdhhc003zevk5ocxu1d4p	KPS	2025	3	2026-02-02 08:46:00.384	2026-02-02 08:46:00.384	P.1	12
cml4xdhih0040evk5q17e1rza	KPS	2025	3	2026-02-02 08:46:00.426	2026-02-02 08:46:00.426	P.2	11
cml4xdhju0041evk5uewvwdm0	KPS	2025	3	2026-02-02 08:46:00.474	2026-02-02 08:46:00.474	P.3	15
cml4xdhl80042evk5d2utclls	KPS	2025	3	2026-02-02 08:46:00.524	2026-02-02 08:46:00.524	P.4	15
cml4xdhmd0043evk5v4esafu4	KPS	2025	3	2026-02-02 08:46:00.565	2026-02-02 08:46:00.565	P.5	20
cml4xdhna0044evk5dnjs96i1	KPS	2025	3	2026-02-02 08:46:00.599	2026-02-02 08:46:00.599	P.6	15
cml4xdhoo0045evk5vyr9bfib	KPS	2025	3	2026-02-02 08:46:00.648	2026-02-02 08:46:00.648	P.7	17
cml4xf80l0046evk5jhfgmo5e	KPM	2025	3	2026-02-02 08:47:21.393	2026-02-02 08:47:21.393	KG1	3
cml4xf88d0047evk5xj45uu0v	KPM	2025	3	2026-02-02 08:47:21.709	2026-02-02 08:47:21.709	KG2	2
cml4xf89z0048evk55bkfhsdj	KPM	2025	3	2026-02-02 08:47:21.768	2026-02-02 08:47:21.768	KG3	1
cml4xf8cj0049evk5lk9qdttq	KPM	2025	3	2026-02-02 08:47:21.859	2026-02-02 08:47:21.859	P.1	5
cml4xf8ed004aevk5p68k9qoi	KPM	2025	3	2026-02-02 08:47:21.925	2026-02-02 08:47:21.925	P.2	12
cml4xf8gh004bevk5naov4zhd	KPM	2025	3	2026-02-02 08:47:22.001	2026-02-02 08:47:22.001	P.3	12
cml4xf8ik004cevk5pklyc2gg	KPM	2025	3	2026-02-02 08:47:22.076	2026-02-02 08:47:22.076	P.4	15
cml4xf8ki004devk5witiik3p	KPM	2025	3	2026-02-02 08:47:22.146	2026-02-02 08:47:22.146	P.5	14
cml4xf8mr004eevk5tksrhyz5	KPM	2025	3	2026-02-02 08:47:22.228	2026-02-02 08:47:22.228	P.6	22
cml4xf8pf004fevk52yjl5g8p	KPM	2025	3	2026-02-02 08:47:22.323	2026-02-02 08:47:22.323	P.7	19
cml4xh68g004gevk5eldl7gau	FAIRWAYS	2025	3	2026-02-02 08:48:52.432	2026-02-02 08:48:52.432	KG1	3
cml4xh69p004hevk5n86f63vl	FAIRWAYS	2025	3	2026-02-02 08:48:52.477	2026-02-02 08:48:52.477	KG2	9
cml4xh6b9004ievk56igm6tme	FAIRWAYS	2025	3	2026-02-02 08:48:52.533	2026-02-02 08:48:52.533	KG3	6
cml4xh6cp004jevk555wxavul	FAIRWAYS	2025	3	2026-02-02 08:48:52.586	2026-02-02 08:48:52.586	P.1	13
cml4xh6dh004kevk5e4jiyt25	FAIRWAYS	2025	3	2026-02-02 08:48:52.614	2026-02-02 08:48:52.614	P.2	16
cml4xh6eq004levk56wl5yzjm	FAIRWAYS	2025	3	2026-02-02 08:48:52.658	2026-02-02 08:48:52.658	P.3	12
cml4xh6g6004mevk5n9uxrkme	FAIRWAYS	2025	3	2026-02-02 08:48:52.71	2026-02-02 08:48:52.71	P.4	7
cml4xh6hf004nevk528dq3up8	FAIRWAYS	2025	3	2026-02-02 08:48:52.756	2026-02-02 08:48:52.756	P.5	21
cml4xh6ig004oevk5ukclqy82	FAIRWAYS	2025	3	2026-02-02 08:48:52.792	2026-02-02 08:48:52.792	P.6	12
cml4xh6jt004pevk520mcnxh9	FAIRWAYS	2025	3	2026-02-02 08:48:52.841	2026-02-02 08:48:52.841	P.7	8
cml4xirg7004qevk565vx3sq3	CPS	2025	3	2026-02-02 08:50:06.583	2026-02-02 08:50:06.583	KG1	23
cml4xirh3004revk5kyfknc49	CPS	2025	3	2026-02-02 08:50:06.616	2026-02-02 08:50:06.616	KG2	28
cml4xirih004sevk5kt4lzd01	CPS	2025	3	2026-02-02 08:50:06.665	2026-02-02 08:50:06.665	KG3	22
cml4xirkr004tevk5swpcxdlj	CPS	2025	3	2026-02-02 08:50:06.747	2026-02-02 08:50:06.747	P.1	48
cml4xirm7004uevk5n7q8sj6w	CPS	2025	3	2026-02-02 08:50:06.8	2026-02-02 08:50:06.8	P.2	45
cml4xirn6004vevk57tsoisoo	CPS	2025	3	2026-02-02 08:50:06.834	2026-02-02 08:50:06.834	P.3	43
cml4xirop004wevk5livzcon1	CPS	2025	3	2026-02-02 08:50:06.889	2026-02-02 08:50:06.889	P.4	52
cml4xirpq004xevk5uyg6upqf	CPS	2025	3	2026-02-02 08:50:06.926	2026-02-02 08:50:06.926	P.5	50
cml4xirqw004yevk57fmjzqg0	CPS	2025	3	2026-02-02 08:50:06.969	2026-02-02 08:50:06.969	P.6	42
cml4xirrv004zevk56f73iwkj	CPS	2025	3	2026-02-02 08:50:07.004	2026-02-02 08:50:07.004	P.7	52
cml4xltx70050evk5tr34h1ln	KITINTALE	2025	3	2026-02-02 08:52:29.73	2026-02-02 08:52:29.73	KG1	9
cml4xlty20051evk5ky4rldle	KITINTALE	2025	3	2026-02-02 08:52:29.786	2026-02-02 08:52:29.786	KG2	9
cml4xltzd0052evk5l83yc04d	KITINTALE	2025	3	2026-02-02 08:52:29.833	2026-02-02 08:52:29.833	KG3	7
cml4xlu100053evk5xgfv82p8	KITINTALE	2025	3	2026-02-02 08:52:29.892	2026-02-02 08:52:29.892	P.1	16
cml4xlu280054evk5o1a5juk3	KITINTALE	2025	3	2026-02-02 08:52:29.936	2026-02-02 08:52:29.936	P.2	9
cml4xlu3t0055evk5yw2ggd6a	KITINTALE	2025	3	2026-02-02 08:52:29.994	2026-02-02 08:52:29.994	P.3	18
cml4xlu500056evk5kzb2thy7	KITINTALE	2025	3	2026-02-02 08:52:30.035	2026-02-02 08:52:30.035	P.4	15
cml4xlu6c0057evk5m3tzfa9i	KITINTALE	2025	3	2026-02-02 08:52:30.084	2026-02-02 08:52:30.084	P.5	10
cml4xlu7r0058evk5nvd3z5hn	KITINTALE	2025	3	2026-02-02 08:52:30.134	2026-02-02 08:52:30.134	P.6	13
cml4xlu8m0059evk5jc9qx28r	KITINTALE	2025	3	2026-02-02 08:52:30.166	2026-02-02 08:52:30.166	P.7	15
cml4xn0ei005aevk5u6f7ts9z	KIRA	2025	3	2026-02-02 08:53:24.81	2026-02-02 08:53:24.81	KG1	19
cml4xn0fv005bevk58jw0k7i6	KIRA	2025	3	2026-02-02 08:53:24.859	2026-02-02 08:53:24.859	KG2	17
cml4xn0hp005cevk5iu18mvz8	KIRA	2025	3	2026-02-02 08:53:24.925	2026-02-02 08:53:24.925	KG3	17
cml4xn0j2005devk5zyoep2fw	KIRA	2025	3	2026-02-02 08:53:24.975	2026-02-02 08:53:24.975	P.1	41
cml4xn0k4005eevk55fn1txcc	KIRA	2025	3	2026-02-02 08:53:25.013	2026-02-02 08:53:25.013	P.2	32
cml4xn0ls005fevk5bbsvw2to	KIRA	2025	3	2026-02-02 08:53:25.072	2026-02-02 08:53:25.072	P.3	31
cml4xn0mh005gevk571vprj0h	KIRA	2025	3	2026-02-02 08:53:25.097	2026-02-02 08:53:25.097	P.4	18
cml4xn0nn005hevk539a4loey	KIRA	2025	3	2026-02-02 08:53:25.139	2026-02-02 08:53:25.139	P.5	13
cml4xn0ou005ievk5m1ngx63h	KIRA	2025	3	2026-02-02 08:53:25.182	2026-02-02 08:53:25.182	P.6	9
cml4xn0q8005jevk5qsflw177	KIRA	2025	3	2026-02-02 08:53:25.232	2026-02-02 08:53:25.232	P.7	10
cml4x3tdx002sevk574jg94zl	OLD K'LA	2025	3	2026-02-02 08:38:29.251	2026-02-02 08:55:47.512	KG1	0
\.


--
-- Data for Name: Todo; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Todo" (id, "userId", title, description, "dueDate", "isCompleted", "completedAt", "isDeferred", "deferredUntil", priority, category, "reminderSent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UpcomingEvent; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."UpcomingEvent" (id, date, activity, "inCharge", rate, "createdAt", "updatedAt", status) FROM stdin;
cmlebm4cp00af8fauexu82cpo	2026-02-15 00:00:00	Parent-Teacher Conference	Mr. Okello	High	2026-02-08 22:34:33.482	2026-02-08 22:34:33.482	ACTIVE
cmlebm4cu00ag8fau6glk22l6	2026-03-01 00:00:00	Sports Day	Ms. Nakato	Medium	2026-02-08 22:34:33.486	2026-02-08 22:34:33.486	ACTIVE
cmlebm4cw00ah8faunqghk59c	2026-03-20 00:00:00	Board Meeting	GM	High	2026-02-08 22:34:33.489	2026-02-08 22:34:33.489	ACTIVE
cmlebm4cz00ai8fau1lypzyal	2026-04-05 00:00:00	End of Term Exams	Academic Director	High	2026-02-08 22:34:33.492	2026-02-08 22:34:33.492	ACTIVE
cmlebtde700lfnua1c9gfhzmm	2026-02-15 00:00:00	Parent-Teacher Conference	Mr. Okello	High	2026-02-08 22:40:11.791	2026-02-08 22:40:11.791	ACTIVE
cmlebtdeb00lgnua16rzn809j	2026-03-01 00:00:00	Sports Day	Ms. Nakato	Medium	2026-02-08 22:40:11.795	2026-02-08 22:40:11.795	ACTIVE
cmlebtdee00lhnua1lreh3iew	2026-03-20 00:00:00	Board Meeting	GM	High	2026-02-08 22:40:11.798	2026-02-08 22:40:11.798	ACTIVE
cmlebtdeg00linua1z1pv77qc	2026-04-05 00:00:00	End of Term Exams	Academic Director	High	2026-02-08 22:40:11.8	2026-02-08 22:40:11.8	ACTIVE
cmlebtnin00lf5v6wsfys5f80	2026-02-15 00:00:00	Parent-Teacher Conference	Mr. Okello	High	2026-02-08 22:40:24.911	2026-02-08 22:40:24.911	ACTIVE
cmlebtnis00lg5v6wc5jsesv9	2026-03-01 00:00:00	Sports Day	Ms. Nakato	Medium	2026-02-08 22:40:24.917	2026-02-08 22:40:24.917	ACTIVE
cmlebtniw00lh5v6wk1g7uu92	2026-03-20 00:00:00	Board Meeting	GM	High	2026-02-08 22:40:24.92	2026-02-08 22:40:24.92	ACTIVE
cmlebtnj000li5v6wkgog7m40	2026-04-05 00:00:00	End of Term Exams	Academic Director	High	2026-02-08 22:40:24.924	2026-02-08 22:40:24.924	ACTIVE
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt") FROM stdin;
cmlebm36q00008faulhyznd0j	gm@sak.org	$2a$10$/a0Y2Yif5cPBM2yj8rdncON.8CTnSWlB65Py.XkbxMTcXo9HecRam	General Manager	GM	2026-02-08 22:34:31.971	2026-02-08 22:34:31.971
cmlebm39t00018fauhrqcvv6e	trustee@sak.org	$2a$10$N7xZQF/JYyWWoj4SWNhvP.IRcsg6rUBnXakLrBdjBIGMbfHScmTEm	C. Trustee	TRUSTEE	2026-02-08 22:34:32.082	2026-02-11 11:23:42.371
cmljr6vjl0000s982pelp1va0	mus@gmail.com	$2a$12$oV9AqRvMJXbzF3gkMIMUpuVas/3igLgLl0Ip5cEJEyH4WO16gV0QG	mus	GM	2026-02-12 17:49:26.961	2026-02-12 17:49:26.961
\.


--
-- Data for Name: WeeklyReport; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."WeeklyReport" (id, "weekNumber", year, "weekStartDate", "weekEndDate", "publishedAt", "isDraft", "feesCollectionPercent", "schoolsExpenditurePercent", "infrastructurePercent", "totalEnrollment", "theologyEnrollment", "p7PrepExamsPercent", "createdAt", "updatedAt", admissions, "syllabusCoveragePercent", term, "generalManager") FROM stdin;
cmlht4cvi00001086il9q9ra7	1	2026	2025-12-28 21:00:00	2026-01-03 21:00:00	\N	t	10.63636363636364	10	11.45454545454546	0	0	0	2026-02-11 09:07:56.334	2026-02-11 09:07:56.334	45	12.72727272727273	1	\N
\.


--
-- Data for Name: WeeklyScorecard; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."WeeklyScorecard" (id, week, year, school, "academicPercent", "financePercent", "qualityPercent", "tdpPercent", "theologyPercent", "createdAt", "updatedAt", term) FROM stdin;
cmli47auo0014o7udkh0fnclv	2	2024	CPS	85	91.1	90.4	0	95.9	2026-02-11 14:18:09.457	2026-02-12 08:16:38.258	3
cmli47awe0015o7uds8qdzwlg	2	2024	FAIRWAYS	86.4	87	89	0	109.2	2026-02-11 14:18:09.518	2026-02-12 08:16:38.354	3
cmli47axz0016o7ud4nej4k2k	2	2024	KIRA	82.2	97.8	92.2	0	88.8	2026-02-11 14:18:09.575	2026-02-12 08:16:38.44	3
cmli47azf0017o7ud0jlc1uhn	2	2024	KISASI	82.8	93.5	90.3	0	89.5	2026-02-11 14:18:09.627	2026-02-12 08:16:38.517	3
cmli47b190018o7ud4dcdtmtt	2	2024	KITINTALE	83.4	81.6	82.2	0	99.3	2026-02-11 14:18:09.694	2026-02-12 08:16:38.59	3
cmli47b2q0019o7udy1c7s2ln	2	2024	KPM	79.7	81.2	86	0	87.8	2026-02-11 14:18:09.746	2026-02-12 08:16:38.667	3
cmli47b4c001ao7ud9zmsfscm	2	2024	KPS	84.6	85.9	83.8	0	81.7	2026-02-11 14:18:09.804	2026-02-12 08:16:38.743	3
cmli47b67001bo7udg92v0gf0	2	2024	MENGO	89.2	92.5	89.6	0	97.9	2026-02-11 14:18:09.871	2026-02-12 08:16:38.816	3
cmli47b7i001co7ud2rgj8vgn	2	2024	NAKASERO	85.7	92.1	91.8	0	99.3	2026-02-11 14:18:09.918	2026-02-12 08:16:38.908	3
cmli47b8u001do7udiil1nnha	2	2024	Old Kampala	79.8	90	90.5	0	63	2026-02-11 14:18:09.967	2026-02-12 08:16:38.99	3
cmli47ba7001eo7udy47m7gnq	2	2024	WINSTON	84.5	91	91.4	0	91.2	2026-02-11 14:18:10.016	2026-02-12 08:16:39.059	3
cmlebm4fu00b98faushifz6i9	3	2026	CPS	86.09982170139028	76.56354189704805	77.41126531773568	87.39642338333321	80.9637186482966	2026-02-08 22:34:33.594	2026-02-08 22:40:25.053	1
cmlebm4fy00ba8fauy57c7237	3	2026	MENGO	88.37691517269468	85.81458558306443	88.66566400723019	66.76274857860378	89.51963444926001	2026-02-08 22:34:33.598	2026-02-08 22:40:25.057	1
cmlebm4g200bb8faua8q2opdp	3	2026	NAKASERO	70.91894332225586	82.0276107954954	75.26217638392654	88.42746378833723	76.19020701175565	2026-02-08 22:34:33.602	2026-02-08 22:40:25.061	1
cmlebm4g600bc8fauhcuylbkh	3	2026	KISASI	80.17368194926686	78.4852273561321	91.46533317281325	93.91825797394209	94.51384912780841	2026-02-08 22:34:33.606	2026-02-08 22:40:25.066	1
cmlebm4ga00bd8faurcdmkkkw	3	2026	OLD K'LA	92.22820701408136	77.23143360298086	87.12337825763515	91.26238939952654	77.163339924164	2026-02-08 22:34:33.61	2026-02-08 22:40:25.07	1
cmlebm4ge00be8fau17weoglh	3	2026	WINSTON	83.42452793229283	93.32707032096216	88.20310607471721	66.40427001351644	75.23930643954222	2026-02-08 22:34:33.614	2026-02-08 22:40:25.075	1
cmlebm4gj00bf8fau8jm7k5c6	3	2026	FAIRWAYS	76.94414581160001	88.29161450853951	82.12294270634271	70.0326323083572	75.84931202719605	2026-02-08 22:34:33.619	2026-02-08 22:40:25.08	1
cmlebm4gn00bg8fauxbpj6x8z	3	2026	KPM	85.78169947944738	78.57634267075966	75.70571038630764	85.40728232210435	82.28128347482343	2026-02-08 22:34:33.624	2026-02-08 22:40:25.084	1
cmlebm4gr00bh8faunj9wv8om	3	2026	KPS	72.26819053935314	80.71110857083991	70.96348328508432	81.92025714525067	71.2678133936946	2026-02-08 22:34:33.628	2026-02-08 22:40:25.088	1
cmlebm4gw00bi8fauo0ayyizr	3	2026	KITINTALE	70.05775338372281	88.3551251010591	77.15433921611918	82.46465133580358	74.22603775571501	2026-02-08 22:34:33.632	2026-02-08 22:40:25.093	1
cmlebm4h000bj8fau2i0rhzsi	3	2026	KIRA	90.4605464900971	92.82770250543827	94.8986983120467	89.30771887768039	79.35696193827661	2026-02-08 22:34:33.636	2026-02-08 22:40:25.097	1
cmlebm4h400bk8faud2mqpenq	4	2026	CPS	90.47311995048763	91.61565119561794	72.73536174835002	92.9320281226682	74.39227184554319	2026-02-08 22:34:33.64	2026-02-08 22:40:25.101	1
cmlebm4h800bl8fauvjtaep49	4	2026	MENGO	86.65561961969084	76.20331107679739	93.28001646718843	85.71673269101146	92.8789529405127	2026-02-08 22:34:33.645	2026-02-08 22:40:25.106	1
cmlebm4hd00bm8faur70151w3	4	2026	NAKASERO	89.20907015720502	76.07989492789234	74.00032365682999	82.4627245239372	86.05891615055808	2026-02-08 22:34:33.649	2026-02-08 22:40:25.11	1
cmlebm4hi00bn8fau0r9f5m17	4	2026	KISASI	89.7204995333475	81.61882293404315	93.93168928427482	87.58177654379492	79.31674366413698	2026-02-08 22:34:33.654	2026-02-08 22:40:25.114	1
cmlebm4hn00bo8fauf5adekr6	4	2026	OLD K'LA	83.6303035023882	81.52691713436764	93.25746778151392	90.63172722845138	92.69716222046856	2026-02-08 22:34:33.659	2026-02-08 22:40:25.118	1
cmlebm4hs00bp8faulub75uh4	4	2026	WINSTON	90.09254880490275	75.39753099699409	76.3817695940431	80.64758094660353	87.46774990571335	2026-02-08 22:34:33.664	2026-02-08 22:40:25.123	1
cmlebm4hx00bq8fau64r4col0	4	2026	FAIRWAYS	83.04969792725575	79.24479528834904	86.35754132240974	87.58228415716987	77.08027239539345	2026-02-08 22:34:33.669	2026-02-08 22:40:25.128	1
cmlebm4i100br8faubc6oe50f	4	2026	KPM	84.91275155586327	84.86120666362211	72.32755524740062	80.9565611430945	91.58257145188384	2026-02-08 22:34:33.673	2026-02-08 22:40:25.132	1
cmlebm4i400bs8fauabi1flnv	4	2026	KPS	72.23317095981812	89.72801091251027	87.79985460596933	69.36148710495206	79.33619976169956	2026-02-08 22:34:33.677	2026-02-08 22:40:25.136	1
cmlebm4i800bt8fau42re5xm7	4	2026	KITINTALE	78.97884485387276	86.74899577670912	78.67514784075016	81.79951640673758	72.84423169877851	2026-02-08 22:34:33.68	2026-02-08 22:40:25.141	1
cmlebm4ie00bu8fauzejka2no	4	2026	KIRA	84.87346558389022	89.20611795463435	87.9867165827292	79.33785367233222	77.80049131237668	2026-02-08 22:34:33.686	2026-02-08 22:40:25.145	1
cmli46pf1000to7ud4lnvgjbe	1	2024	CPS	84.9	83.7	81.7	0	0	2026-02-11 14:17:41.677	2026-02-11 14:17:41.677	3
cmli46ph5000uo7udizncem0x	1	2024	FAIRWAYS	82.3	78.2	72.5	0	0	2026-02-11 14:17:41.754	2026-02-11 14:17:41.754	3
cmli46pip000vo7uduno7az78	1	2024	KIRA	77.8	80.3	88.7	0	0	2026-02-11 14:17:41.809	2026-02-11 14:17:41.809	3
cmli46pkj000wo7udhendqvxq	1	2024	KISASI	81.3	78.5	87.3	0	0	2026-02-11 14:17:41.875	2026-02-11 14:17:41.875	3
cmli46pm7000xo7udtfaagz56	1	2024	KITINTALE	82.6	75.2	75.6	0	0	2026-02-11 14:17:41.936	2026-02-11 14:17:41.936	3
cmli46pnz000yo7udxrsievpp	1	2024	KPM	79	75.9	69.7	0	0	2026-02-11 14:17:42	2026-02-11 14:17:42	3
cmli46ppk000zo7udpk4iywxu	1	2024	KPS	79.4	76.5	66.9	0	0	2026-02-11 14:17:42.056	2026-02-11 14:17:42.056	3
cmli46psn0011o7ud63c6nq1c	1	2024	NAKASERO	84.3	81.5	83.1	0	0	2026-02-11 14:17:42.167	2026-02-11 14:17:42.167	3
cmli46pu60012o7udacrazow2	1	2024	Old Kampala	73.8	79.8	78.3	0	0	2026-02-11 14:17:42.223	2026-02-11 14:17:42.223	3
cmli46pvk0013o7ud6vvulubk	1	2024	WINSTON	83.8	83.3	88.3	0	0	2026-02-11 14:17:42.273	2026-02-11 14:17:42.273	3
cmlj74qlg000b4zu08xiwa9s3	3	2024	CPS	81.9	94.1	88.4	0	95	2026-02-12 08:27:54.916	2026-02-12 08:27:54.916	3
cmli46pr20010o7udg1id6z8x	1	2024	MENGO	86.1	85.5	87.1	0	0	2026-02-11 14:17:42.111	2026-02-12 07:14:57.337	3
cmlj74qnm000c4zu077d0yumh	3	2024	FAIRWAYS	84.7	91.6	90.5	0	96	2026-02-12 08:27:54.994	2026-02-12 08:27:54.994	3
cmlj74qpq000d4zu0bkaonkqr	3	2024	KIRA	76.9	98.7	93.3	0	89	2026-02-12 08:27:55.07	2026-02-12 08:27:55.07	3
cmlj74qrt000e4zu014chbv47	3	2024	KISASI	80.8	92	87	0	91	2026-02-12 08:27:55.145	2026-02-12 08:27:55.145	3
cmlj74quf000f4zu0n4j3by2a	3	2024	KITINTALE	80.4	85.4	87.2	0	99	2026-02-12 08:27:55.239	2026-02-12 08:27:55.239	3
cmlj74qx6000g4zu0j60n50zl	3	2024	KPM	78.9	90.2	89	0	84.5	2026-02-12 08:27:55.339	2026-02-12 08:27:55.339	3
cmlj74r04000h4zu01t6uq2cd	3	2024	KPS	82.5	86.4	86.3	0	81.7	2026-02-12 08:27:55.444	2026-02-12 08:27:55.444	3
cmlj74r2m000i4zu0a669ak5d	3	2024	MENGO	87	95	90.7	0	97	2026-02-12 08:27:55.534	2026-02-12 08:27:55.534	3
cmlj74r53000j4zu0vsf8y1y1	3	2024	NAKASERO	83.1	95.4	93.1	0	95	2026-02-12 08:27:55.624	2026-02-12 08:27:55.624	3
cmlj74r77000k4zu00bxtas6v	3	2024	Old Kampala	77.1	93.5	89.5	0	90	2026-02-12 08:27:55.699	2026-02-12 08:27:55.699	3
cmlj74r9c000l4zu0cyvj50xl	3	2024	WINSTON	82.2	94	90.2	0	92	2026-02-12 08:27:55.776	2026-02-12 08:27:55.776	3
cmlj829yh000m4zu0ope4qfvc	4	2024	CPS	78.7	91.7	90.3	0	87.3	2026-02-12 08:53:59.655	2026-02-12 08:53:59.655	3
cmlj82a1i000n4zu0daukf452	4	2024	FAIRWAYS	80.7	88.5	89.1	0	100	2026-02-12 08:53:59.766	2026-02-12 08:53:59.766	3
cmlj82a40000o4zu0wur35r0t	4	2024	KIRA	71.2	96.8	93.4	0	97.3	2026-02-12 08:53:59.856	2026-02-12 08:53:59.856	3
cmlj82a6r000p4zu0gxp4bb9m	4	2024	KISASI	79.7	91.5	84.3	0	99.5	2026-02-12 08:53:59.956	2026-02-12 08:53:59.956	3
cmlj82aak000q4zu0f7vu1ufc	4	2024	KITINTALE	78	88.7	85.6	0	83	2026-02-12 08:54:00.092	2026-02-12 08:54:00.092	3
cmlj82adh000r4zu0z6ylrn73	4	2024	KPM	77.2	85.2	86.7	0	81.2	2026-02-12 08:54:00.197	2026-02-12 08:54:00.197	3
cmlj82age000s4zu0wqigecv0	4	2024	KPS	81.2	86.7	86.2	0	100	2026-02-12 08:54:00.302	2026-02-12 08:54:00.302	3
cmlj82aio000t4zu08uo55wmg	4	2024	MENGO	82.3	92.2	91.1	0	96.5	2026-02-12 08:54:00.385	2026-02-12 08:54:00.385	3
cmlj82akv000u4zu0iqbzgh96	4	2024	NAKASERO	78	92.1	93.4	0	85.8	2026-02-12 08:54:00.464	2026-02-12 08:54:00.464	3
cmlj82an8000v4zu0hxnijxjn	4	2024	Old Kampala	73.7	91	90	0	93.9	2026-02-12 08:54:00.548	2026-02-12 08:54:00.548	3
cmlj82app000w4zu0hp1bynt0	4	2024	WINSTON	79.2	91.5	93.2	0	99.1	2026-02-12 08:54:00.638	2026-02-12 08:54:00.638	3
cmlj87yw4000x4zu0pvk434m2	4	2025	CPS	27.1	11.72	23	7.9	7.9	2026-02-12 08:58:25.252	2026-02-12 08:58:25.252	3
cmlj87yyq000y4zu0o6ispj6l	4	2025	FAIRWAYS	34.5	11.64	23.7	6.6	7.9	2026-02-12 08:58:25.346	2026-02-12 08:58:25.346	3
cmlj87z14000z4zu0p1matf46	4	2025	KIRA	32.8	13.11	24	6.8	8.1	2026-02-12 08:58:25.432	2026-02-12 08:58:25.432	3
cmlj87z3m00104zu00xo7ub6x	4	2025	KISASI	30.9	12.17	23.4	7.6	6.4	2026-02-12 08:58:25.522	2026-02-12 08:58:25.522	3
cmlj87z5z00114zu0ju1ktqyv	4	2025	KITINTALE	29.7	11.29	23.5	6.9	9.3	2026-02-12 08:58:25.607	2026-02-12 08:58:25.607	3
cmlj87z8o00124zu0y526f1c7	4	2025	KPM	31.5	10.52	23.5	6.9	8.2	2026-02-12 08:58:25.704	2026-02-12 08:58:25.704	3
cmlj87zb000134zu02w9wxnqd	4	2025	KPS	31.3	10.83	23.7	7.9	6.7	2026-02-12 08:58:25.788	2026-02-12 08:58:25.788	3
cmlj87zdb00144zu0hxh55k2l	4	2025	MENGO	33.4	12.02	23.9	7.6	8.4	2026-02-12 08:58:25.872	2026-02-12 08:58:25.872	3
cmlj87zh600154zu04h5cmcvj	4	2025	NAKASERO	29.9	12.02	24.1	7.5	9	2026-02-12 08:58:26.01	2026-02-12 08:58:26.01	3
cmlj87zke00164zu0hv7jdbih	4	2025	Old Kampala	29.4	11.98	23.5	8.1	8	2026-02-12 08:58:26.127	2026-02-12 08:58:26.127	3
cmlj87znq00174zu07144nb68	4	2025	WINSTON	30.7	11.44	23.4	8.5	8.1	2026-02-12 08:58:26.246	2026-02-12 08:58:26.246	3
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4bea157b-e8a5-4ca1-b800-951a15f0fc2c	29b1cc97f48783f2df393e3e17118be01be7767e1773e9880f8d067e02e3d014	2026-02-09 01:32:41.856884+03	20260118204035_gm_portal_init	\N	\N	2026-02-09 01:32:41.783323+03	1
a0a54d95-f96e-4efc-8a90-d4f81322e352	dcabf76a59ec8eedc67c1d92bb361e0f0ba3faf0ec5e99ec1da54358db7cea51	2026-02-09 01:32:42.163957+03	20260202120838_update_enrollment_model	\N	\N	2026-02-09 01:32:42.140256+03	1
d43acfa3-41e6-4f46-95ec-8b85a6711822	555c692aa10ac29c502ac1b526e95241d1e6fea9e492017c81c6a6cce5e7fc0b	2026-02-09 01:32:41.885558+03	20260118205121_add_weekly_reports_reactions	\N	\N	2026-02-09 01:32:41.858579+03	1
3806b395-d873-4171-b9d3-4a5608384363	92154109c0b4d7aa11e63a451398e7e5a2382ac199a59ba04b11aadb4d4636df	2026-02-09 01:32:41.908647+03	20260118225121_add_schools_departments	\N	\N	2026-02-09 01:32:41.886908+03	1
cd10c23e-aaec-4d4e-ad21-2deed653d1cd	6ef6ab3af645cebb2219ca48c3db19c97efd7ce9397775fb10cd5f970ee47de1	2026-02-09 01:32:41.951612+03	20260118234751_add_messages_notifications	\N	\N	2026-02-09 01:32:41.911719+03	1
90d4b701-2da2-4d1f-a480-40debdcb0421	9afed278e74d9f0b72cebb24e089ffe0d260afeb8946bca734aa03957abd080a	2026-02-09 01:32:42.171815+03	20260203090503_rename_amount_to_percentage	\N	\N	2026-02-09 01:32:42.165835+03	1
c4f2460f-e6cd-462f-b5e0-00f69fe7860d	14b58db291512093be8b1771ad1a4206e74f3d052bdc01101c3e3391a4946003	2026-02-09 01:32:41.961029+03	20260121184923_add_syllabus_and_admissions	\N	\N	2026-02-09 01:32:41.955015+03	1
567f29ba-15dc-4327-b2fe-56d1d13c7116	b2e2c8414c99a73c2f3ba864dae9e532907a8db15febee17353d28dab308a443	2026-02-09 01:32:41.976406+03	20260121201311_add_red_issue_item_status	\N	\N	2026-02-09 01:32:41.962984+03	1
71808b33-357e-4a96-baf6-1ef06e788ad7	2fd05faa5a6e8a67c920c2ec034af1e27a7abbe12dc8ca6ea9e608f88e97544e	2026-02-09 01:32:41.983639+03	20260121203631_add_p7_cohort_journey	\N	\N	2026-02-09 01:32:41.978107+03	1
0afb1a69-af81-41f0-a9e0-7eb0ebf1c6d1	e340b4d62bcc4ced131bd115e289c46e53ebdeaed1c45bd8549a5a591b407f61	2026-02-09 01:32:42.19643+03	20260203182104_add_p7_prep_results	\N	\N	2026-02-09 01:32:42.173586+03	1
d54c4ab2-a251-4252-ba61-ea66306a2962	7b7aab0c47be349be05542dcb6887d3031b0b209fb782067de89a4f1ed3e87f0	2026-02-09 01:32:41.999407+03	20260122154631_make_income_dynamic	\N	\N	2026-02-09 01:32:41.986089+03	1
857f7fa2-61cd-48e6-8d00-a36d62922ebf	297d10df39fe38198a19e8e4519c4395b56452d4d7ad5a49b480baee6759a244	2026-02-09 01:32:42.039331+03	20260125133904_add_term_support	\N	\N	2026-02-09 01:32:42.000656+03	1
e8d68ab1-7fdd-4dd7-a2e2-d459b119206f	2161218f8a78d0318dc9080765cd70e115aaab7d907a4a54beb0ccf93da11c3a	2026-02-09 01:32:42.055541+03	20260126205809_add_term_start_config	\N	\N	2026-02-09 01:32:42.040587+03	1
fe587c4d-65f4-470e-aa74-8464d3db6545	3ba36129704dde153847a5c4924382dc59b35800bb044347dae652f63b793f14	2026-02-09 01:32:42.213986+03	20260204080114_add_comments_model	\N	\N	2026-02-09 01:32:42.197731+03	1
10415ea1-d981-4e6c-820b-9edd8c7ba5dd	26dd1dae22de18d081f17a4a7c05cef6ebde95930c6ecac33e784c13f632ec8a	2026-02-09 01:32:42.08581+03	20260130082531_add_theology_enrollment	\N	\N	2026-02-09 01:32:42.056845+03	1
8b82784a-2274-41c3-9c70-0f032100fc6e	0ea5413c21e81754872d876953f073e0fef0025471af9e307011279542c7bf18	2026-02-09 01:32:42.105023+03	20260202075723_restructure_theology_enrollment	\N	\N	2026-02-09 01:32:42.087668+03	1
62fe03e4-91ed-4d4c-9538-f897524ea589	4cbba1b77ee65a2c61169ad1393082b92630adfb817920a35ed0cba4cd2b0921	2026-02-09 01:32:42.138399+03	20260202115721_add_school_enrollment	\N	\N	2026-02-09 01:32:42.107154+03	1
430d8c1e-3d6a-4625-8d70-1bf446162b13	16f20b79521fb51a959a60c4ef451659fa8bc9af4270ef4356bd379357d14754	2026-02-09 01:32:42.287248+03	20260204083104_add_trustee_features_models	\N	\N	2026-02-09 01:32:42.215492+03	1
58c02a11-4c30-4bfd-bb5f-bd09d49259f4	884e10cf72d38d6137b339a5ed138f14997df5b17afe0610dfd51f0adb31d3e4	2026-02-09 01:32:42.295244+03	20260207070841_add_amount_to_other_income	\N	\N	2026-02-09 01:32:42.288945+03	1
b6658ab7-9473-4cc0-9c81-ff150149691d	07e60e3d545554f0773983c832215b63bb5599d6bfe9a5eeead1e538a7248775	2026-02-09 01:32:42.32601+03	20260207211427_add_ple_results	\N	\N	2026-02-09 01:32:42.296945+03	1
\.


--
-- Name: AlertConfig AlertConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."AlertConfig"
    ADD CONSTRAINT "AlertConfig_pkey" PRIMARY KEY (id);


--
-- Name: AlertHistory AlertHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."AlertHistory"
    ADD CONSTRAINT "AlertHistory_pkey" PRIMARY KEY (id);


--
-- Name: BudgetEntry BudgetEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."BudgetEntry"
    ADD CONSTRAINT "BudgetEntry_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Enrollment Enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: FinancialEntry FinancialEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."FinancialEntry"
    ADD CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY (id);


--
-- Name: GMProject GMProject_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."GMProject"
    ADD CONSTRAINT "GMProject_pkey" PRIMARY KEY (id);


--
-- Name: Goal Goal_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Goal"
    ADD CONSTRAINT "Goal_pkey" PRIMARY KEY (id);


--
-- Name: IncomeSource IncomeSource_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."IncomeSource"
    ADD CONSTRAINT "IncomeSource_pkey" PRIMARY KEY (id);


--
-- Name: KPIData KPIData_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."KPIData"
    ADD CONSTRAINT "KPIData_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrganizationalGoal OrganizationalGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."OrganizationalGoal"
    ADD CONSTRAINT "OrganizationalGoal_pkey" PRIMARY KEY (id);


--
-- Name: OtherIncome OtherIncome_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."OtherIncome"
    ADD CONSTRAINT "OtherIncome_pkey" PRIMARY KEY (id);


--
-- Name: P6PromotionResult P6PromotionResult_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."P6PromotionResult"
    ADD CONSTRAINT "P6PromotionResult_pkey" PRIMARY KEY (id);


--
-- Name: P7PleResult P7PleResult_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."P7PleResult"
    ADD CONSTRAINT "P7PleResult_pkey" PRIMARY KEY (id);


--
-- Name: P7PrepPerformance P7PrepPerformance_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."P7PrepPerformance"
    ADD CONSTRAINT "P7PrepPerformance_pkey" PRIMARY KEY (id);


--
-- Name: P7PrepResult P7PrepResult_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."P7PrepResult"
    ADD CONSTRAINT "P7PrepResult_pkey" PRIMARY KEY (id);


--
-- Name: PLEResult PLEResult_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."PLEResult"
    ADD CONSTRAINT "PLEResult_pkey" PRIMARY KEY (id);


--
-- Name: PushSubscription PushSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_pkey" PRIMARY KEY (id);


--
-- Name: Reaction Reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_pkey" PRIMARY KEY (id);


--
-- Name: RedIssue RedIssue_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."RedIssue"
    ADD CONSTRAINT "RedIssue_pkey" PRIMARY KEY (id);


--
-- Name: SchoolKPIData SchoolKPIData_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."SchoolKPIData"
    ADD CONSTRAINT "SchoolKPIData_pkey" PRIMARY KEY (id);


--
-- Name: School School_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_pkey" PRIMARY KEY (id);


--
-- Name: TermSetting TermSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."TermSetting"
    ADD CONSTRAINT "TermSetting_pkey" PRIMARY KEY (id);


--
-- Name: TheologyEnrollment TheologyEnrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."TheologyEnrollment"
    ADD CONSTRAINT "TheologyEnrollment_pkey" PRIMARY KEY (id);


--
-- Name: Todo Todo_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_pkey" PRIMARY KEY (id);


--
-- Name: UpcomingEvent UpcomingEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."UpcomingEvent"
    ADD CONSTRAINT "UpcomingEvent_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WeeklyReport WeeklyReport_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."WeeklyReport"
    ADD CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY (id);


--
-- Name: WeeklyScorecard WeeklyScorecard_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."WeeklyScorecard"
    ADD CONSTRAINT "WeeklyScorecard_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AlertConfig_isActive_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertConfig_isActive_idx" ON public."AlertConfig" USING btree ("isActive");


--
-- Name: AlertConfig_type_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertConfig_type_idx" ON public."AlertConfig" USING btree (type);


--
-- Name: AlertHistory_configId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertHistory_configId_idx" ON public."AlertHistory" USING btree ("configId");


--
-- Name: AlertHistory_createdAt_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertHistory_createdAt_idx" ON public."AlertHistory" USING btree ("createdAt");


--
-- Name: AlertHistory_isResolved_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertHistory_isResolved_idx" ON public."AlertHistory" USING btree ("isResolved");


--
-- Name: AlertHistory_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertHistory_school_idx" ON public."AlertHistory" USING btree (school);


--
-- Name: AlertHistory_severity_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "AlertHistory_severity_idx" ON public."AlertHistory" USING btree (severity);


--
-- Name: BudgetEntry_category_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "BudgetEntry_category_idx" ON public."BudgetEntry" USING btree (category);


--
-- Name: BudgetEntry_year_term_category_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "BudgetEntry_year_term_category_key" ON public."BudgetEntry" USING btree (year, term, category);


--
-- Name: BudgetEntry_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "BudgetEntry_year_term_idx" ON public."BudgetEntry" USING btree (year, term);


--
-- Name: Comment_createdAt_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Comment_createdAt_idx" ON public."Comment" USING btree ("createdAt");


--
-- Name: Comment_field_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Comment_field_idx" ON public."Comment" USING btree (field);


--
-- Name: Comment_reportId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Comment_reportId_idx" ON public."Comment" USING btree ("reportId");


--
-- Name: Department_name_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Department_name_idx" ON public."Department" USING btree (name);


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: Enrollment_school_class_term_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "Enrollment_school_class_term_year_key" ON public."Enrollment" USING btree (school, class, term, year);


--
-- Name: Enrollment_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Enrollment_school_idx" ON public."Enrollment" USING btree (school);


--
-- Name: Enrollment_school_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Enrollment_school_year_term_idx" ON public."Enrollment" USING btree (school, year, term);


--
-- Name: Enrollment_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Enrollment_year_term_idx" ON public."Enrollment" USING btree (year, term);


--
-- Name: FinancialEntry_category_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "FinancialEntry_category_idx" ON public."FinancialEntry" USING btree (category);


--
-- Name: FinancialEntry_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "FinancialEntry_school_idx" ON public."FinancialEntry" USING btree (school);


--
-- Name: FinancialEntry_source_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "FinancialEntry_source_idx" ON public."FinancialEntry" USING btree (source);


--
-- Name: FinancialEntry_type_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "FinancialEntry_type_idx" ON public."FinancialEntry" USING btree (type);


--
-- Name: FinancialEntry_year_term_month_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "FinancialEntry_year_term_month_idx" ON public."FinancialEntry" USING btree (year, term, month);


--
-- Name: GMProject_status_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "GMProject_status_idx" ON public."GMProject" USING btree (status);


--
-- Name: Goal_status_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Goal_status_idx" ON public."Goal" USING btree (status);


--
-- Name: Goal_title_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "Goal_title_year_key" ON public."Goal" USING btree (title, year);


--
-- Name: Goal_year_category_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Goal_year_category_idx" ON public."Goal" USING btree (year, category);


--
-- Name: IncomeSource_name_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "IncomeSource_name_idx" ON public."IncomeSource" USING btree (name);


--
-- Name: IncomeSource_name_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "IncomeSource_name_key" ON public."IncomeSource" USING btree (name);


--
-- Name: KPIData_month_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "KPIData_month_year_key" ON public."KPIData" USING btree (month, year);


--
-- Name: KPIData_year_month_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "KPIData_year_month_idx" ON public."KPIData" USING btree (year, month);


--
-- Name: Message_createdAt_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Message_createdAt_idx" ON public."Message" USING btree ("createdAt");


--
-- Name: Message_isRead_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Message_isRead_idx" ON public."Message" USING btree ("isRead");


--
-- Name: Message_recipientId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Message_recipientId_idx" ON public."Message" USING btree ("recipientId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- Name: Notification_type_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Notification_type_idx" ON public."Notification" USING btree (type);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OrganizationalGoal_category_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OrganizationalGoal_category_idx" ON public."OrganizationalGoal" USING btree (category);


--
-- Name: OrganizationalGoal_status_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OrganizationalGoal_status_idx" ON public."OrganizationalGoal" USING btree (status);


--
-- Name: OrganizationalGoal_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OrganizationalGoal_year_term_idx" ON public."OrganizationalGoal" USING btree (year, term);


--
-- Name: OtherIncome_source_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OtherIncome_source_idx" ON public."OtherIncome" USING btree (source);


--
-- Name: OtherIncome_year_term_month_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OtherIncome_year_term_month_idx" ON public."OtherIncome" USING btree (year, term, month);


--
-- Name: OtherIncome_year_term_week_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OtherIncome_year_term_week_idx" ON public."OtherIncome" USING btree (year, term, week);


--
-- Name: P6PromotionResult_school_year_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P6PromotionResult_school_year_idx" ON public."P6PromotionResult" USING btree (school, year);


--
-- Name: P6PromotionResult_school_year_setNumber_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "P6PromotionResult_school_year_setNumber_key" ON public."P6PromotionResult" USING btree (school, year, "setNumber");


--
-- Name: P6PromotionResult_year_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P6PromotionResult_year_idx" ON public."P6PromotionResult" USING btree (year);


--
-- Name: P6PromotionResult_year_setNumber_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P6PromotionResult_year_setNumber_idx" ON public."P6PromotionResult" USING btree (year, "setNumber");


--
-- Name: P7PleResult_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PleResult_school_idx" ON public."P7PleResult" USING btree (school);


--
-- Name: P7PleResult_school_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "P7PleResult_school_year_key" ON public."P7PleResult" USING btree (school, year);


--
-- Name: P7PleResult_year_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PleResult_year_idx" ON public."P7PleResult" USING btree (year);


--
-- Name: P7PrepPerformance_year_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PrepPerformance_year_idx" ON public."P7PrepPerformance" USING btree (year);


--
-- Name: P7PrepPerformance_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "P7PrepPerformance_year_key" ON public."P7PrepPerformance" USING btree (year);


--
-- Name: P7PrepResult_prepNumber_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PrepResult_prepNumber_idx" ON public."P7PrepResult" USING btree ("prepNumber");


--
-- Name: P7PrepResult_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PrepResult_school_idx" ON public."P7PrepResult" USING btree (school);


--
-- Name: P7PrepResult_school_prepNumber_term_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "P7PrepResult_school_prepNumber_term_year_key" ON public."P7PrepResult" USING btree (school, "prepNumber", term, year);


--
-- Name: P7PrepResult_school_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PrepResult_school_year_term_idx" ON public."P7PrepResult" USING btree (school, year, term);


--
-- Name: P7PrepResult_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "P7PrepResult_year_term_idx" ON public."P7PrepResult" USING btree (year, term);


--
-- Name: PLEResult_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "PLEResult_school_idx" ON public."PLEResult" USING btree (school);


--
-- Name: PLEResult_school_year_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "PLEResult_school_year_idx" ON public."PLEResult" USING btree (school, year);


--
-- Name: PLEResult_school_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "PLEResult_school_year_key" ON public."PLEResult" USING btree (school, year);


--
-- Name: PLEResult_year_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "PLEResult_year_idx" ON public."PLEResult" USING btree (year);


--
-- Name: PushSubscription_endpoint_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON public."PushSubscription" USING btree (endpoint);


--
-- Name: PushSubscription_isActive_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "PushSubscription_isActive_idx" ON public."PushSubscription" USING btree ("isActive");


--
-- Name: PushSubscription_userId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "PushSubscription_userId_idx" ON public."PushSubscription" USING btree ("userId");


--
-- Name: Reaction_sectionId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Reaction_sectionId_idx" ON public."Reaction" USING btree ("sectionId");


--
-- Name: Reaction_weeklyReportId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Reaction_weeklyReportId_idx" ON public."Reaction" USING btree ("weeklyReportId");


--
-- Name: RedIssue_itemStatus_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "RedIssue_itemStatus_idx" ON public."RedIssue" USING btree ("itemStatus");


--
-- Name: RedIssue_status_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "RedIssue_status_idx" ON public."RedIssue" USING btree (status);


--
-- Name: SchoolKPIData_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "SchoolKPIData_school_idx" ON public."SchoolKPIData" USING btree (school);


--
-- Name: SchoolKPIData_weeklyReportId_school_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "SchoolKPIData_weeklyReportId_school_key" ON public."SchoolKPIData" USING btree ("weeklyReportId", school);


--
-- Name: SchoolKPIData_year_term_week_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "SchoolKPIData_year_term_week_idx" ON public."SchoolKPIData" USING btree (year, term, week);


--
-- Name: School_name_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "School_name_idx" ON public."School" USING btree (name);


--
-- Name: School_name_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "School_name_key" ON public."School" USING btree (name);


--
-- Name: TermSetting_startDate_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "TermSetting_startDate_idx" ON public."TermSetting" USING btree ("startDate");


--
-- Name: TermSetting_term_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "TermSetting_term_year_key" ON public."TermSetting" USING btree (term, year);


--
-- Name: TermSetting_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "TermSetting_year_term_idx" ON public."TermSetting" USING btree (year, term);


--
-- Name: TheologyEnrollment_school_class_term_year_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "TheologyEnrollment_school_class_term_year_key" ON public."TheologyEnrollment" USING btree (school, class, term, year);


--
-- Name: TheologyEnrollment_school_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "TheologyEnrollment_school_idx" ON public."TheologyEnrollment" USING btree (school);


--
-- Name: TheologyEnrollment_school_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "TheologyEnrollment_school_year_term_idx" ON public."TheologyEnrollment" USING btree (school, year, term);


--
-- Name: TheologyEnrollment_year_term_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "TheologyEnrollment_year_term_idx" ON public."TheologyEnrollment" USING btree (year, term);


--
-- Name: Todo_dueDate_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Todo_dueDate_idx" ON public."Todo" USING btree ("dueDate");


--
-- Name: Todo_isCompleted_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Todo_isCompleted_idx" ON public."Todo" USING btree ("isCompleted");


--
-- Name: Todo_isDeferred_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Todo_isDeferred_idx" ON public."Todo" USING btree ("isDeferred");


--
-- Name: Todo_userId_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "Todo_userId_idx" ON public."Todo" USING btree ("userId");


--
-- Name: UpcomingEvent_date_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "UpcomingEvent_date_idx" ON public."UpcomingEvent" USING btree (date);


--
-- Name: UpcomingEvent_status_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "UpcomingEvent_status_idx" ON public."UpcomingEvent" USING btree (status);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: WeeklyReport_publishedAt_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "WeeklyReport_publishedAt_idx" ON public."WeeklyReport" USING btree ("publishedAt");


--
-- Name: WeeklyReport_weekNumber_year_term_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "WeeklyReport_weekNumber_year_term_key" ON public."WeeklyReport" USING btree ("weekNumber", year, term);


--
-- Name: WeeklyReport_year_term_weekNumber_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "WeeklyReport_year_term_weekNumber_idx" ON public."WeeklyReport" USING btree (year, term, "weekNumber");


--
-- Name: WeeklyScorecard_week_year_term_school_key; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE UNIQUE INDEX "WeeklyScorecard_week_year_term_school_key" ON public."WeeklyScorecard" USING btree (week, year, term, school);


--
-- Name: WeeklyScorecard_year_term_week_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "WeeklyScorecard_year_term_week_idx" ON public."WeeklyScorecard" USING btree (year, term, week);


--
-- Name: Comment Comment_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."WeeklyReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PushSubscription PushSubscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reaction Reaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reaction Reaction_weeklyReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES public."WeeklyReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolKPIData SchoolKPIData_weeklyReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."SchoolKPIData"
    ADD CONSTRAINT "SchoolKPIData_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES public."WeeklyReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Todo Todo_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KKR3gJFG0ud2klA1WEyE6CyFRTp6A3w9CIpCm1l8hYTTSI8bSoCvfyV9H1FgUpl


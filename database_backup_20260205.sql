--
-- PostgreSQL database dump
--

\restrict sFIC7G7kQPoc46yRG16duWsB6rhF63SZ6xWRA4zOBhVcZIWBNkSAPSSApJG0xP6

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: mustafa
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO mustafa;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: mustafa
--

COMMENT ON SCHEMA public IS '';


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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    month integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."OtherIncome" OWNER TO mustafa;

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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."P7PrepResult" OWNER TO mustafa;

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
cml56pg480000hkeb4fampd2b	KITINTALE	KG1	1	2025	29	2026-02-02 13:07:15.001	2026-02-02 13:07:15.001
cml56pg6d0001hkebh9sqa8w3	KITINTALE	KG2	1	2025	0	2026-02-02 13:07:15.109	2026-02-02 13:07:15.109
cml56pg8d0002hkeb68vp7w7m	KITINTALE	KG3	1	2025	0	2026-02-02 13:07:15.181	2026-02-02 13:07:15.181
cml56pg9i0003hkebu5x7509j	KITINTALE	P.1	1	2025	0	2026-02-02 13:07:15.222	2026-02-02 13:07:15.222
cml56pgb60004hkebxh7n7ct5	KITINTALE	P.2	1	2025	0	2026-02-02 13:07:15.282	2026-02-02 13:07:15.282
cml56pgce0005hkeb7n5gk0w1	KITINTALE	P.3	1	2025	0	2026-02-02 13:07:15.326	2026-02-02 13:07:15.326
cml56pgdg0006hkebszhuz07f	KITINTALE	P.4	1	2025	0	2026-02-02 13:07:15.364	2026-02-02 13:07:15.364
cml56pger0007hkebbsgzcxpj	KITINTALE	P.5	1	2025	0	2026-02-02 13:07:15.411	2026-02-02 13:07:15.411
cml56pgfq0008hkebfi95dbes	KITINTALE	P.6	1	2025	0	2026-02-02 13:07:15.447	2026-02-02 13:07:15.447
cml56pgh90009hkeb0vr6572i	KITINTALE	P.7	1	2025	0	2026-02-02 13:07:15.502	2026-02-02 13:07:15.502
cml56q7tj000ahkebp2rlidco	MENGO	KG1	1	2025	99	2026-02-02 13:07:50.935	2026-02-02 13:07:50.935
cml56q7v0000bhkeboyh310jv	MENGO	KG2	1	2025	0	2026-02-02 13:07:50.988	2026-02-02 13:07:50.988
cml56q7x9000chkebuagdt539	MENGO	KG3	1	2025	0	2026-02-02 13:07:51.069	2026-02-02 13:07:51.069
cml56q7yn000dhkebssgb0d5u	MENGO	P.1	1	2025	0	2026-02-02 13:07:51.12	2026-02-02 13:07:51.12
cml56q803000ehkeb5igt7e7x	MENGO	P.2	1	2025	0	2026-02-02 13:07:51.171	2026-02-02 13:07:51.171
cml56q812000fhkebp4ztwrrn	MENGO	P.3	1	2025	0	2026-02-02 13:07:51.206	2026-02-02 13:07:51.206
cml56q82m000ghkebaflib5tw	MENGO	P.4	1	2025	0	2026-02-02 13:07:51.261	2026-02-02 13:07:51.261
cml56q83j000hhkebzrbmpdx9	MENGO	P.5	1	2025	0	2026-02-02 13:07:51.295	2026-02-02 13:07:51.295
cml56q84u000ihkebvpivmgtw	MENGO	P.6	1	2025	0	2026-02-02 13:07:51.342	2026-02-02 13:07:51.342
cml56q85v000jhkeb6ciy4qb6	MENGO	P.7	1	2025	0	2026-02-02 13:07:51.379	2026-02-02 13:07:51.379
cml56qpne000khkeb82yimr4c	CPS	KG1	1	2025	70	2026-02-02 13:08:14.042	2026-02-02 13:08:14.042
cml56qpoe000lhkeb4uq773r6	CPS	KG2	1	2025	0	2026-02-02 13:08:14.078	2026-02-02 13:08:14.078
cml56qpqd000mhkebmrxpnhk5	CPS	KG3	1	2025	0	2026-02-02 13:08:14.149	2026-02-02 13:08:14.149
cml56qprx000nhkebreqi13rs	CPS	P.1	1	2025	0	2026-02-02 13:08:14.205	2026-02-02 13:08:14.205
cml56qptc000ohkebnqaom16n	CPS	P.2	1	2025	0	2026-02-02 13:08:14.257	2026-02-02 13:08:14.257
cml56qpuo000phkebmumzz9cl	CPS	P.3	1	2025	0	2026-02-02 13:08:14.304	2026-02-02 13:08:14.304
cml56qpvo000qhkeb3xuh97tk	CPS	P.4	1	2025	0	2026-02-02 13:08:14.34	2026-02-02 13:08:14.34
cml56qpx5000rhkebtsgfqfrk	CPS	P.5	1	2025	0	2026-02-02 13:08:14.393	2026-02-02 13:08:14.393
cml56qpy5000shkeb1gqf0wc8	CPS	P.6	1	2025	0	2026-02-02 13:08:14.43	2026-02-02 13:08:14.43
cml56qpzt000thkebanyaooji	CPS	P.7	1	2025	0	2026-02-02 13:08:14.489	2026-02-02 13:08:14.489
cml56rt3v000uhkeb1lod1eyz	KISASI	KG1	1	2025	70	2026-02-02 13:09:05.179	2026-02-02 13:09:05.179
cml56rt5o000vhkebkiase8fs	KISASI	KG2	1	2025	0	2026-02-02 13:09:05.244	2026-02-02 13:09:05.244
cml56rt7y000whkebnwgvynd6	KISASI	KG3	1	2025	0	2026-02-02 13:09:05.326	2026-02-02 13:09:05.326
cml56rt97000xhkebm6dmhkfy	KISASI	P.1	1	2025	0	2026-02-02 13:09:05.371	2026-02-02 13:09:05.371
cml56rtbc000yhkebckzijffv	KISASI	P.2	1	2025	0	2026-02-02 13:09:05.447	2026-02-02 13:09:05.447
cml56rte8000zhkebcynxfggp	KISASI	P.3	1	2025	0	2026-02-02 13:09:05.552	2026-02-02 13:09:05.552
cml56rtfz0010hkeb1owyiewc	KISASI	P.4	1	2025	0	2026-02-02 13:09:05.615	2026-02-02 13:09:05.615
cml56rthl0011hkebiw2kifg0	KISASI	P.5	1	2025	0	2026-02-02 13:09:05.674	2026-02-02 13:09:05.674
cml56rtit0012hkeb5m68mir7	KISASI	P.6	1	2025	0	2026-02-02 13:09:05.718	2026-02-02 13:09:05.718
cml56rtkg0013hkeb2xmq4t0b	KISASI	P.7	1	2025	0	2026-02-02 13:09:05.777	2026-02-02 13:09:05.777
cml56s4oy0014hkebdzt2ka7a	NAKASERO	KG1	1	2025	45	2026-02-02 13:09:20.193	2026-02-02 13:09:20.193
cml56s4q20015hkebwqk1j4cw	NAKASERO	KG2	1	2025	0	2026-02-02 13:09:20.234	2026-02-02 13:09:20.234
cml56s4rt0016hkeb347hnrva	NAKASERO	KG3	1	2025	0	2026-02-02 13:09:20.296	2026-02-02 13:09:20.296
cml56s4t50017hkebn9i9d9ch	NAKASERO	P.1	1	2025	0	2026-02-02 13:09:20.345	2026-02-02 13:09:20.345
cml56s4ub0018hkebfbvulbx6	NAKASERO	P.2	1	2025	0	2026-02-02 13:09:20.387	2026-02-02 13:09:20.387
cml56s4vt0019hkeboo5vu17d	NAKASERO	P.3	1	2025	0	2026-02-02 13:09:20.441	2026-02-02 13:09:20.441
cml56s4wu001ahkebxn3i68hj	NAKASERO	P.4	1	2025	0	2026-02-02 13:09:20.479	2026-02-02 13:09:20.479
cml56s4y9001bhkebd4ae32mn	NAKASERO	P.5	1	2025	0	2026-02-02 13:09:20.529	2026-02-02 13:09:20.529
cml56s4zm001chkeblzragffn	NAKASERO	P.6	1	2025	0	2026-02-02 13:09:20.578	2026-02-02 13:09:20.578
cml56s51g001dhkeb8fbbt2nt	NAKASERO	P.7	1	2025	0	2026-02-02 13:09:20.644	2026-02-02 13:09:20.644
cml56sm2t001ehkebliiyvxli	FAIRWAYS	KG1	1	2025	26	2026-02-02 13:09:42.725	2026-02-02 13:09:42.725
cml56sm44001fhkebdq6hv9cg	FAIRWAYS	KG2	1	2025	0	2026-02-02 13:09:42.772	2026-02-02 13:09:42.772
cml56sm5w001ghkeb9h75z7af	FAIRWAYS	KG3	1	2025	0	2026-02-02 13:09:42.837	2026-02-02 13:09:42.837
cml56sm7i001hhkebu557wkce	FAIRWAYS	P.1	1	2025	0	2026-02-02 13:09:42.894	2026-02-02 13:09:42.894
cml56sm8g001ihkebap44ka48	FAIRWAYS	P.2	1	2025	0	2026-02-02 13:09:42.929	2026-02-02 13:09:42.929
cml56sma5001jhkeb8la0ku3w	FAIRWAYS	P.3	1	2025	0	2026-02-02 13:09:42.99	2026-02-02 13:09:42.99
cml56smbe001khkeb3frxbeq9	FAIRWAYS	P.4	1	2025	0	2026-02-02 13:09:43.035	2026-02-02 13:09:43.035
cml56smcq001lhkeboci7xrcz	FAIRWAYS	P.5	1	2025	0	2026-02-02 13:09:43.082	2026-02-02 13:09:43.082
cml56sme0001mhkeb5jkoxsd4	FAIRWAYS	P.6	1	2025	0	2026-02-02 13:09:43.128	2026-02-02 13:09:43.128
cml56smg2001nhkebn94vukr8	FAIRWAYS	P.7	1	2025	0	2026-02-02 13:09:43.202	2026-02-02 13:09:43.202
cml56t19j001ohkebbhd36u5s	KPS	KG1	1	2025	11	2026-02-02 13:10:02.407	2026-02-02 13:10:02.407
cml56t1aw001phkebvyhi4oxi	KPS	KG2	1	2025	0	2026-02-02 13:10:02.456	2026-02-02 13:10:02.456
cml56t1ce001qhkebcj29g6uj	KPS	KG3	1	2025	0	2026-02-02 13:10:02.511	2026-02-02 13:10:02.511
cml56t1dt001rhkebcxqnujrp	KPS	P.1	1	2025	0	2026-02-02 13:10:02.561	2026-02-02 13:10:02.561
cml56t1f6001shkebpvitrjwb	KPS	P.2	1	2025	0	2026-02-02 13:10:02.61	2026-02-02 13:10:02.61
cml56t1gh001thkebe6qe4w1m	KPS	P.3	1	2025	0	2026-02-02 13:10:02.657	2026-02-02 13:10:02.657
cml56t1i3001uhkeb8jvzq3lm	KPS	P.4	1	2025	0	2026-02-02 13:10:02.716	2026-02-02 13:10:02.716
cml56t1j3001vhkeb8ovk9ejn	KPS	P.5	1	2025	0	2026-02-02 13:10:02.751	2026-02-02 13:10:02.751
cml56t1kf001whkebiqtxgpib	KPS	P.6	1	2025	0	2026-02-02 13:10:02.799	2026-02-02 13:10:02.799
cml56t1lx001xhkebtuofbmpo	KPS	P.7	1	2025	0	2026-02-02 13:10:02.853	2026-02-02 13:10:02.853
cml56teme001yhkebr814gvjd	WINSTON	KG1	1	2025	31	2026-02-02 13:10:19.718	2026-02-02 13:10:19.718
cml56tenu001zhkebui9vuwtr	WINSTON	KG2	1	2025	0	2026-02-02 13:10:19.77	2026-02-02 13:10:19.77
cml56tep10020hkebflg2dtl5	WINSTON	KG3	1	2025	0	2026-02-02 13:10:19.813	2026-02-02 13:10:19.813
cml56tequ0021hkeb4p9elrxx	WINSTON	P.1	1	2025	0	2026-02-02 13:10:19.878	2026-02-02 13:10:19.878
cml56tes30022hkebcwxtbc9d	WINSTON	P.2	1	2025	0	2026-02-02 13:10:19.923	2026-02-02 13:10:19.923
cml56tetg0023hkebkymf3zp1	WINSTON	P.3	1	2025	0	2026-02-02 13:10:19.972	2026-02-02 13:10:19.972
cml56teuq0024hkebw2s98fzo	WINSTON	P.4	1	2025	0	2026-02-02 13:10:20.018	2026-02-02 13:10:20.018
cml56tevr0025hkebcfgakw3g	WINSTON	P.5	1	2025	0	2026-02-02 13:10:20.056	2026-02-02 13:10:20.056
cml56tex40026hkebldshic2i	WINSTON	P.6	1	2025	0	2026-02-02 13:10:20.104	2026-02-02 13:10:20.104
cml56tey40027hkeb55qerb1j	WINSTON	P.7	1	2025	0	2026-02-02 13:10:20.14	2026-02-02 13:10:20.14
cml56tu4n0028hkeb0bfg57qe	KPM	KG1	1	2025	14	2026-02-02 13:10:39.815	2026-02-02 13:10:39.815
cml56tu5p0029hkebxtc2oz8r	KPM	KG2	1	2025	0	2026-02-02 13:10:39.853	2026-02-02 13:10:39.853
cml56tu7g002ahkebr0vs7jsh	KPM	KG3	1	2025	0	2026-02-02 13:10:39.916	2026-02-02 13:10:39.916
cml56tu96002bhkebzl7ahvef	KPM	P.1	1	2025	0	2026-02-02 13:10:39.978	2026-02-02 13:10:39.978
cml56tuam002chkebzu8fq9hf	KPM	P.2	1	2025	0	2026-02-02 13:10:40.03	2026-02-02 13:10:40.03
cml56tubm002dhkebcw1xv3jx	KPM	P.3	1	2025	0	2026-02-02 13:10:40.066	2026-02-02 13:10:40.066
cml56tudb002ehkebz96c01hd	KPM	P.4	1	2025	0	2026-02-02 13:10:40.127	2026-02-02 13:10:40.127
cml56tueq002fhkeb4s4yo1tu	KPM	P.5	1	2025	0	2026-02-02 13:10:40.179	2026-02-02 13:10:40.179
cml56tufq002ghkebndivxrx3	KPM	P.6	1	2025	0	2026-02-02 13:10:40.214	2026-02-02 13:10:40.214
cml56tugm002hhkebw2wc3ljn	KPM	P.7	1	2025	0	2026-02-02 13:10:40.246	2026-02-02 13:10:40.246
cml56uazw002ihkebrmovqqsl	KIRA	KG1	1	2025	75	2026-02-02 13:11:01.675	2026-02-02 13:11:01.675
cml56ub1a002jhkebmf9u4nfa	KIRA	KG2	1	2025	0	2026-02-02 13:11:01.727	2026-02-02 13:11:01.727
cml56ub2u002khkeb2ru9u1iq	KIRA	KG3	1	2025	0	2026-02-02 13:11:01.782	2026-02-02 13:11:01.782
cml56ub47002lhkebkp6d3z6q	KIRA	P.1	1	2025	0	2026-02-02 13:11:01.832	2026-02-02 13:11:01.832
cml56ub67002mhkebsy1zd8w7	KIRA	P.2	1	2025	0	2026-02-02 13:11:01.903	2026-02-02 13:11:01.903
cml56ub7h002nhkebm36xju8v	KIRA	P.3	1	2025	0	2026-02-02 13:11:01.949	2026-02-02 13:11:01.949
cml56ub8i002ohkeb7enocffq	KIRA	P.4	1	2025	0	2026-02-02 13:11:01.986	2026-02-02 13:11:01.986
cml56uba4002phkebw41l8li4	KIRA	P.5	1	2025	0	2026-02-02 13:11:02.045	2026-02-02 13:11:02.045
cml56ubb7002qhkebj2x4ueey	KIRA	P.6	1	2025	0	2026-02-02 13:11:02.083	2026-02-02 13:11:02.083
cml56ubce002rhkeb7cz3aacm	KIRA	P.7	1	2025	0	2026-02-02 13:11:02.126	2026-02-02 13:11:02.126
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
-- Data for Name: GMProject; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."GMProject" (id, "projectName", progress, "projectManager", "createdAt", "updatedAt", status) FROM stdin;
cml0mbpwl001911p5cchi1ond	New Library Construction	75	Eng. Mukasa	2026-01-30 08:25:37.51	2026-01-30 08:25:37.51	ACTIVE
cml0mbpwv001a11p53sk9ckv5	ICT Lab Upgrade	90	Mr. Kibirige	2026-01-30 08:25:37.519	2026-01-30 08:25:37.519	ACTIVE
cml0mbpx1001b11p594e2rehv	Playground Renovation	45	Mr. Wasswa	2026-01-30 08:25:37.525	2026-01-30 08:25:37.525	ACTIVE
cml0mbpx6001c11p5faaafron	Dormitory Expansion	30	Arch. Nambi	2026-01-30 08:25:37.531	2026-01-30 08:25:37.531	ACTIVE
cml4uuxf8001koma1q16tc2ew	New Library Construction	75	Eng. Mukasa	2026-02-02 07:35:35.349	2026-02-02 07:35:35.349	ACTIVE
cml4uuxfh001loma14h8d01ii	ICT Lab Upgrade	90	Mr. Kibirige	2026-02-02 07:35:35.357	2026-02-02 07:35:35.357	ACTIVE
cml4uuxfo001moma10l7jtgh8	Playground Renovation	45	Mr. Wasswa	2026-02-02 07:35:35.365	2026-02-02 07:35:35.365	ACTIVE
cml4uuxg0001noma11kgz9psw	Dormitory Expansion	30	Arch. Nambi	2026-02-02 07:35:35.377	2026-02-02 07:35:35.377	ACTIVE
\.


--
-- Data for Name: IncomeSource; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."IncomeSource" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cml0mbppt000i11p5ker9nc28	Uniforms	t	2026-01-30 08:25:37.265	2026-01-30 08:25:37.265
cml0mbpq6000j11p5a4npgh4a	Swimming	t	2026-01-30 08:25:37.279	2026-01-30 08:25:37.279
cml0mbpqi000k11p5513f7sl2	Canteen	t	2026-01-30 08:25:37.29	2026-01-30 08:25:37.29
cml0mbpqu000l11p5isod0j3k	Saving Scheme	t	2026-01-30 08:25:37.302	2026-01-30 08:25:37.302
cml7xsh9n0002hugjzp0t4xsu	tt	f	2026-02-04 11:20:58.475	2026-02-04 11:21:10.561
\.


--
-- Data for Name: KPIData; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."KPIData" (id, month, year, "feesCollectionPercent", "schoolsExpenditurePercent", "infrastructurePercent", "totalEnrollment", "theologyEnrollment", "p7PrepExamsPercent", "createdAt", "updatedAt") FROM stdin;
cml0mbpmb000511p51ugomp1l	1	2026	78	85	45	1250	180	72	2026-01-30 08:25:37.139	2026-01-30 08:25:37.139
cml0mbpmn000611p5mlybcm8x	2	2026	82	88	50	1265	185	75	2026-01-30 08:25:37.151	2026-01-30 08:25:37.151
cml0mbpmv000711p5wsoaquym	3	2026	85	90	55	1280	190	78	2026-01-30 08:25:37.159	2026-01-30 08:25:37.159
cml0mbpn3000811p5m50x5i4j	4	2026	88	87	60	1295	195	80	2026-01-30 08:25:37.167	2026-01-30 08:25:37.167
cml0mbpnb000911p5lhztlqfw	5	2026	90	85	65	1310	200	82	2026-01-30 08:25:37.176	2026-01-30 08:25:37.176
cml0mbpnm000a11p5dyc45x4m	6	2026	92	83	70	1325	205	85	2026-01-30 08:25:37.186	2026-01-30 08:25:37.186
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Message" (id, content, "senderId", "recipientId", "isRead", "readAt", "createdAt", "updatedAt") FROM stdin;
cml7y2x250008hugjq83377is	hlo	cml0mbpgc000011p5by76txxd	cml0mbpkm000111p50jv7ovmv	f	\N	2026-02-04 11:29:05.5	2026-02-04 11:29:05.5
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Notification" (id, type, title, message, data, "userId", "isRead", "readAt", "createdAt", "updatedAt") FROM stdin;
cml0oqfn00001j4upgzdu5xkb	REPORT_PUBLISHED	GM posted Week 25 2025 Report	Weekly report for Week 25, 2025 has been published	{"reportId":"cml0oqfm90000j4up4il3k104","weekNumber":25,"year":2025}	cml0mbpkm000111p50jv7ovmv	t	2026-02-04 08:15:59.979	2026-01-30 09:33:03.277	2026-02-04 08:15:59.981
cml0osqbp0003j4upwljbtxsn	REPORT_PUBLISHED	GM posted Week 38 2025 Report	Weekly report for Week 38, 2025 has been published	{"reportId":"cml0osqaq0002j4upjg26bkpb","weekNumber":38,"year":2025}	cml0mbpkm000111p50jv7ovmv	t	2026-02-04 08:16:05.085	2026-01-30 09:34:50.437	2026-02-04 08:16:05.086
cml7y2x2m000ahugjbqc74cqg	MESSAGE	New message from General Manager	hlo	{"messageId":"cml7y2x250008hugjq83377is","senderId":"cml0mbpgc000011p5by76txxd"}	cml0mbpkm000111p50jv7ovmv	t	2026-02-04 11:32:48.406	2026-02-04 11:29:05.519	2026-02-04 11:32:48.408
cml7y8pbh000ehugj8gt5kepn	REPORT_COMMENT	C Trustee commented	fees is low	{"reactionId":"cml7y8pay000chugjqu7jvtln","sectionId":"schools-expenditure","weeklyReportId":"cml0mbplx000411p5frzqrwtq"}	cml0mbpgc000011p5by76txxd	t	2026-02-04 11:34:11.481	2026-02-04 11:33:35.405	2026-02-04 11:34:11.482
cml7y8rjw000ihugjhdmp3dij	REPORT_COMMENT	C Trustee liked a report section	Thumbs up on section: schools-expenditure	{"reactionId":"cml7y8rjk000ghugjpalt0400","sectionId":"schools-expenditure","weeklyReportId":"cml0mbplx000411p5frzqrwtq"}	cml0mbpgc000011p5by76txxd	t	2026-02-04 11:34:16.558	2026-02-04 11:33:38.301	2026-02-04 11:34:16.56
\.


--
-- Data for Name: OrganizationalGoal; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."OrganizationalGoal" (id, title, description, category, "targetValue", "currentValue", unit, year, term, progress, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OtherIncome; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."OtherIncome" (id, year, "createdAt", "updatedAt", source, percentage, month) FROM stdin;
cml4uuxbj0015oma1dpokl8na	2025	2026-02-02 07:35:35.215	2026-02-03 08:44:07.995	Uniforms	58	1
cml0mbpsw000u11p5lwb69s7s	2025	2026-01-30 08:25:37.377	2026-02-03 08:44:18.76	Uniforms	60	1
cml0mbpt2000v11p5rsxfzj70	2025	2026-01-30 08:25:37.383	2026-02-03 08:44:39.151	Swimming	64	1
cml4uuxbu0016oma152g1e2gl	2025	2026-02-02 07:35:35.227	2026-02-03 08:44:48.105	Swimming	77	1
cml4uuxc50017oma12vfig6xc	2025	2026-02-02 07:35:35.237	2026-02-03 08:45:14.938	Canteen	75	1
cml0mbpt8000w11p5j6jcn12n	2025	2026-01-30 08:25:37.389	2026-02-03 08:45:25.614	Canteen	76	1
cml4uuxcb0018oma1xnlum9cm	2025	2026-02-02 07:35:35.243	2026-02-03 08:46:55.53	Saving Scheme	48	1
cml0mbpte000x11p5rwddkyjo	2025	2026-01-30 08:25:37.394	2026-02-03 08:47:07.035	Saving Scheme	78	1
cml4uuxaq0012oma1v3q1qgog	2024	2026-02-02 07:35:35.187	2026-02-03 09:13:52.72	Swimming	35	1
cml0mbprt000q11p5k7e2fo8p	2024	2026-01-30 08:25:37.337	2026-02-03 09:13:57.195	Uniforms	52	1
cml0mbps4000r11p5jgciohl6	2024	2026-01-30 08:25:37.348	2026-02-03 09:14:05.294	Swimming	86	1
cml0mbpse000s11p59y3eb2q1	2024	2026-01-30 08:25:37.359	2026-02-03 09:14:09.306	Canteen	68	1
cml0mbpso000t11p5xs4rdtzy	2024	2026-01-30 08:25:37.369	2026-02-03 09:14:12.906	Saving Scheme	42	1
cml4uuxak0011oma1s5ozs596	2024	2026-02-02 07:35:35.181	2026-02-03 09:14:19.669	Uniforms	77	1
cml4uuxaw0013oma1xhln8osj	2024	2026-02-02 07:35:35.193	2026-02-03 09:14:24.333	Canteen	68	1
cml4uuxb70014oma1oz4srbv9	2024	2026-02-02 07:35:35.204	2026-02-03 09:14:27.862	Saving Scheme	42	1
cml0mbpr4000m11p56k5a7erj	2023	2026-01-30 08:25:37.312	2026-02-03 09:14:39.022	Uniforms	45	1
cml4uux9m000xoma1gtxsj44p	2023	2026-02-02 07:35:35.147	2026-02-03 09:14:49.557	Uniforms	92	1
cml0mbprl000p11p5qld234in	2023	2026-01-30 08:25:37.329	2026-02-03 09:14:55.969	Saving Scheme	76	1
cml4uuxae0010oma1bhimy9jq	2023	2026-02-02 07:35:35.174	2026-02-03 09:15:01.155	Saving Scheme	83	1
cml4uuxa8000zoma1gi5cfb7s	2023	2026-02-02 07:35:35.168	2026-02-03 09:15:05.999	Canteen	62	1
cml0mbprf000o11p5qt8trluz	2023	2026-01-30 08:25:37.324	2026-02-03 09:15:14.025	Canteen	91	1
cml0mbpra000n11p5ti2lp549	2023	2026-01-30 08:25:37.318	2026-02-03 09:15:21.905	Swimming	77	1
cml4uux9y000yoma1wc0795eh	2023	2026-02-02 07:35:35.159	2026-02-03 09:15:37.272	Swimming	74	1
cml6dw5ig0000111wisj77r7u	2026	2026-02-03 09:16:11.366	2026-02-03 09:16:11.366	Canteen	88	1
cml0mbptl000y11p5ixc2dd4p	2026	2026-01-30 08:25:37.402	2026-02-03 09:16:11.367	Uniforms	70	1
cml6dw5ka0001111w1a6lb9h7	2026	2026-02-03 09:16:11.367	2026-02-03 09:16:11.367	Saving Scheme	67	1
cml4uuxcn001aoma1tgf8vrz8	2026	2026-02-02 07:35:35.256	2026-02-03 09:16:11.37	Swimming	83	1
\.


--
-- Data for Name: P7PrepPerformance; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."P7PrepPerformance" (id, year, prep1, prep2, prep3, prep4, prep5, prep6, prep7, prep8, prep9, "createdAt", "updatedAt", "p6Promotion", ple) FROM stdin;
cml0mbpuo001211p5vez00puq	2024	65	68	70	72	74	76	78	80	82	2026-01-30 08:25:37.44	2026-01-30 08:25:37.44	0	0
cml0mbpuz001311p53r3ax1d3	2025	68	70	72	75	77	79	81	83	85	2026-01-30 08:25:37.452	2026-01-30 08:25:37.452	0	0
cml0mbpv7001411p5r39i2u5h	2026	70	72	75	78	80	82	84	86	88	2026-01-30 08:25:37.46	2026-01-30 08:25:37.46	0	0
\.


--
-- Data for Name: P7PrepResult; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."P7PrepResult" (id, school, "prepNumber", term, year, enrollment, "divisionI", "divisionII", "divisionIII", "divisionIV", "averageScore", "createdAt", "updatedAt") FROM stdin;
cml71a3zs0000jfsbuz1h72oi	Winston	1	1	2026	106	56	47	1	1	87.6	2026-02-03 20:10:53.751	2026-02-03 20:10:53.751
cml71a41k0001jfsbk0680g4n	KISASI	1	1	2026	125	58	55	9	2	84.1	2026-02-03 20:10:53.816	2026-02-03 20:10:53.816
cml71a42k0002jfsbpmoyvlij	Mengo	1	1	2026	160	89	64	2	4	87.4	2026-02-03 20:10:53.853	2026-02-03 20:10:53.853
cml71a43h0003jfsbsh4uvce4	KPS	1	1	2026	84	49	30	3	1	88.3	2026-02-03 20:10:53.885	2026-02-03 20:10:53.885
cml71a44h0004jfsbf5x15u6m	Nakasero	1	1	2026	83	45	28	5	1	87	2026-02-03 20:10:53.921	2026-02-03 20:10:53.921
cml71a45e0005jfsbdyyardqx	Fairways	1	1	2026	55	31	19	2	2	86.6	2026-02-03 20:10:53.954	2026-02-03 20:10:53.954
cml71a46f0006jfsbx8mkjqvo	Old K'LA	1	1	2026	147	68	65	10	1	84.7	2026-02-03 20:10:53.992	2026-02-03 20:10:53.992
cml71a47g0007jfsbkl1q9zad	KPM	1	1	2026	87	36	33	8	4	81.2	2026-02-03 20:10:54.028	2026-02-03 20:10:54.028
cml71a49k0009jfsb2dh3bspq	Kira	1	1	2026	37	8	27	1	0	79.9	2026-02-03 20:10:54.104	2026-02-03 20:10:54.104
cml71a4b3000ajfsbg25n4r8p	Kitintale	1	1	2026	80	15	48	7	3	75.7	2026-02-03 20:10:54.159	2026-02-03 20:10:54.159
cml71a4cj000bjfsbfirhcz8d	Winston	2	1	2026	106	63	37	0	1	90.1	2026-02-03 20:10:54.212	2026-02-03 20:10:54.212
cml71a4e5000cjfsbjezeetks	KISASI	2	1	2026	125	72	45	6	0	88.4	2026-02-03 20:10:54.269	2026-02-03 20:10:54.269
cml71a4fr000djfsbzmwn9gdt	Mengo	2	1	2026	160	100	52	4	1	90	2026-02-03 20:10:54.328	2026-02-03 20:10:54.328
cml71a4h4000ejfsbmajvuviy	KPS	2	1	2026	84	50	30	1	1	89.3	2026-02-03 20:10:54.376	2026-02-03 20:10:54.376
cml71a4ip000fjfsbqfaib0ba	Nakasero	2	1	2026	83	50	25	4	2	88	2026-02-03 20:10:54.434	2026-02-03 20:10:54.434
cml71a4jo000gjfsbbgzentnp	Fairways	2	1	2026	55	36	15	4	0	89.5	2026-02-03 20:10:54.468	2026-02-03 20:10:54.468
cml71a4l5000hjfsb12vbf0k2	Old K'LA	2	1	2026	147	87	50	6	3	87.8	2026-02-03 20:10:54.521	2026-02-03 20:10:54.521
cml71a4md000ijfsbbhb6wlaq	KPM	2	1	2026	87	40	36	3	2	85.2	2026-02-03 20:10:54.565	2026-02-03 20:10:54.565
cml71a4no000jjfsblu996j4g	CPS	2	1	2026	211	83	91	12	9	81.8	2026-02-03 20:10:54.612	2026-02-03 20:10:54.612
cml71a4oy000kjfsbrwkp4vtf	Kira	2	1	2026	38	11	23	2	1	79.7	2026-02-03 20:10:54.658	2026-02-03 20:10:54.658
cml71a4qa000ljfsbslrx7z2e	Kitintale	2	1	2026	81	27	37	4	2	81.8	2026-02-03 20:10:54.706	2026-02-03 20:10:54.706
cml71a4rc000mjfsbv8sqnv1b	Winston	3	1	2026	106	68	36	0	1	90.7	2026-02-03 20:10:54.745	2026-02-03 20:10:54.745
cml71a4su000njfsbfv8u4p31	KISASI	3	1	2026	125	74	43	6	0	88.8	2026-02-03 20:10:54.798	2026-02-03 20:10:54.798
cml71a4u1000ojfsbes7and7a	Mengo	3	1	2026	160	94	60	0	4	88.6	2026-02-03 20:10:54.841	2026-02-03 20:10:54.841
cml71a4uu000pjfsb5x8xox49	KPS	3	1	2026	83	48	31	2	0	89.2	2026-02-03 20:10:54.871	2026-02-03 20:10:54.871
cml71a4wa000qjfsb68wl14y4	Nakasero	3	1	2026	83	49	26	3	3	87.3	2026-02-03 20:10:54.922	2026-02-03 20:10:54.922
cml71a4xd000rjfsbwjq3v2th	Fairways	3	1	2026	55	32	17	4	2	85.9	2026-02-03 20:10:54.961	2026-02-03 20:10:54.961
cml71a4yl000sjfsbg5anycic	Old K'LA	3	1	2026	147	78	59	6	3	86.3	2026-02-03 20:10:55.005	2026-02-03 20:10:55.005
cml71a506000tjfsb6occ3xa2	KPM	3	1	2026	87	44	31	5	1	86.4	2026-02-03 20:10:55.062	2026-02-03 20:10:55.062
cml71a51s000ujfsbdaoysb0a	CPS	3	1	2026	210	89	80	16	17	79.8	2026-02-03 20:10:55.121	2026-02-03 20:10:55.121
cml71a539000vjfsbt3y3r5t1	Kira	3	1	2026	38	14	19	3	1	81.1	2026-02-03 20:10:55.173	2026-02-03 20:10:55.173
cml71a54n000wjfsbgcan3lhl	Kitintale	3	1	2026	81	28	38	6	2	81.1	2026-02-03 20:10:55.223	2026-02-03 20:10:55.223
cml71a55i000xjfsbnls2gkgg	KPM	4	1	2026	85	61	17	3	1	92.1	2026-02-03 20:10:55.254	2026-02-03 20:10:55.254
cml71a56w000yjfsbr1wi49gx	Fairways	4	1	2026	55	34	16	1	1	89.9	2026-02-03 20:10:55.304	2026-02-03 20:10:55.304
cml71a58c000zjfsb3cs9o086	Winston	4	1	2026	105	88	14	1	2	94.8	2026-02-03 20:10:55.356	2026-02-03 20:10:55.356
cml71a59l0010jfsbbl4oqtfi	KISASI	4	1	2026	123	88	31	2	1	92.2	2026-02-03 20:10:55.4	2026-02-03 20:10:55.4
cml71a5av0011jfsbgwtgu89w	Mengo	4	1	2026	157	108	43	0	1	92.4	2026-02-03 20:10:55.447	2026-02-03 20:10:55.447
cml71a5ca0012jfsbahrqo3bk	Nakasero	4	1	2026	82	55	20	4	0	91.1	2026-02-03 20:10:55.498	2026-02-03 20:10:55.498
cml71a5di0013jfsbel3gnxxd	KPS	4	1	2026	82	58	23	0	0	92.9	2026-02-03 20:10:55.542	2026-02-03 20:10:55.542
cml71a5ef0014jfsb3w1e61ya	Old K'LA	4	1	2026	146	93	44	2	1	90.9	2026-02-03 20:10:55.575	2026-02-03 20:10:55.575
cml71a5fk0015jfsbc3n8w0go	Kira	4	1	2026	38	20	16	0	1	87.2	2026-02-03 20:10:55.616	2026-02-03 20:10:55.616
cml71a5hi0016jfsb2541l5vd	Kitintale	4	1	2026	79	36	30	3	1	86.1	2026-02-03 20:10:55.687	2026-02-03 20:10:55.687
cml71a5iw0017jfsbzpkkyxbw	CPS	4	1	2026	214	119	68	16	2	87.1	2026-02-03 20:10:55.735	2026-02-03 20:10:55.735
cml71a5kk0018jfsbweuepvth	KPM	5	1	2026	85	66	13	2	1	93.9	2026-02-03 20:10:55.796	2026-02-03 20:10:55.796
cml71a5ma0019jfsbavey4xp8	Fairways	5	1	2026	56	42	12	2	0	92.9	2026-02-03 20:10:55.858	2026-02-03 20:10:55.858
cml71a5nf001ajfsb4onuj1oh	Winston	5	1	2026	105	82	17	3	1	93.7	2026-02-03 20:10:55.899	2026-02-03 20:10:55.899
cml71a5p1001bjfsblewymqjo	KISASI	5	1	2026	123	93	28	0	2	93.1	2026-02-03 20:10:55.957	2026-02-03 20:10:55.957
cml71a5qg001cjfsb9pqx0lhs	Mengo	5	1	2026	157	117	34	4	0	93.2	2026-02-03 20:10:56.008	2026-02-03 20:10:56.008
cml71a5ry001djfsb9r8ohg5y	Nakasero	5	1	2026	82	58	19	3	0	92.2	2026-02-03 20:10:56.062	2026-02-03 20:10:56.062
cml71a5t0001ejfsb2x68d7js	KPS	5	1	2026	81	62	19	0	0	94.1	2026-02-03 20:10:56.101	2026-02-03 20:10:56.101
cml71a5v0001fjfsby6zf2wv0	Old K'LA	5	1	2026	146	101	38	1	0	92.9	2026-02-03 20:10:56.172	2026-02-03 20:10:56.172
cml71a5wu001gjfsbuya0dk9v	Kira	5	1	2026	38	23	12	3	0	88.2	2026-02-03 20:10:56.238	2026-02-03 20:10:56.238
cml71a5y6001hjfsbxpnj5xcu	Kitintale	5	1	2026	79	31	32	6	2	82.4	2026-02-03 20:10:56.286	2026-02-03 20:10:56.286
cml71a5zy001ijfsbseo7c46f	CPS	5	1	2026	214	117	82	6	3	87.6	2026-02-03 20:10:56.351	2026-02-03 20:10:56.351
cml71a616001jjfsbz32d8w9s	KPM	6	1	2026	85	68	12	1	1	94.8	2026-02-03 20:10:56.394	2026-02-03 20:10:56.394
cml71a62v001kjfsb1q7ka2b9	Fairways	6	1	2026	56	42	12	2	0	92.9	2026-02-03 20:10:56.455	2026-02-03 20:10:56.455
cml71a64z001ljfsb5veavcck	Winston	6	1	2026	105	75	24	4	0	92.2	2026-02-03 20:10:56.531	2026-02-03 20:10:56.531
cml71a66g001mjfsbgafl4yw7	KISASI	6	1	2026	123	91	24	7	0	92.2	2026-02-03 20:10:56.584	2026-02-03 20:10:56.584
cml71a67q001njfsbp7igr0bp	Mengo	6	1	2026	157	105	43	7	2	90	2026-02-03 20:10:56.63	2026-02-03 20:10:56.63
cml71a69i001ojfsbq89t3as1	Nakasero	6	1	2026	82	53	20	6	1	89.1	2026-02-03 20:10:56.694	2026-02-03 20:10:56.694
cml71a6bl001pjfsb7qdmibaz	KPS	6	1	2026	81	53	24	4	0	90.1	2026-02-03 20:10:56.769	2026-02-03 20:10:56.769
cml71a6d4001qjfsb8yx98bgm	Old K'LA	6	1	2026	146	90	44	10	1	88.4	2026-02-03 20:10:56.824	2026-02-03 20:10:56.824
cml71a6eo001rjfsb7sdmi78v	Kira	6	1	2026	38	22	11	4	0	87.2	2026-02-03 20:10:56.88	2026-02-03 20:10:56.88
cml71a6ft001sjfsb9svfmkwx	Kitintale	6	1	2026	78	44	21	11	2	84.3	2026-02-03 20:10:56.921	2026-02-03 20:10:56.921
cml71a6hl001tjfsbga7ey4p6	CPS	6	1	2026	214	112	77	12	7	85.3	2026-02-03 20:10:56.985	2026-02-03 20:10:56.985
cml71a6is001ujfsbl7vud7nb	KPS	7	1	2026	81	32	30	17	1	79.1	2026-02-03 20:10:57.029	2026-02-03 20:10:57.029
cml71a6ki001vjfsbbh2za03b	Winston	7	1	2026	104	46	37	18	3	80.3	2026-02-03 20:10:57.091	2026-02-03 20:10:57.091
cml71a6lm001wjfsb74x6u4om	KISASI	7	1	2026	123	47	45	29	0	78.7	2026-02-03 20:10:57.131	2026-02-03 20:10:57.131
cml71a6n9001xjfsbctexuj0b	Fairways	7	1	2026	56	19	21	15	1	75.9	2026-02-03 20:10:57.189	2026-02-03 20:10:57.189
cml71a6qt001yjfsb0zfnn5wt	KPM	7	1	2026	85	32	32	15	1	79.7	2026-02-03 20:10:57.317	2026-02-03 20:10:57.317
cml71a6ty001zjfsbnqequ6ey	Mengo	7	1	2026	157	56	45	40	2	77.1	2026-02-03 20:10:57.43	2026-02-03 20:10:57.43
cml71a6yn0020jfsbrygflysg	Nakasero	7	1	2026	82	33	24	18	1	79.3	2026-02-03 20:10:57.599	2026-02-03 20:10:57.599
cml71a71d0021jfsbu3f9xbab	Old K'LA	7	1	2026	146	42	65	30	6	75	2026-02-03 20:10:57.696	2026-02-03 20:10:57.696
cml71a72r0022jfsbr2mt3nsd	Kira	7	1	2026	38	9	17	12	0	73	2026-02-03 20:10:57.746	2026-02-03 20:10:57.746
cml71a7480023jfsbthg90vv9	CPS	7	1	2026	216	84	58	54	13	75.5	2026-02-03 20:10:57.8	2026-02-03 20:10:57.8
cml71a7640024jfsb479aqddm	Kitintale	7	1	2026	78	18	19	31	3	68.3	2026-02-03 20:10:57.868	2026-02-03 20:10:57.868
cml71a77j0025jfsb4t8nqn18	KPS	8	1	2026	81	66	13	2	0	94.8	2026-02-03 20:10:57.919	2026-02-03 20:10:57.919
cml71a79c0026jfsbboqtk4dz	Winston	8	1	2026	104	78	20	6	0	92.3	2026-02-03 20:10:57.985	2026-02-03 20:10:57.985
cml71a7b30027jfsb2jrfki8v	KISASI	8	1	2026	123	92	24	5	1	92.4	2026-02-03 20:10:58.047	2026-02-03 20:10:58.047
cml71a7cn0028jfsbv8cs09ut	Fairways	8	1	2026	56	35	15	2	1	89.6	2026-02-03 20:10:58.103	2026-02-03 20:10:58.103
cml71a7e30029jfsbfloki3sv	KPM	8	1	2026	85	59	14	2	3	91.3	2026-02-03 20:10:58.155	2026-02-03 20:10:58.155
cml71a7fi002ajfsbw6yzz2jy	Mengo	8	1	2026	157	111	35	4	1	92.4	2026-02-03 20:10:58.206	2026-02-03 20:10:58.206
cml71a7gt002bjfsb6v3aghuy	Nakasero	8	1	2026	82	58	17	4	2	90.4	2026-02-03 20:10:58.254	2026-02-03 20:10:58.254
cml71a7i7002cjfsb3v0vk14f	Old K'LA	8	1	2026	146	98	36	6	1	91	2026-02-03 20:10:58.303	2026-02-03 20:10:58.303
cml71a7ju002djfsbyztqp0c5	Kira	8	1	2026	38	23	12	2	0	89.2	2026-02-03 20:10:58.363	2026-02-03 20:10:58.363
cml71a7lh002ejfsbelly61ma	CPS	8	1	2026	216	114	76	7	2	87.9	2026-02-03 20:10:58.421	2026-02-03 20:10:58.421
cml71a7n6002fjfsbhncea6i7	Kitintale	8	1	2026	78	32	26	9	3	81.1	2026-02-03 20:10:58.482	2026-02-03 20:10:58.482
cml71a7or002gjfsbdm7l5zl7	KPS	9	1	2026	81	79	1	0	0	99.7	2026-02-03 20:10:58.539	2026-02-03 20:10:58.539
cml71a7r9002ijfsbeyhajrek	KISASI	9	1	2026	123	111	11	1	0	97.4	2026-02-03 20:10:58.629	2026-02-03 20:10:58.629
cml71a7t4002jjfsb04vw1j0h	Fairways	9	1	2026	56	49	6	0	0	97.3	2026-02-03 20:10:58.696	2026-02-03 20:10:58.696
cml71a7um002kjfsb3wob5kge	KPM	9	1	2026	85	70	10	2	2	94	2026-02-03 20:10:58.751	2026-02-03 20:10:58.751
cml71a7w3002ljfsbtm1h4txu	Mengo	9	1	2026	157	125	27	4	0	94.4	2026-02-03 20:10:58.804	2026-02-03 20:10:58.804
cml71a7x7002mjfsbfcfs9m1c	Nakasero	9	1	2026	82	65	14	2	0	94.4	2026-02-03 20:10:58.843	2026-02-03 20:10:58.843
cml71a7y4002njfsb6mj7vw5b	Old K'LA	9	1	2026	146	118	24	0	0	95.8	2026-02-03 20:10:58.876	2026-02-03 20:10:58.876
cml71a7z9002ojfsbboeecnxi	Kira	9	1	2026	38	31	7	0	0	95.4	2026-02-03 20:10:58.917	2026-02-03 20:10:58.917
cml71a80f002pjfsbdzpq6my0	CPS	9	1	2026	216	140	66	1	0	91.8	2026-02-03 20:10:58.959	2026-02-03 20:10:58.959
cml71a81p002qjfsbf8iaz7uz	Kitintale	9	1	2026	78	51	22	4	0	90.3	2026-02-03 20:10:59.005	2026-02-03 20:10:59.005
cml71hwgo002rjfsb38t0hca3	Winston	1	1	2025	106	56	47	1	1	87.6	2026-02-03 20:16:57.239	2026-02-03 20:16:57.239
cml71hwio002sjfsbh1z32880	KISASI	1	1	2025	125	58	55	9	2	84.1	2026-02-03 20:16:57.312	2026-02-03 20:16:57.312
cml71hwkb002tjfsbs4mmhoo1	Mengo	1	1	2025	160	89	64	2	4	87.4	2026-02-03 20:16:57.371	2026-02-03 20:16:57.371
cml71hwlg002ujfsb7m7i4sz2	KPS	1	1	2025	84	49	30	3	1	88.3	2026-02-03 20:16:57.412	2026-02-03 20:16:57.412
cml71hwmu002vjfsbdugnluk8	Nakasero	1	1	2025	83	45	28	5	1	87	2026-02-03 20:16:57.462	2026-02-03 20:16:57.462
cml71hwo8002wjfsbsfkp9xdm	Fairways	1	1	2025	55	31	19	2	2	86.6	2026-02-03 20:16:57.512	2026-02-03 20:16:57.512
cml71hwpk002xjfsbvcgsh35m	Old K'LA	1	1	2025	147	68	65	10	1	84.7	2026-02-03 20:16:57.561	2026-02-03 20:16:57.561
cml71hwqs002yjfsbwdkar9o3	KPM	1	1	2025	87	36	33	8	4	81.2	2026-02-03 20:16:57.603	2026-02-03 20:16:57.603
cml71hwt3002zjfsbrgworhsb	CPS	1	1	2025	211	80	87	15	15	79.4	2026-02-03 20:16:57.687	2026-02-03 20:16:57.687
cml71hwv10030jfsb91uvx9en	Kira	1	1	2025	37	8	27	1	0	79.9	2026-02-03 20:16:57.758	2026-02-03 20:16:57.758
cml71hwxa0031jfsbqf038i8i	Kitintale	1	1	2025	80	15	48	7	3	75.7	2026-02-03 20:16:57.838	2026-02-03 20:16:57.838
cml71hwz60032jfsbrsout01v	Winston	2	1	2025	106	63	37	0	1	90.1	2026-02-03 20:16:57.906	2026-02-03 20:16:57.906
cml71hx0e0033jfsbbo9hkpdx	KISASI	2	1	2025	125	72	45	6	0	88.4	2026-02-03 20:16:57.95	2026-02-03 20:16:57.95
cml71hx250034jfsb8cq6kfw6	Mengo	2	1	2025	160	100	52	4	1	90	2026-02-03 20:16:58.012	2026-02-03 20:16:58.012
cml71hx3s0035jfsbepjr6idw	KPS	2	1	2025	84	50	30	1	1	89.3	2026-02-03 20:16:58.072	2026-02-03 20:16:58.072
cml71hx540036jfsbwkagdplw	Nakasero	2	1	2025	83	50	25	4	2	88	2026-02-03 20:16:58.119	2026-02-03 20:16:58.119
cml71hx680037jfsbnay3ktxn	Fairways	2	1	2025	55	36	15	4	0	89.5	2026-02-03 20:16:58.16	2026-02-03 20:16:58.16
cml71hx8e0038jfsbpdwcfygb	Old K'LA	2	1	2025	147	87	50	6	3	87.8	2026-02-03 20:16:58.238	2026-02-03 20:16:58.238
cml71hxaa0039jfsblbnjf7x1	KPM	2	1	2025	87	40	36	3	2	85.2	2026-02-03 20:16:58.306	2026-02-03 20:16:58.306
cml71hxbw003ajfsblysgrtl7	CPS	2	1	2025	211	83	91	12	9	81.8	2026-02-03 20:16:58.364	2026-02-03 20:16:58.364
cml71hxe1003bjfsb3bznxmp6	Kira	2	1	2025	38	11	23	2	1	79.7	2026-02-03 20:16:58.441	2026-02-03 20:16:58.441
cml71hxft003cjfsbljzqm3ic	Kitintale	2	1	2025	81	27	37	4	2	81.8	2026-02-03 20:16:58.505	2026-02-03 20:16:58.505
cml71hxhh003djfsbp42mlmeu	Winston	3	1	2025	106	68	36	0	1	90.7	2026-02-03 20:16:58.565	2026-02-03 20:16:58.565
cml71hxit003ejfsb8re4o8vd	KISASI	3	1	2025	125	74	43	6	0	88.8	2026-02-03 20:16:58.611	2026-02-03 20:16:58.611
cml71hxkj003fjfsba99wzro5	Mengo	3	1	2025	160	94	60	0	4	88.6	2026-02-03 20:16:58.675	2026-02-03 20:16:58.675
cml71hxlq003gjfsbxcfeaxgw	KPS	3	1	2025	83	48	31	2	0	89.2	2026-02-03 20:16:58.718	2026-02-03 20:16:58.718
cml71hxmw003hjfsb3a6ctzwn	Nakasero	3	1	2025	83	49	26	3	3	87.3	2026-02-03 20:16:58.761	2026-02-03 20:16:58.761
cml71hxo4003ijfsb1kxpqnrv	Fairways	3	1	2025	55	32	17	4	2	85.9	2026-02-03 20:16:58.804	2026-02-03 20:16:58.804
cml71hxpf003jjfsbmvvtgedf	Old K'LA	3	1	2025	147	78	59	6	3	86.3	2026-02-03 20:16:58.851	2026-02-03 20:16:58.851
cml71hxqz003kjfsbhidl2rvb	KPM	3	1	2025	87	44	31	5	1	86.4	2026-02-03 20:16:58.908	2026-02-03 20:16:58.908
cml71hxrz003ljfsbgf7s1syz	CPS	3	1	2025	210	89	80	16	17	79.8	2026-02-03 20:16:58.944	2026-02-03 20:16:58.944
cml71hxtp003mjfsbacmvq43p	Kira	3	1	2025	38	14	19	3	1	81.1	2026-02-03 20:16:59.005	2026-02-03 20:16:59.005
cml71hxuz003njfsb3umbh021	Kitintale	3	1	2025	81	28	38	6	2	81.1	2026-02-03 20:16:59.051	2026-02-03 20:16:59.051
cml71hxwb003ojfsbqthe9iwn	KPM	4	2	2025	85	61	17	3	1	92.1	2026-02-03 20:16:59.099	2026-02-03 20:16:59.099
cml71hxxq003pjfsbhrb2fe85	Fairways	4	2	2025	55	34	16	1	1	89.9	2026-02-03 20:16:59.15	2026-02-03 20:16:59.15
cml71hxz0003qjfsbvx38ewmd	Winston	4	2	2025	105	88	14	1	2	94.8	2026-02-03 20:16:59.196	2026-02-03 20:16:59.196
cml71hy01003rjfsbam4d4ayc	KISASI	4	2	2025	123	88	31	2	1	92.2	2026-02-03 20:16:59.233	2026-02-03 20:16:59.233
cml71hy1h003sjfsbdnaw02w3	Mengo	4	2	2025	157	108	43	0	1	92.4	2026-02-03 20:16:59.285	2026-02-03 20:16:59.285
cml71hy30003tjfsbekztadcz	Nakasero	4	2	2025	82	55	20	4	0	91.1	2026-02-03 20:16:59.341	2026-02-03 20:16:59.341
cml71hy4b003ujfsb6jbd8xhe	KPS	4	2	2025	82	58	23	0	0	92.9	2026-02-03 20:16:59.387	2026-02-03 20:16:59.387
cml71hy5n003vjfsb8uec916p	Old K'LA	4	2	2025	146	93	44	2	1	90.9	2026-02-03 20:16:59.435	2026-02-03 20:16:59.435
cml71hy6v003wjfsbtkq2jzhf	Kira	4	2	2025	38	20	16	0	1	87.2	2026-02-03 20:16:59.48	2026-02-03 20:16:59.48
cml71hy8i003xjfsbkydt32e9	Kitintale	4	2	2025	79	36	30	3	1	86.1	2026-02-03 20:16:59.538	2026-02-03 20:16:59.538
cml71hy9d003yjfsbz0a192jw	CPS	4	2	2025	214	119	68	16	2	87.1	2026-02-03 20:16:59.57	2026-02-03 20:16:59.57
cml71hyar003zjfsb2ak89p38	KPM	5	2	2025	85	66	13	2	1	93.9	2026-02-03 20:16:59.619	2026-02-03 20:16:59.619
cml71hybz0040jfsbxyy7wyb3	Fairways	5	2	2025	56	42	12	2	0	92.9	2026-02-03 20:16:59.661	2026-02-03 20:16:59.661
cml71hydx0041jfsbhn5zt643	Winston	5	2	2025	105	82	17	3	1	93.7	2026-02-03 20:16:59.733	2026-02-03 20:16:59.733
cml71hyft0042jfsbkmkhm9ja	KISASI	5	2	2025	123	93	28	0	2	93.1	2026-02-03 20:16:59.801	2026-02-03 20:16:59.801
cml71hyhf0043jfsb3ruqyi9r	Mengo	5	2	2025	157	117	34	4	0	93.2	2026-02-03 20:16:59.859	2026-02-03 20:16:59.859
cml71hyin0044jfsb441k6158	Nakasero	5	2	2025	82	58	19	3	0	92.2	2026-02-03 20:16:59.903	2026-02-03 20:16:59.903
cml71hyk70045jfsbhy0ahgfh	KPS	5	2	2025	81	62	19	0	0	94.1	2026-02-03 20:16:59.959	2026-02-03 20:16:59.959
cml71hym10046jfsbfj9bc82w	Old K'LA	5	2	2025	146	101	38	1	0	92.9	2026-02-03 20:17:00.026	2026-02-03 20:17:00.026
cml71hynf0047jfsb3p7nvbhw	Kira	5	2	2025	38	23	12	3	0	88.2	2026-02-03 20:17:00.076	2026-02-03 20:17:00.076
cml71hyop0048jfsbxl5yzu47	Kitintale	5	2	2025	79	31	32	6	2	82.4	2026-02-03 20:17:00.122	2026-02-03 20:17:00.122
cml71hyq20049jfsbd1zgsl9p	CPS	5	2	2025	214	117	82	6	3	87.6	2026-02-03 20:17:00.17	2026-02-03 20:17:00.17
cml71hyrm004ajfsbi6htxuio	KPM	6	2	2025	85	68	12	1	1	94.8	2026-02-03 20:17:00.226	2026-02-03 20:17:00.226
cml71hyt0004bjfsbrj3g6ed7	Fairways	6	2	2025	56	42	12	2	0	92.9	2026-02-03 20:17:00.277	2026-02-03 20:17:00.277
cml71hyuf004cjfsb43z2zqop	Winston	6	2	2025	105	75	24	4	0	92.2	2026-02-03 20:17:00.327	2026-02-03 20:17:00.327
cml71hyvl004djfsbapxqz5ub	KISASI	6	2	2025	123	91	24	7	0	92.2	2026-02-03 20:17:00.37	2026-02-03 20:17:00.37
cml71hywq004ejfsbl3wli1s7	Mengo	6	2	2025	157	105	43	7	2	90	2026-02-03 20:17:00.41	2026-02-03 20:17:00.41
cml71hyxt004fjfsbf899505j	Nakasero	6	2	2025	82	53	20	6	1	89.1	2026-02-03 20:17:00.449	2026-02-03 20:17:00.449
cml71hyzd004gjfsbei32vcfw	KPS	6	2	2025	81	53	24	4	0	90.1	2026-02-03 20:17:00.505	2026-02-03 20:17:00.505
cml71hz0h004hjfsbrbkfgotm	Old K'LA	6	2	2025	146	90	44	10	1	88.4	2026-02-03 20:17:00.546	2026-02-03 20:17:00.546
cml71hz1h004ijfsblrm1d56x	Kira	6	2	2025	38	22	11	4	0	87.2	2026-02-03 20:17:00.581	2026-02-03 20:17:00.581
cml71hz2x004jjfsbqp92lotc	Kitintale	6	2	2025	78	44	21	11	2	84.3	2026-02-03 20:17:00.633	2026-02-03 20:17:00.633
cml71hz4l004kjfsb8xk7rqw9	CPS	6	2	2025	214	112	77	12	7	85.3	2026-02-03 20:17:00.693	2026-02-03 20:17:00.693
cml71hz6h004ljfsbvo40aul9	KPS	7	3	2025	81	32	30	17	1	79.1	2026-02-03 20:17:00.761	2026-02-03 20:17:00.761
cml71hz7p004mjfsb0wdhbxf7	Winston	7	3	2025	104	46	37	18	3	80.3	2026-02-03 20:17:00.805	2026-02-03 20:17:00.805
cml71hz8z004njfsbferqxaei	KISASI	7	3	2025	123	47	45	29	0	78.7	2026-02-03 20:17:00.852	2026-02-03 20:17:00.852
cml71hza5004ojfsbeza757zc	Fairways	7	3	2025	56	19	21	15	1	75.9	2026-02-03 20:17:00.893	2026-02-03 20:17:00.893
cml71hzb2004pjfsbikg7vpt9	KPM	7	3	2025	85	32	32	15	1	79.7	2026-02-03 20:17:00.926	2026-02-03 20:17:00.926
cml71hzcg004qjfsbsan4jhj5	Mengo	7	3	2025	157	56	45	40	2	77.1	2026-02-03 20:17:00.976	2026-02-03 20:17:00.976
cml71hze0004rjfsbqmjz3qlm	Nakasero	7	3	2025	82	33	24	18	1	79.3	2026-02-03 20:17:01.033	2026-02-03 20:17:01.033
cml71hzf7004sjfsbi93uhi5z	Old K'LA	7	3	2025	146	42	65	30	6	75	2026-02-03 20:17:01.075	2026-02-03 20:17:01.075
cml71hzgc004tjfsbor0l1rfw	Kira	7	3	2025	38	9	17	12	0	73	2026-02-03 20:17:01.116	2026-02-03 20:17:01.116
cml71hzhb004ujfsbf15bay2p	CPS	7	3	2025	216	84	58	54	13	75.5	2026-02-03 20:17:01.151	2026-02-03 20:17:01.151
cml71hzin004vjfsbyzoonmdk	Kitintale	7	3	2025	78	18	19	31	3	68.3	2026-02-03 20:17:01.199	2026-02-03 20:17:01.199
cml71hzju004wjfsbop1k6po6	KPS	8	3	2025	81	66	13	2	0	94.8	2026-02-03 20:17:01.242	2026-02-03 20:17:01.242
cml71hzlg004xjfsb641kwu23	Winston	8	3	2025	104	78	20	6	0	92.3	2026-02-03 20:17:01.301	2026-02-03 20:17:01.301
cml71hzmx004yjfsbqmp6psj1	KISASI	8	3	2025	123	92	24	5	1	92.4	2026-02-03 20:17:01.353	2026-02-03 20:17:01.353
cml71hznx004zjfsbnksy5r8c	Fairways	8	3	2025	56	35	15	2	1	89.6	2026-02-03 20:17:01.389	2026-02-03 20:17:01.389
cml71hzp90050jfsbrbev1lu5	KPM	8	3	2025	85	59	14	2	3	91.3	2026-02-03 20:17:01.438	2026-02-03 20:17:01.438
cml71hzqf0051jfsbqypku60w	Mengo	8	3	2025	157	111	35	4	1	92.4	2026-02-03 20:17:01.48	2026-02-03 20:17:01.48
cml71hzrs0052jfsb063fosr1	Nakasero	8	3	2025	82	58	17	4	2	90.4	2026-02-03 20:17:01.528	2026-02-03 20:17:01.528
cml71hztb0053jfsbqj7q7y6f	Old K'LA	8	3	2025	146	98	36	6	1	91	2026-02-03 20:17:01.583	2026-02-03 20:17:01.583
cml71hzuq0054jfsbhp1qmo5c	Kira	8	3	2025	38	23	12	2	0	89.2	2026-02-03 20:17:01.634	2026-02-03 20:17:01.634
cml71hzvt0055jfsbba0wyebs	CPS	8	3	2025	216	114	76	7	2	87.9	2026-02-03 20:17:01.674	2026-02-03 20:17:01.674
cml71hzx60056jfsbjg1jasj3	Kitintale	8	3	2025	78	32	26	9	3	81.1	2026-02-03 20:17:01.722	2026-02-03 20:17:01.722
cml71hzy20057jfsbcdhihzmv	KPS	9	3	2025	81	79	1	0	0	99.7	2026-02-03 20:17:01.755	2026-02-03 20:17:01.755
cml71hzzs0058jfsbfarr9hh0	Winston	9	3	2025	104	98	5	1	0	98.3	2026-02-03 20:17:01.816	2026-02-03 20:17:01.816
cml71i01f0059jfsb1yap97hv	KISASI	9	3	2025	123	111	11	1	0	97.4	2026-02-03 20:17:01.875	2026-02-03 20:17:01.875
cml71i02e005ajfsbhw0g6qjv	Fairways	9	3	2025	56	49	6	0	0	97.3	2026-02-03 20:17:01.911	2026-02-03 20:17:01.911
cml71i048005bjfsbezj2ajei	KPM	9	3	2025	85	70	10	2	2	94	2026-02-03 20:17:01.976	2026-02-03 20:17:01.976
cml71i05r005cjfsbzxqazdaj	Mengo	9	3	2025	157	125	27	4	0	94.4	2026-02-03 20:17:02.031	2026-02-03 20:17:02.031
cml71i074005djfsbp4huybsm	Nakasero	9	3	2025	82	65	14	2	0	94.4	2026-02-03 20:17:02.08	2026-02-03 20:17:02.08
cml71i08o005ejfsb6vlho8ob	Old K'LA	9	3	2025	146	118	24	0	0	95.8	2026-02-03 20:17:02.136	2026-02-03 20:17:02.136
cml71i09u005fjfsbeqcikxyk	Kira	9	3	2025	38	31	7	0	0	95.4	2026-02-03 20:17:02.178	2026-02-03 20:17:02.178
cml71i0ay005gjfsb4mj1yth3	CPS	9	3	2025	216	140	66	1	0	91.8	2026-02-03 20:17:02.218	2026-02-03 20:17:02.218
cml71i0by005hjfsbeda73a04	Kitintale	9	3	2025	78	51	22	4	0	90.3	2026-02-03 20:17:02.255	2026-02-03 20:17:02.255
\.


--
-- Data for Name: Reaction; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Reaction" (id, type, comment, "sectionId", "weeklyReportId", "userId", "createdAt") FROM stdin;
cml7y8pay000chugjqu7jvtln	COMMENT	fees is low	schools-expenditure	cml0mbplx000411p5frzqrwtq	cml0mbpkm000111p50jv7ovmv	2026-02-04 11:33:35.385
cml7y8rjk000ghugjpalt0400	THUMBS_DOWN	\N	schools-expenditure	cml0mbplx000411p5frzqrwtq	cml0mbpkm000111p50jv7ovmv	2026-02-04 11:33:38.288
\.


--
-- Data for Name: RedIssue; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."RedIssue" (id, issue, "inCharge", status, "createdAt", "updatedAt", "itemStatus") FROM stdin;
cml0mbq8c002l11p5ndsoilsf	Water supply disruption in Block A	Maintenance Team	IN_PROGRESS	2026-01-30 08:25:37.932	2026-01-30 08:25:37.932	ACTIVE
cml0mbq8m002m11p5fl7ipfr5	Delay in textbook delivery	Procurement Officer	OPEN	2026-01-30 08:25:37.942	2026-01-30 08:25:37.942	ACTIVE
cml0mbq8s002n11p5ry4qe4g6	Staff transport breakdown	Transport Manager	RESOLVED	2026-01-30 08:25:37.949	2026-01-30 08:25:37.949	ACTIVE
cml0mbq8y002o11p5ib2ia5nv	Kitchen equipment malfunction	Catering Manager	IN_PROGRESS	2026-01-30 08:25:37.955	2026-01-30 08:25:37.955	ACTIVE
cml4uuxsz002woma1cyvnzleh	Water supply disruption in Block A	Maintenance Team	IN_PROGRESS	2026-02-02 07:35:35.843	2026-02-02 07:35:35.843	ACTIVE
cml4uuxt7002xoma11040qosv	Delay in textbook delivery	Procurement Officer	OPEN	2026-02-02 07:35:35.852	2026-02-02 07:35:35.852	ACTIVE
cml4uuxtg002yoma1oi98tn13	Staff transport breakdown	Transport Manager	RESOLVED	2026-02-02 07:35:35.861	2026-02-02 07:35:35.861	ACTIVE
cml4uuxts002zoma1h5rfdn8q	Kitchen equipment malfunction	Catering Manager	IN_PROGRESS	2026-02-02 07:35:35.873	2026-02-02 07:35:35.873	ACTIVE
\.


--
-- Data for Name: School; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."School" (id, name, "createdAt", "updatedAt") FROM stdin;
cml4uux1b0002oma1ovsv8n6o	CPS	2026-02-02 07:35:34.847	2026-02-02 07:35:34.847
cml4uux2k0003oma181lug1ma	MENGO	2026-02-02 07:35:34.893	2026-02-02 07:35:34.893
cml4uux2w0004oma1h4px1h0u	NAKASERO	2026-02-02 07:35:34.905	2026-02-02 07:35:34.905
cml4uux3a0005oma19jdsyemc	KISASI	2026-02-02 07:35:34.919	2026-02-02 07:35:34.919
cml4uux460006oma1nqq3911z	OLD K'LA	2026-02-02 07:35:34.951	2026-02-02 07:35:34.951
cml4uux4i0007oma1stuo9vmx	WINSTON	2026-02-02 07:35:34.962	2026-02-02 07:35:34.962
cml4uux4s0008oma1nk874sus	FAIRWAYS	2026-02-02 07:35:34.972	2026-02-02 07:35:34.972
cml4uux500009oma1pvi8n3ht	KPM	2026-02-02 07:35:34.981	2026-02-02 07:35:34.981
cml4uux59000aoma1fah71clt	KPS	2026-02-02 07:35:34.99	2026-02-02 07:35:34.99
cml4uux5i000boma1lpgnuijm	KITINTALE	2026-02-02 07:35:34.998	2026-02-02 07:35:34.998
cml4uux5u000coma11vqxj9do	KIRA	2026-02-02 07:35:35.01	2026-02-02 07:35:35.01
\.


--
-- Data for Name: TermSetting; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."TermSetting" (id, term, year, "startDate", "endDate", "weeksCount", "createdAt", "updatedAt") FROM stdin;
cml7y25zs0003hugjir60d7mx	1	2026	2026-02-01 00:00:00	2026-04-30 00:00:00	13	2026-02-04 11:28:30.415	2026-02-04 11:28:41.706
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
cml53hwpv0000sfgeqkcvpcil	CPS	2025	1	2026-02-02 11:37:24.45	2026-02-02 11:37:24.45	KG1	6
cml53hwrh0001sfgemzgrn9jj	CPS	2025	1	2026-02-02 11:37:24.509	2026-02-02 11:37:24.509	KG2	7
cml53hwt70002sfged56f25w7	CPS	2025	1	2026-02-02 11:37:24.571	2026-02-02 11:37:24.571	KG3	0
cml53hwuf0003sfget5450weu	CPS	2025	1	2026-02-02 11:37:24.615	2026-02-02 11:37:24.615	P.1	0
cml53hwvo0004sfgefxw0pq7n	CPS	2025	1	2026-02-02 11:37:24.66	2026-02-02 11:37:24.66	P.2	0
cml53hwxe0005sfgeo8hiy842	CPS	2025	1	2026-02-02 11:37:24.723	2026-02-02 11:37:24.723	P.3	0
cml53hwym0006sfgeu06946ny	CPS	2025	1	2026-02-02 11:37:24.767	2026-02-02 11:37:24.767	P.4	13
cml53hwzl0007sfge30dssym6	CPS	2025	1	2026-02-02 11:37:24.802	2026-02-02 11:37:24.802	P.5	67
cml53hx0o0008sfgex26mlmgo	CPS	2025	1	2026-02-02 11:37:24.84	2026-02-02 11:37:24.84	P.6	0
cml53hx1z0009sfgexv6n9nsn	CPS	2025	1	2026-02-02 11:37:24.887	2026-02-02 11:37:24.887	P.7	0
\.


--
-- Data for Name: Todo; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."Todo" (id, "userId", title, description, "dueDate", "isCompleted", "completedAt", "isDeferred", "deferredUntil", priority, category, "reminderSent", "createdAt", "updatedAt") FROM stdin;
cml7wz2460001hugj9j4e8efs	cml0mbpgc000011p5by76txxd	meeting		2026-02-04 00:00:00	f	\N	f	\N	MEDIUM	GENERAL	f	2026-02-04 10:58:05.809	2026-02-04 10:58:05.809
\.


--
-- Data for Name: UpcomingEvent; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."UpcomingEvent" (id, date, activity, "inCharge", rate, "createdAt", "updatedAt", status) FROM stdin;
cml0mbpvf001511p55tnla4ry	2026-02-15 00:00:00	Parent-Teacher Conference	Mr. Okello	High	2026-01-30 08:25:37.467	2026-01-30 08:25:37.467	ACTIVE
cml0mbpvo001611p5h7ez1ncr	2026-03-01 00:00:00	Sports Day	Ms. Nakato	Medium	2026-01-30 08:25:37.476	2026-01-30 08:25:37.476	ACTIVE
cml0mbpvz001711p5gnuaxaw4	2026-03-20 00:00:00	Board Meeting	GM	High	2026-01-30 08:25:37.487	2026-01-30 08:25:37.487	ACTIVE
cml0mbpwb001811p5fs2waw1z	2026-04-05 00:00:00	End of Term Exams	Academic Director	High	2026-01-30 08:25:37.499	2026-01-30 08:25:37.499	ACTIVE
cml4uuxe2001goma1q8q4zwmv	2026-02-15 00:00:00	Parent-Teacher Conference	Mr. Okello	High	2026-02-02 07:35:35.306	2026-02-02 07:35:35.306	ACTIVE
cml4uuxei001homa1rxc6zx2r	2026-03-01 00:00:00	Sports Day	Ms. Nakato	Medium	2026-02-02 07:35:35.323	2026-02-02 07:35:35.323	ACTIVE
cml4uuxeu001ioma1fja3ug3e	2026-03-20 00:00:00	Board Meeting	GM	High	2026-02-02 07:35:35.334	2026-02-02 07:35:35.334	ACTIVE
cml4uuxf1001joma135ou1xom	2026-04-05 00:00:00	End of Term Exams	Academic Director	High	2026-02-02 07:35:35.341	2026-02-02 07:35:35.341	ACTIVE
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt") FROM stdin;
cml0mbpgc000011p5by76txxd	gm@sak.org	$2a$10$4Ne4XCQmdpyaghsMSxQ3d.RbmWJXmyPyWP5FERDPLe7UB5GLG0mpu	General Manager	GM	2026-01-30 08:25:36.924	2026-01-30 08:25:36.924
cml0mbpkm000111p50jv7ovmv	trustee@sak.org	$2a$10$QvzsiTnyoQcMOaaKrb6I6.YMz/9n7vXr0jus.2ERQQq3nDxbPCTSm	C Trustee	TRUSTEE	2026-01-30 08:25:37.078	2026-02-04 10:18:12.143
\.


--
-- Data for Name: WeeklyReport; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."WeeklyReport" (id, "weekNumber", year, "weekStartDate", "weekEndDate", "publishedAt", "isDraft", "feesCollectionPercent", "schoolsExpenditurePercent", "infrastructurePercent", "totalEnrollment", "theologyEnrollment", "p7PrepExamsPercent", "createdAt", "updatedAt", admissions, "syllabusCoveragePercent", term, "generalManager") FROM stdin;
cml0mbpl4000211p53ym457jw	1	2026	2026-01-06 00:00:00	2026-01-12 00:00:00	2026-01-12 00:00:00	f	78	85	45	1250	180	72	2026-01-30 08:25:37.096	2026-01-30 08:25:37.096	45	70	1	\N
cml0mbplk000311p5rtdx6569	2	2026	2026-01-13 00:00:00	2026-01-19 00:00:00	2026-01-19 00:00:00	f	82	88	50	1265	185	75	2026-01-30 08:25:37.113	2026-01-30 08:25:37.113	52	74	1	\N
cml0mbplx000411p5frzqrwtq	3	2026	2026-01-20 00:00:00	2026-01-26 00:00:00	2026-01-26 00:00:00	f	85	90	55	1280	190	78	2026-01-30 08:25:37.125	2026-01-30 08:25:37.125	60	78	1	\N
cml0oqfm90000j4up4il3k104	25	2025	2025-06-15 21:00:00	2025-06-21 21:00:00	\N	t	0	0	0	0	2858	0	2026-01-30 09:33:03.248	2026-01-30 09:33:03.248	0	0	1	\N
cml0osqaq0002j4upjg26bkpb	38	2025	2025-09-14 21:00:00	2025-09-20 21:00:00	\N	t	0	0	0	0	2864	0	2026-01-30 09:34:50.401	2026-01-30 09:34:50.401	0	0	1	\N
\.


--
-- Data for Name: WeeklyScorecard; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public."WeeklyScorecard" (id, week, year, school, "academicPercent", "financePercent", "qualityPercent", "tdpPercent", "theologyPercent", "createdAt", "updatedAt", term) FROM stdin;
cml0mbpxd001d11p5cvin4f2v	1	2026	CPS	74.83242187098656	92.9919078271823	88.78892508495454	77.19246139032356	92.08175149796503	2026-01-30 08:25:37.537	2026-02-02 07:35:35.391	1
cml0mbpxn001e11p5371eg2ud	1	2026	MENGO	79.36357417331999	85.54970055695844	86.10686625372409	94.11816069331962	89.80592783395886	2026-01-30 08:25:37.548	2026-02-02 07:35:35.407	1
cml0mbpy0001f11p5mp6j5qnn	1	2026	NAKASERO	86.77072862665213	91.23063436959848	76.72587492320955	85.258092243556	85.8847012867111	2026-01-30 08:25:37.56	2026-02-02 07:35:35.419	1
cml0mbpyb001g11p5hs0xaim4	1	2026	KISASI	89.72940263386995	83.29481405410661	84.49050368149467	77.0134017356591	93.19827414388735	2026-01-30 08:25:37.571	2026-02-02 07:35:35.428	1
cml0mbpym001h11p5w6nex7u9	1	2026	OLD K'LA	85.29479471289535	76.63993477071318	70.30000968190207	81.63922525115775	94.56650274550036	2026-01-30 08:25:37.582	2026-02-02 07:35:35.437	1
cml0mbpyu001i11p5p01cyord	1	2026	WINSTON	74.30290802745432	82.85732552533942	85.0852615350255	86.36716109810095	87.36285274273082	2026-01-30 08:25:37.591	2026-02-02 07:35:35.446	1
cml0mbpz1001j11p5awzwxpwx	1	2026	FAIRWAYS	78.28298732207396	77.37965451011246	74.38701629503089	93.34060941787988	76.14107092246779	2026-01-30 08:25:37.597	2026-02-02 07:35:35.455	1
cml0mbpz8001k11p5olkpqenv	1	2026	KPM	84.12523599666771	79.44182745866948	74.84769523451023	84.32016496047343	91.51119794254448	2026-01-30 08:25:37.604	2026-02-02 07:35:35.469	1
cml0mbpze001l11p5kilcrq3j	1	2026	KPS	93.31471168496802	84.03392089984737	82.03726202215866	79.61095972415265	91.64395705688155	2026-01-30 08:25:37.61	2026-02-02 07:35:35.483	1
cml0mbpzn001m11p520rbbkn0	1	2026	KITINTALE	70.50862551565137	89.59110036877809	89.18266559510502	73.6305232587483	88.94003241586421	2026-01-30 08:25:37.619	2026-02-02 07:35:35.495	1
cml0mbpzy001n11p5lnbhd5pe	1	2026	KIRA	92.98718424889766	84.4103029238116	78.8871144697535	88.9603195202292	84.33016962596159	2026-01-30 08:25:37.631	2026-02-02 07:35:35.508	1
cml0mbq09001o11p5pc18e895	2	2026	CPS	72.45578817060219	81.26799343261182	84.9923885311536	65.29316828466233	73.35950173190382	2026-01-30 08:25:37.642	2026-02-02 07:35:35.517	1
cml0mbq0k001p11p5r41x9ywz	2	2026	MENGO	77.33737686621227	79.86475158351556	75.25999740613392	85.89736482770206	78.15472551691515	2026-01-30 08:25:37.653	2026-02-02 07:35:35.525	1
cml0mbq0t001q11p5tel0qlj9	2	2026	NAKASERO	88.29669990057721	82.66745442476004	78.50346254211307	78.59068969461147	74.44481681814784	2026-01-30 08:25:37.661	2026-02-02 07:35:35.533	1
cml0mbq0z001r11p5j6rhvyf3	2	2026	KISASI	85.14840471306883	90.50139011793006	70.93319812995868	73.2510490559311	80.59593897545491	2026-01-30 08:25:37.667	2026-02-02 07:35:35.543	1
cml0mbq15001s11p526ltae6j	2	2026	OLD K'LA	79.15819257649169	85.77520652425352	81.50597224449402	67.19849562720798	75.70093204078391	2026-01-30 08:25:37.674	2026-02-02 07:35:35.556	1
cml0mbq1d001t11p5idb4h1mm	2	2026	WINSTON	74.02657612761371	89.02834628150384	72.22557350502953	90.60129343309595	92.64532795379314	2026-01-30 08:25:37.681	2026-02-02 07:35:35.569	1
cml0mbq1n001u11p56n3o8q9r	2	2026	FAIRWAYS	84.71580928815303	91.44098937468252	94.98542884243984	81.07690564257773	86.70106311711002	2026-01-30 08:25:37.691	2026-02-02 07:35:35.581	1
cml0mbq1y001v11p5il0pav7p	2	2026	KPM	92.7453381733791	93.479690616227	72.43609282851376	90.37003221020449	70.58324566885759	2026-01-30 08:25:37.702	2026-02-02 07:35:35.592	1
cml0mbq29001w11p5go15931g	2	2026	KPS	81.7464585370497	78.8940321007776	93.60943743107188	65.97224417540338	86.06002261384016	2026-01-30 08:25:37.713	2026-02-02 07:35:35.599	1
cml0mbq2k001x11p5rhxu6dud	2	2026	KITINTALE	87.07467273545063	86.26133012268234	81.28557712570229	74.28001644819142	81.43333401647145	2026-01-30 08:25:37.724	2026-02-02 07:35:35.605	1
cml0mbq2s001y11p5qmltdn9u	2	2026	KIRA	71.49503805265832	81.89110203406338	89.48678662232604	69.88004581220883	86.86182397560782	2026-01-30 08:25:37.733	2026-02-02 07:35:35.611	1
cml0mbq2y001z11p5uz9xxnmp	3	2026	CPS	86.10000945650211	77.57765413638622	86.79585333760375	93.53249002910005	91.89368820653208	2026-01-30 08:25:37.739	2026-02-02 07:35:35.619	1
cml0mbq34002011p56itslwkv	3	2026	MENGO	89.35507090763451	83.04540650599185	71.79713278404759	76.8760814768576	91.65019114628271	2026-01-30 08:25:37.745	2026-02-02 07:35:35.631	1
cml0mbq3a002111p53mv90wk6	3	2026	NAKASERO	80.62189030021753	78.42722008699211	79.3971286798856	78.6610671803359	71.78740628637442	2026-01-30 08:25:37.751	2026-02-02 07:35:35.642	1
cml0mbq3j002211p5ixnfcioe	3	2026	KISASI	81.79827017242636	84.02765013567492	93.63469592934608	65.97809626468755	92.73522041010557	2026-01-30 08:25:37.759	2026-02-02 07:35:35.653	1
cml0mbq3v002311p5yq7xddms	3	2026	OLD K'LA	74.34044991187852	75.9818101187471	83.26551930059658	94.42174233973378	77.87685863245103	2026-01-30 08:25:37.771	2026-02-02 07:35:35.663	1
cml0mbq45002411p5v9nwor4f	3	2026	WINSTON	79.2065668612515	93.3540192216992	84.79713361684735	69.50593717997648	72.58614620605174	2026-01-30 08:25:37.782	2026-02-02 07:35:35.672	1
cml0mbq4g002511p5gllznst9	3	2026	FAIRWAYS	71.56461804175046	78.75244856919673	92.24157382504062	91.19330900208502	82.26253288140154	2026-01-30 08:25:37.792	2026-02-02 07:35:35.679	1
cml0mbq4o002611p5py4sxngb	3	2026	KPM	74.82286449634921	75.39153159921693	73.60262711202085	94.22535602730346	84.47851147700945	2026-01-30 08:25:37.8	2026-02-02 07:35:35.685	1
cml0mbq4u002711p5z6mev6s5	3	2026	KPS	70.28335803732072	86.61369810228102	78.52916465482579	72.0229529232599	70.91431259532031	2026-01-30 08:25:37.806	2026-02-02 07:35:35.695	1
cml0mbq50002811p5poj5oc0r	3	2026	KITINTALE	83.3483159214298	80.54688600516965	85.47615921401534	90.65465336069444	79.07694725757133	2026-01-30 08:25:37.812	2026-02-02 07:35:35.708	1
cml0mbq56002911p5jpywtscm	3	2026	KIRA	81.40619635852487	90.58831410037324	77.00684176459757	90.23934486073247	88.57116872612598	2026-01-30 08:25:37.818	2026-02-02 07:35:35.72	1
cml0mbq5e002a11p5wb7kfv5g	4	2026	CPS	87.21326860431387	81.20907024997993	78.84975983813348	75.54727308311112	92.97577536493775	2026-01-30 08:25:37.826	2026-02-02 07:35:35.732	1
cml0mbq5q002b11p5owc0q1iq	4	2026	MENGO	82.2975899963846	79.53330679839435	71.55595028796517	76.60444261874864	80.86564366319364	2026-01-30 08:25:37.838	2026-02-02 07:35:35.742	1
cml0mbq62002c11p5ufhy9ck9	4	2026	NAKASERO	86.45066170407405	89.87359206107983	93.99553623560946	65.95092272093447	91.27081198249809	2026-01-30 08:25:37.85	2026-02-02 07:35:35.75	1
cml0mbq6c002d11p5ivr8c0ds	4	2026	KISASI	91.16580264038862	88.18286437766218	86.28968667715364	79.38024684003703	83.24673103943678	2026-01-30 08:25:37.86	2026-02-02 07:35:35.757	1
cml0mbq6k002e11p5zm9177dy	4	2026	OLD K'LA	74.40767270478571	86.23342390268158	90.24953195002055	83.20316502508174	75.04959942457353	2026-01-30 08:25:37.869	2026-02-02 07:35:35.765	1
cml0mbq6r002f11p5zg1dajdh	4	2026	WINSTON	91.37157729185473	93.59867940318784	71.39722594207355	73.12608353378991	91.85579105484962	2026-01-30 08:25:37.875	2026-02-02 07:35:35.777	1
cml0mbq6x002g11p5o2hvs9py	4	2026	FAIRWAYS	81.67593887292766	84.70578909950027	75.66278158551269	86.14907125591488	73.85847289612582	2026-01-30 08:25:37.881	2026-02-02 07:35:35.791	1
cml0mbq74002h11p5qvgceytb	4	2026	KPM	81.32635319818877	82.81819978101946	70.30591512077301	72.0268131341323	71.84620965956566	2026-01-30 08:25:37.888	2026-02-02 07:35:35.805	1
cml0mbq7d002i11p5hnrpgfli	4	2026	KPS	71.14383141435117	91.88743184986852	78.2357184006398	82.82803563905779	92.51566102475297	2026-01-30 08:25:37.897	2026-02-02 07:35:35.816	1
cml0mbq7p002j11p5dcr15tq1	4	2026	KITINTALE	93.00488937083989	78.1808448455061	89.5400567165234	73.66896269858795	94.97080115560972	2026-01-30 08:25:37.909	2026-02-02 07:35:35.827	1
cml0mbq81002k11p5bd2mrsz4	4	2026	KIRA	85.3843899688019	94.86300284322994	73.3748813116024	84.12132679866836	93.87040692604899	2026-01-30 08:25:37.921	2026-02-02 07:35:35.835	1
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: mustafa
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
34055b6e-e8a8-4278-b459-fb82c46958be	29b1cc97f48783f2df393e3e17118be01be7767e1773e9880f8d067e02e3d014	2026-01-30 11:25:25.66681+03	20260118204035_gm_portal_init	\N	\N	2026-01-30 11:25:25.200298+03	1
b913c7ce-ff54-4561-9c34-755d7d0d94f5	555c692aa10ac29c502ac1b526e95241d1e6fea9e492017c81c6a6cce5e7fc0b	2026-01-30 11:25:25.822715+03	20260118205121_add_weekly_reports_reactions	\N	\N	2026-01-30 11:25:25.672341+03	1
87087a87-0a28-484d-9310-4cfffb1d0056	dcabf76a59ec8eedc67c1d92bb361e0f0ba3faf0ec5e99ec1da54358db7cea51	2026-02-02 15:08:38.340394+03	20260202120838_update_enrollment_model	\N	\N	2026-02-02 15:08:38.213762+03	1
7366030e-bc95-47a8-b0c5-f8c51502db98	92154109c0b4d7aa11e63a451398e7e5a2382ac199a59ba04b11aadb4d4636df	2026-01-30 11:25:25.958716+03	20260118225121_add_schools_departments	\N	\N	2026-01-30 11:25:25.83243+03	1
19ac7be5-f488-47ca-a324-a9d722fedd73	6ef6ab3af645cebb2219ca48c3db19c97efd7ce9397775fb10cd5f970ee47de1	2026-01-30 11:25:26.139219+03	20260118234751_add_messages_notifications	\N	\N	2026-01-30 11:25:25.968477+03	1
84c0f8b0-e544-46ff-b204-d257f29a9348	14b58db291512093be8b1771ad1a4206e74f3d052bdc01101c3e3391a4946003	2026-01-30 11:25:26.176394+03	20260121184923_add_syllabus_and_admissions	\N	\N	2026-01-30 11:25:26.146652+03	1
ad3b52ad-c0f0-4475-bb3c-f5aa76fa89a9	9afed278e74d9f0b72cebb24e089ffe0d260afeb8946bca734aa03957abd080a	2026-02-03 12:05:47.700913+03	20260203090503_rename_amount_to_percentage	\N	\N	2026-02-03 12:05:47.680891+03	1
39ffe5aa-d2f8-488b-849d-99418e202265	b2e2c8414c99a73c2f3ba864dae9e532907a8db15febee17353d28dab308a443	2026-01-30 11:25:26.246514+03	20260121201311_add_red_issue_item_status	\N	\N	2026-01-30 11:25:26.183465+03	1
cb06e7bf-a97e-4e23-b4cb-f90a9afa2cb2	2fd05faa5a6e8a67c920c2ec034af1e27a7abbe12dc8ca6ea9e608f88e97544e	2026-01-30 11:25:26.275314+03	20260121203631_add_p7_cohort_journey	\N	\N	2026-01-30 11:25:26.251478+03	1
afb12f1a-d573-4a6c-8f79-988dfb01f003	7b7aab0c47be349be05542dcb6887d3031b0b209fb782067de89a4f1ed3e87f0	2026-01-30 11:25:26.338742+03	20260122154631_make_income_dynamic	\N	\N	2026-01-30 11:25:26.286721+03	1
0a432267-bace-42ed-9630-e662604f3635	e340b4d62bcc4ced131bd115e289c46e53ebdeaed1c45bd8549a5a591b407f61	2026-02-03 21:21:04.54342+03	20260203182104_add_p7_prep_results	\N	\N	2026-02-03 21:21:04.418489+03	1
cb02d6e8-8e51-4644-8cde-396cd0f49a75	297d10df39fe38198a19e8e4519c4395b56452d4d7ad5a49b480baee6759a244	2026-01-30 11:25:26.570213+03	20260125133904_add_term_support	\N	\N	2026-01-30 11:25:26.34858+03	1
f6bd214c-da44-44b0-b057-8911790831a8	2161218f8a78d0318dc9080765cd70e115aaab7d907a4a54beb0ccf93da11c3a	2026-01-30 11:25:26.659951+03	20260126205809_add_term_start_config	\N	\N	2026-01-30 11:25:26.580024+03	1
fd36a685-6936-4943-86b9-74ba8be50e10	26dd1dae22de18d081f17a4a7c05cef6ebde95930c6ecac33e784c13f632ec8a	2026-01-30 11:25:31.253945+03	20260130082531_add_theology_enrollment	\N	\N	2026-01-30 11:25:31.08355+03	1
89f77085-4f92-4159-ab5e-b2632631f34d	3ba36129704dde153847a5c4924382dc59b35800bb044347dae652f63b793f14	2026-02-04 11:01:14.913754+03	20260204080114_add_comments_model	\N	\N	2026-02-04 11:01:14.804113+03	1
896103e8-ad10-4d5c-a83f-0fa53ec5322c	0ea5413c21e81754872d876953f073e0fef0025471af9e307011279542c7bf18	2026-02-02 10:57:23.487687+03	20260202075723_restructure_theology_enrollment	\N	\N	2026-02-02 10:57:23.416104+03	1
1816e120-239b-4205-9cfd-0cd0ee74f882	4cbba1b77ee65a2c61169ad1393082b92630adfb817920a35ed0cba4cd2b0921	2026-02-02 14:57:21.629607+03	20260202115721_add_school_enrollment	\N	\N	2026-02-02 14:57:21.441231+03	1
a88941f0-334c-496b-9cc2-3358af371621	16f20b79521fb51a959a60c4ef451659fa8bc9af4270ef4356bd379357d14754	2026-02-04 11:31:05.012561+03	20260204083104_add_trustee_features_models	\N	\N	2026-02-04 11:31:04.756854+03	1
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
-- Name: GMProject GMProject_pkey; Type: CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."GMProject"
    ADD CONSTRAINT "GMProject_pkey" PRIMARY KEY (id);


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
-- Name: GMProject_status_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "GMProject_status_idx" ON public."GMProject" USING btree (status);


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
-- Name: OtherIncome_year_month_idx; Type: INDEX; Schema: public; Owner: mustafa
--

CREATE INDEX "OtherIncome_year_month_idx" ON public."OtherIncome" USING btree (year, month);


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
-- Name: Todo Todo_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mustafa
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: mustafa
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict sFIC7G7kQPoc46yRG16duWsB6rhF63SZ6xWRA4zOBhVcZIWBNkSAPSSApJG0xP6


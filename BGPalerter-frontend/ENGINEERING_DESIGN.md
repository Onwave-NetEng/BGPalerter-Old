# BGPalerter Dashboard - Engineering Design Document

**Document Version:** 1.0  
**Date:** December 22, 2025 
**Author:** Iain Muroch 
**Classification:** Technical Design Specification  
**Audience:** Engineering Teams, Technical Architects, QA Engineers 

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Manus AI | Initial release |

### Distribution List

- Engineering Team
- Quality Assurance Team
- Security Team
- Operations Team
- Technical Management

### Document Purpose

This document provides comprehensive engineering design specifications for the BGPalerter Dashboard system, including architecture, component design, data models, API specifications, security design, and deployment architecture. It serves as the authoritative technical reference for development, testing, compliance auditing, and system administration.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Design](#2-architecture-design)
3. [Component Specifications](#3-component-specifications)
4. [Data Architecture](#4-data-architecture)
5. [API Design](#5-api-design)
6. [Security Architecture](#6-security-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Performance Design](#9-performance-design)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Disaster Recovery](#11-disaster-recovery)
12. [Compliance & Standards](#12-compliance--standards)

---

## 1. System Overview

### 1.1 Purpose

The BGPalerter Dashboard is a comprehensive web-based monitoring and management interface for BGPalerter, an open-source BGP monitoring tool. The dashboard provides real-time visibility into BGP routing status, alert management, custom rule configuration, and multi-channel notification capabilities.

### 1.2 Scope

The system encompasses the following functional areas:

**Core Monitoring:** Real-time BGP status display, prefix monitoring, AS path tracking, RPKI validation status, and visibility monitoring across multiple route collectors.

**Alert Management:** Comprehensive alert history with filtering, acknowledgment tracking, resolution management, and automated notification delivery to multiple channels including Microsoft Teams, Slack, Discord, and email.

**Configuration Management:** Custom alert rule creation with visual rule builder, notification channel configuration, prefix ownership database management, and user access control.

**Performance Analytics:** Time-series performance metrics collection and visualization, including BGP update rates, API latency tracking, system resource utilization, and alert frequency analysis.

**Integration Services:** Read-only integration with existing BGPalerter installations, RIPE RIS route-collector data access, webhook delivery to collaboration platforms, and email notification processing.

### 1.3 Key Design Principles

The system architecture adheres to the following core principles:

**Non-Destructive Integration:** The dashboard integrates with existing BGPalerter installations without modifying any BGPalerter files, configuration, or data. All integration is read-only through BGPalerter's API, ensuring the monitoring engine remains untouched and operational.

**Type Safety:** End-to-end type safety is achieved through TypeScript strict mode across the entire stack, with tRPC providing compile-time type checking for all client-server communication. This eliminates entire classes of runtime errors and improves developer productivity.

**Security by Design:** Authentication and authorization are built into the foundation, with role-based access control enforced at both API and UI layers. All sensitive data is encrypted at rest, and secure communication patterns are employed throughout.

**Operational Excellence:** The system is designed for easy deployment, monitoring, and maintenance, with automated deployment scripts, comprehensive logging, graceful error handling, and clear operational procedures.

**Scalability:** While initially designed for single-server deployment, the architecture supports future scaling through database migration to PostgreSQL, horizontal scaling of the API layer, and caching layer introduction.

### 1.4 Technology Stack

The system is built on a modern, industry-standard technology stack:

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.x | UI framework |
| | TypeScript | 5.7.x | Type-safe development |
| | Tailwind CSS | 4.x | Utility-first styling |
| | Shadcn/ui | Latest | Component library |
| | Chart.js | 4.x | Data visualization |
| | Wouter | 3.x | Client-side routing |
| **Backend** | Node.js | 22.x | Runtime environment |
| | Express | 4.x | HTTP server |
| | tRPC | 11.x | Type-safe API layer |
| | Drizzle ORM | Latest | Database access |
| **Database** | SQLite | 3.x | Data persistence |
| **Process Management** | PM2 | Latest | Production process manager |
| **Build Tools** | Vite | 7.x | Frontend bundler |
| | esbuild | Latest | Backend bundler |
| | pnpm | 9.x | Package manager |

### 1.5 System Context

The dashboard operates within a larger network monitoring ecosystem:

```
┌─────────────────────────────────────────────────────────┐
│                    Network Infrastructure                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Router 1   │  │   Router 2   │  │   Router N   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │ BGP Updates
                             ↓
                    ┌─────────────────┐
                    │   BGPalerter    │
                    │  (Port 8011)    │
                    │  ┌───────────┐  │
                    │  │ Monitors  │  │
                    │  │  Hijack   │  │
                    │  │   RPKI    │  │
                    │  │ Visibility│  │
                    │  └───────────┘  │
                    └────────┬────────┘
                             │ REST API
                             ↓
                    ┌─────────────────┐
                    │    Dashboard    │
                    │  (Port 3000)    │
                    │  ┌───────────┐  │
                    │  │  Web UI   │  │
                    │  │  API      │  │
                    │  │  Database │  │
                    │  └───────────┘  │
                    └────────┬────────┘
                             │ Webhooks
                             ↓
                    ┌─────────────────┐
                    │  Notifications  │
                    │  ┌───────────┐  │
                    │  │   Teams   │  │
                    │  │   Slack   │  │
                    │  │  Discord  │  │
                    │  └───────────┘  │
                    └─────────────────┘
```

---

## 2. Architecture Design

### 2.1 Architectural Style

The system employs a **layered monolithic architecture** with clear separation of concerns. This architectural style was chosen for its simplicity, ease of deployment, and suitability for single-server deployments typical of ISP network monitoring environments.

**Architectural Layers:**

1. **Presentation Layer** (Client) - React-based user interface
2. **API Layer** (tRPC) - Type-safe RPC communication
3. **Business Logic Layer** (Services) - Core application logic
4. **Data Access Layer** (Drizzle ORM) - Database operations
5. **Integration Layer** (External Services) - BGPalerter, RIS, Webhooks

### 2.2 Component Architecture

The system is organized into distinct components with well-defined responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Application                                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Pages   │  │Components│  │ Contexts │            │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │ │
│  │       │             │             │                    │ │
│  │       └─────────────┴─────────────┘                    │ │
│  │                     │                                   │ │
│  │              ┌──────┴───────┐                          │ │
│  │              │  tRPC Client │                          │ │
│  │              └──────┬───────┘                          │ │
│  └─────────────────────┼──────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP/JSON (Type-safe)
┌────────────────────────┼────────────────────────────────────┐
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  tRPC Server (Express)                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Auth    │  │  Alerts  │  │  Rules   │          │   │
│  │  │  Router  │  │  Router  │  │  Router  │          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │   │
│  │       │             │             │                  │   │
│  │       └─────────────┴─────────────┘                  │   │
│  │                     │                                 │   │
│  │              ┌──────┴───────┐                        │   │
│  │              │   Services   │                        │   │
│  │              │  ┌─────────┐ │                        │   │
│  │              │  │BGPalerter│ │                        │   │
│  │              │  │ Service  │ │                        │   │
│  │              │  ├─────────┤ │                        │   │
│  │              │  │ Webhook  │ │                        │   │
│  │              │  │ Service  │ │                        │   │
│  │              │  ├─────────┤ │                        │   │
│  │              │  │   RIS    │ │                        │   │
│  │              │  │ Service  │ │                        │   │
│  │              │  └─────────┘ │                        │   │
│  │              └──────┬───────┘                        │   │
│  └─────────────────────┼────────────────────────────────┘   │
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Data Access Layer (Drizzle ORM)                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Users   │  │  Alerts  │  │  Rules   │          │   │
│  │  │  Queries │  │  Queries │  │  Queries │          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │   │
│  │       │             │             │                  │   │
│  │       └─────────────┴─────────────┘                  │   │
│  │                     │                                 │   │
│  └─────────────────────┼─────────────────────────────────┘   │
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SQLite Database                                     │   │
│  │  database.sqlite                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                      Server (Node.js)                       │
└─────────────────────────────────────────────────────────────┘

External Integrations:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  BGPalerter  │  │   RIPE RIS   │  │   Webhooks   │
│   :8011      │  │  (HTTPS)     │  │   (HTTPS)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 2.3 Design Patterns

The architecture employs several industry-standard design patterns:

**Layered Architecture Pattern:** Clear separation between presentation, business logic, and data access layers. Each layer depends only on the layer below it, promoting modularity and testability.

**Repository Pattern:** Data access is abstracted through repository functions in `server/db.ts`, isolating database implementation details from business logic.

**Service Layer Pattern:** Business logic is encapsulated in service modules (`server/services/`), providing a clean API for use by routers and other services.

**Strategy Pattern:** Webhook notification services implement a common interface, allowing easy addition of new notification channels without modifying core logic.

**Factory Pattern:** Alert creation logic uses factory functions to instantiate different alert types with appropriate defaults and validation.

**Observer Pattern:** Event-driven notification system where alert creation triggers notifications to all enabled channels.

**Dependency Injection:** Services receive dependencies as parameters, facilitating testing and reducing coupling.

### 2.4 Communication Patterns

**Client-Server Communication:** The client communicates with the server exclusively through tRPC, which provides type-safe remote procedure calls over HTTP. All requests use POST to `/api/trpc` with JSON payloads, and responses include full type information.

**Server-BGPalerter Communication:** The server polls BGPalerter's REST API at regular intervals (30 seconds) to fetch status, monitors, and alerts. Communication is one-way (read-only) to ensure non-destructive integration.

**Server-External Services Communication:** Webhook notifications are delivered via HTTPS POST requests to external services (Teams, Slack, Discord). The system implements retry logic with exponential backoff for failed deliveries.

**Database Communication:** All database access goes through Drizzle ORM, which provides type-safe query building and automatic SQL generation. Raw SQL is used only for complex queries that benefit from manual optimization.

### 2.5 Scalability Considerations

While the current architecture targets single-server deployment, it includes provisions for future scaling:

**Horizontal Scaling:** The stateless API layer can be horizontally scaled by running multiple instances behind a load balancer. Session state is stored in the database, allowing any instance to handle any request.

**Database Scaling:** The schema is designed to support migration from SQLite to PostgreSQL without application code changes, thanks to Drizzle ORM's database-agnostic API.

**Caching Layer:** The architecture supports introduction of Redis or similar caching layer for frequently accessed data like BGPalerter status and recent alerts.

**Microservices Migration:** If needed, individual services (webhooks, RIS integration) can be extracted into separate microservices with minimal refactoring, as they already have well-defined interfaces.

---

## 3. Component Specifications

### 3.1 Frontend Components

The frontend is organized into a component hierarchy with clear responsibilities:

#### 3.1.1 Page Components

Page components represent top-level routes and orchestrate multiple smaller components:

**Home Page** (`client/src/pages/Home.tsx`)
- **Purpose:** Primary dashboard view showing real-time BGP status
- **State Management:** Uses tRPC queries for BGPalerter status, monitors, and recent alerts
- **Auto-refresh:** Polls every 30 seconds using React Query's refetch interval
- **Key Features:** Status cards, monitor list, recent alerts table, performance summary

**Alert History Page** (`client/src/pages/AlertHistory.tsx`)
- **Purpose:** Comprehensive alert management interface
- **State Management:** Paginated tRPC query with filters (severity, type, date range, acknowledgment status)
- **Key Features:** Advanced filtering, bulk acknowledgment, alert details modal, export functionality

**Alert Rules Page** (`client/src/pages/AlertRules.tsx`)
- **Purpose:** Custom alert rule configuration
- **State Management:** tRPC queries for rules list, mutations for create/update/delete
- **Key Features:** Visual rule builder, condition editor, severity selection, enable/disable toggle

**Performance Metrics Page** (`client/src/pages/PerformanceMetrics.tsx`)
- **Purpose:** Time-series performance visualization
- **State Management:** tRPC query for metrics with time range selection
- **Key Features:** Chart.js line charts, metric selection, time range picker, data export

**Routing Data Page** (`client/src/pages/RoutingData.tsx`)
- **Purpose:** RIPE RIS route-collector data visualization
- **State Management:** tRPC query with prefix/ASN search
- **Key Features:** Route collector selection, AS path display, peer information

**Administration Page** (`client/src/pages/Administration.tsx`)
- **Purpose:** System configuration and notification settings
- **State Management:** tRPC queries and mutations for settings
- **Key Features:** Webhook configuration, severity filters, test notification buttons

#### 3.1.2 UI Components

Reusable UI components built on Shadcn/ui:

**AlertCard** (`client/src/components/AlertCard.tsx`)
- **Props:** `alert: Alert`, `onAcknowledge: (id) => void`, `onResolve: (id) => void`
- **Purpose:** Display individual alert with actions
- **Features:** Severity badge, timestamp, description, action buttons

**StatusCard** (`client/src/components/StatusCard.tsx`)
- **Props:** `title: string`, `value: string | number`, `status: 'ok' | 'warning' | 'error'`, `icon?: ReactNode`
- **Purpose:** Display key metrics with visual status indicator
- **Features:** Color-coded status, icon support, responsive layout

**FilterBar** (`client/src/components/FilterBar.tsx`)
- **Props:** `filters: FilterConfig`, `onFilterChange: (filters) => void`
- **Purpose:** Reusable filtering interface
- **Features:** Multiple filter types (select, date range, text search), clear all button

**DashboardLayout** (`client/src/components/DashboardLayout.tsx`)
- **Props:** `children: ReactNode`
- **Purpose:** Consistent layout wrapper with navigation
- **Features:** Sidebar navigation, user menu, logout button, responsive mobile menu

#### 3.1.3 Custom Hooks

Reusable logic extracted into custom hooks:

**useAuth** (`client/src/hooks/useAuth.ts`)
- **Purpose:** Access current user and authentication state
- **Returns:** `{ user: User | null, isLoading: boolean, isAuthenticated: boolean }`
- **Implementation:** Wraps tRPC `auth.me` query

**useAutoRefresh** (`client/src/hooks/useAutoRefresh.ts`)
- **Purpose:** Automatic data refresh with configurable interval
- **Parameters:** `interval: number`, `enabled: boolean`
- **Returns:** `{ isRefreshing: boolean, lastRefresh: Date }`
- **Implementation:** Uses React Query's refetch interval

**useFilters** (`client/src/hooks/useFilters.ts`)
- **Purpose:** Manage complex filter state
- **Returns:** `{ filters: FilterState, setFilter: (key, value) => void, clearFilters: () => void }`
- **Implementation:** useState with object reducer pattern

### 3.2 Backend Components

The backend is organized into services, routers, and data access layers:

#### 3.2.1 Service Layer

Services encapsulate business logic and external integrations:

**BGPalerter Service** (`server/services/bgpalerter.service.ts`)
- **Purpose:** Integration with BGPalerter API
- **Methods:**
  - `getStatus(): Promise<BGPalerterStatus>` - Fetch current status
  - `getMonitors(): Promise<Monitor[]>` - Fetch all monitors
  - `getAlerts(): Promise<Alert[]>` - Fetch recent alerts
- **Error Handling:** Graceful fallback to default values when BGPalerter unavailable
- **Logging:** Structured logging with context (endpoint, duration, error details)

**Webhook Service** (`server/services/webhooks/`)
- **Purpose:** Multi-channel notification delivery
- **Subservices:**
  - `teams.service.ts` - Microsoft Teams adaptive cards
  - `slack.service.ts` - Slack block kit messages
  - `discord.service.ts` - Discord embeds
- **Common Interface:**
  ```typescript
  interface WebhookService {
    send(alert: Alert, webhookUrl: string): Promise<boolean>;
    formatMessage(alert: Alert): WebhookPayload;
  }
  ```
- **Features:** Retry logic (3 attempts), exponential backoff, error logging

**RIS Service** (`server/services/ris.service.ts`)
- **Purpose:** RIPE RIS route-collector data access
- **Methods:**
  - `getRoutingData(prefix: string): Promise<RISData>` - Fetch routing data for prefix
  - `getASNData(asn: string): Promise<ASNData>` - Fetch ASN information
- **Caching:** 5-minute cache for RIS data to reduce API load
- **Rate Limiting:** Respects RIS API rate limits

**Hijack Detection Service** (`server/services/hijack-detection.service.ts`)
- **Purpose:** Automated prefix hijack detection
- **Methods:**
  - `detectHijack(prefix: string, announcingASN: string): Promise<HijackResult>` - Check if announcement is authorized
  - `updatePrefixOwnership(prefix: string, expectedASN: string): Promise<void>` - Update expected ownership
- **Database:** Uses `prefix_ownership` table for expected mappings
- **Logic:** Compares announcing ASN with expected ASN from database

#### 3.2.2 Router Layer (tRPC)

Routers define the API surface and handle request/response:

**Auth Router** (`server/routers.ts` - auth section)
- **Procedures:**
  - `me: publicProcedure.query()` - Get current user
  - `logout: protectedProcedure.mutation()` - Logout and clear session
- **Authentication:** Uses JWT tokens in secure HTTP-only cookies
- **Authorization:** `protectedProcedure` enforces authentication

**Alerts Router** (`server/routers.ts` - alerts section)
- **Procedures:**
  - `list: protectedProcedure.input(FilterSchema).query()` - List alerts with filters
  - `acknowledge: protectedProcedure.input(IdSchema).mutation()` - Acknowledge alert
  - `resolve: protectedProcedure.input(IdSchema).mutation()` - Resolve alert
  - `stats: protectedProcedure.query()` - Get alert statistics
- **Input Validation:** Zod schemas for all inputs
- **Authorization:** Role-based access control (operators can acknowledge, admins can resolve)

**Rules Router** (`server/routers.ts` - rules section)
- **Procedures:**
  - `list: protectedProcedure.query()` - List all rules
  - `create: protectedProcedure.input(RuleSchema).mutation()` - Create new rule
  - `update: protectedProcedure.input(RuleUpdateSchema).mutation()` - Update existing rule
  - `delete: protectedProcedure.input(IdSchema).mutation()` - Delete rule
- **Validation:** Complex rule condition validation
- **Authorization:** Admin-only for create/update/delete

**Notifications Router** (`server/routers.ts` - notifications section)
- **Procedures:**
  - `getSettings: protectedProcedure.query()` - Get notification settings
  - `updateSettings: protectedProcedure.input(SettingsSchema).mutation()` - Update settings
  - `testWebhook: protectedProcedure.input(TestSchema).mutation()` - Send test notification
- **Encryption:** Webhook URLs encrypted before storage
- **Validation:** URL format validation, severity filter validation

#### 3.2.3 Data Access Layer

Database queries abstracted through repository functions:

**Database Module** (`server/db.ts`)
- **Purpose:** Centralized database access
- **Pattern:** Repository pattern with typed functions
- **Example Functions:**
  ```typescript
  export async function createBgpAlert(data: NewAlert): Promise<Alert> {
    const [alert] = await db.insert(bgpAlerts).values(data).returning();
    return alert;
  }
  
  export async function getAlerts(filters: AlertFilters): Promise<Alert[]> {
    let query = db.select().from(bgpAlerts);
    
    if (filters.severity) {
      query = query.where(eq(bgpAlerts.severity, filters.severity));
    }
    
    if (filters.startDate) {
      query = query.where(gte(bgpAlerts.createdAt, filters.startDate));
    }
    
    return query.orderBy(desc(bgpAlerts.createdAt));
  }
  ```
- **Type Safety:** Full TypeScript types inferred from schema
- **Query Building:** Drizzle's type-safe query builder

---

## 4. Data Architecture

### 4.1 Database Schema

The database schema is designed for normalization, performance, and extensibility:

#### 4.1.1 Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'viewer')) DEFAULT 'viewer',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_users_open_id ON users(open_id);
CREATE INDEX idx_users_role ON users(role);
```

**Purpose:** Store user accounts with role-based access control.

**Columns:**
- `id` - Auto-incrementing primary key
- `open_id` - OAuth provider identifier (unique)
- `name` - User's display name
- `email` - User's email address (optional)
- `role` - Access level (admin, operator, viewer)
- `created_at` - Unix timestamp of account creation
- `updated_at` - Unix timestamp of last update

**Indexes:**
- `open_id` - For OAuth authentication lookups
- `role` - For role-based filtering

#### 4.1.2 BGP Alerts Table

```sql
CREATE TABLE bgp_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
  prefix TEXT NOT NULL,
  as_number TEXT NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at INTEGER,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_alerts_type ON bgp_alerts(type);
CREATE INDEX idx_alerts_severity ON bgp_alerts(severity);
CREATE INDEX idx_alerts_prefix ON bgp_alerts(prefix);
CREATE INDEX idx_alerts_as_number ON bgp_alerts(as_number);
CREATE INDEX idx_alerts_acknowledged ON bgp_alerts(acknowledged);
CREATE INDEX idx_alerts_resolved ON bgp_alerts(resolved);
CREATE INDEX idx_alerts_created_at ON bgp_alerts(created_at);
```

**Purpose:** Store BGP alert history with acknowledgment and resolution tracking.

**Columns:**
- `id` - Auto-incrementing primary key
- `type` - Alert type (hijack, rpki, visibility, path, newprefix)
- `severity` - Alert severity level
- `prefix` - Affected IP prefix
- `as_number` - Involved AS number
- `description` - Human-readable alert description
- `details` - JSON string with additional context
- `acknowledged` - Whether alert has been acknowledged
- `acknowledged_by` - User who acknowledged (foreign key)
- `acknowledged_at` - Timestamp of acknowledgment
- `resolved` - Whether alert has been resolved
- `resolved_by` - User who resolved (foreign key)
- `resolved_at` - Timestamp of resolution
- `created_at` - Alert creation timestamp
- `updated_at` - Last update timestamp

**Indexes:** Comprehensive indexes on frequently queried columns for optimal performance.

#### 4.1.3 Alert Rules Table

```sql
CREATE TABLE alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rule_type TEXT NOT NULL,
  conditions TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
  notification_channels TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_rules_enabled ON alert_rules(enabled);
CREATE INDEX idx_rules_type ON alert_rules(rule_type);
CREATE INDEX idx_rules_created_by ON alert_rules(created_by);
```

**Purpose:** Store custom alert rules configured by users.

**Columns:**
- `id` - Auto-incrementing primary key
- `name` - Rule name
- `description` - Rule description
- `enabled` - Whether rule is active
- `rule_type` - Type of rule (prefix_length, as_path, rpki, custom)
- `conditions` - JSON string with rule conditions
- `severity` - Severity to assign to triggered alerts
- `notification_channels` - JSON array of channels to notify
- `created_by` - User who created rule (foreign key)
- `created_at` - Rule creation timestamp
- `updated_at` - Last update timestamp

**Indexes:** Indexes on enabled status and type for efficient rule evaluation.

#### 4.1.4 Notification Settings Table

```sql
CREATE TABLE notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teams_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  teams_webhook_url TEXT,
  slack_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  slack_webhook_url TEXT,
  discord_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  discord_webhook_url TEXT,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  severity_filter TEXT NOT NULL DEFAULT '["critical","warning","info"]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

**Purpose:** Store webhook URLs and notification preferences (singleton table).

**Columns:**
- `id` - Primary key (always 1)
- `teams_enabled` - Microsoft Teams notifications enabled
- `teams_webhook_url` - Encrypted Teams webhook URL
- `slack_enabled` - Slack notifications enabled
- `slack_webhook_url` - Encrypted Slack webhook URL
- `discord_enabled` - Discord notifications enabled
- `discord_webhook_url` - Encrypted Discord webhook URL
- `email_enabled` - Email notifications enabled
- `severity_filter` - JSON array of severities to notify
- `created_at` - Settings creation timestamp
- `updated_at` - Last update timestamp

**Security:** Webhook URLs are encrypted before storage using AES-256-GCM.

#### 4.1.5 Performance Metrics Table

```sql
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL,
  metric_value REAL NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_metrics_timestamp ON performance_metrics(timestamp);
```

**Purpose:** Store time-series performance data for visualization.

**Columns:**
- `id` - Auto-incrementing primary key
- `metric_type` - Type of metric (bgp_updates, api_latency, cpu_usage, memory_usage, alert_count)
- `metric_value` - Numeric metric value
- `timestamp` - Measurement timestamp

**Indexes:** Indexes on type and timestamp for efficient time-series queries.

#### 4.1.6 Prefix Ownership Table

```sql
CREATE TABLE prefix_ownership (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT NOT NULL UNIQUE,
  expected_asn TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_prefix_ownership_prefix ON prefix_ownership(prefix);
CREATE INDEX idx_prefix_ownership_asn ON prefix_ownership(expected_asn);
```

**Purpose:** Store expected prefix-to-ASN mappings for hijack detection.

**Columns:**
- `id` - Auto-incrementing primary key
- `prefix` - IP prefix in CIDR notation (unique)
- `expected_asn` - Expected announcing AS number
- `description` - Optional description
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

**Indexes:** Indexes on prefix and ASN for fast lookups.

#### 4.1.7 Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
```

**Purpose:** Track all configuration changes for compliance and troubleshooting.

**Columns:**
- `id` - Auto-incrementing primary key
- `user_id` - User who performed action (foreign key)
- `action` - Action performed (create, update, delete, acknowledge, resolve)
- `resource_type` - Type of resource affected (alert, rule, settings)
- `resource_id` - ID of affected resource
- `details` - JSON string with action details
- `ip_address` - Client IP address
- `user_agent` - Client user agent
- `created_at` - Action timestamp

**Indexes:** Comprehensive indexes for audit trail queries.

### 4.2 Data Relationships

The schema implements the following relationships:

**One-to-Many Relationships:**
- Users → BGP Alerts (acknowledged_by, resolved_by)
- Users → Alert Rules (created_by)
- Users → Audit Logs (user_id)

**Referential Integrity:**
- Foreign key constraints enforce relationships
- Cascade rules prevent orphaned records
- Nullable foreign keys for optional relationships (acknowledged_by, resolved_by)

### 4.3 Data Migration Strategy

The system uses Drizzle Kit for schema migrations:

**Migration Process:**
1. Define schema changes in `drizzle/schema.ts`
2. Generate migration: `pnpm drizzle-kit generate`
3. Review generated SQL in `drizzle/migrations/`
4. Apply migration: `pnpm drizzle-kit migrate`

**Migration Files:** Each migration is timestamped and includes both up and down migrations for rollback capability.

**Production Migrations:** The deployment script automatically runs pending migrations before starting the application.

### 4.4 Data Retention Policy

The system implements the following retention policies:

**BGP Alerts:** Retained indefinitely by default. Administrators can configure automatic purging of resolved alerts older than N days.

**Performance Metrics:** Retained for 90 days. Older metrics are automatically purged by a scheduled job.

**Audit Logs:** Retained for 1 year for compliance. Older logs are archived to external storage before deletion.

**Webhook URLs:** Encrypted at rest. Rotation recommended every 90 days.

---

## 5. API Design

### 5.1 API Architecture

The system uses tRPC (TypeScript Remote Procedure Call) instead of traditional REST, providing several advantages:

**Type Safety:** Full end-to-end type safety from client to server. TypeScript types are automatically inferred on the client side, eliminating the need for manual type definitions or code generation.

**Developer Experience:** No need to write API documentation manually. The API is self-documenting through TypeScript types. IDE autocomplete works seamlessly for all API calls.

**Performance:** Efficient batching of multiple requests into a single HTTP call. Automatic request deduplication reduces network overhead.

**Error Handling:** Type-safe error handling with discriminated unions. Errors include proper HTTP status codes and structured error messages.

### 5.2 API Structure

The API is organized into logical routers:

```typescript
export const appRouter = router({
  auth: authRouter,
  alerts: alertsRouter,
  rules: rulesRouter,
  notifications: notificationsRouter,
  performance: performanceRouter,
  routing: routingRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
```

Each router groups related procedures:

### 5.3 Authentication Procedures

**auth.me**
- **Type:** Query
- **Authentication:** Public (returns null if not authenticated)
- **Purpose:** Get current user information
- **Input:** None
- **Output:** `User | null`
- **Example:**
  ```typescript
  const { data: user } = trpc.auth.me.useQuery();
  ```

**auth.logout**
- **Type:** Mutation
- **Authentication:** Protected (requires authentication)
- **Purpose:** Logout and clear session
- **Input:** None
- **Output:** `{ success: boolean }`
- **Example:**
  ```typescript
  const logout = trpc.auth.logout.useMutation();
  await logout.mutateAsync();
  ```

### 5.4 Alerts Procedures

**alerts.list**
- **Type:** Query
- **Authentication:** Protected
- **Purpose:** List alerts with filtering and pagination
- **Input:**
  ```typescript
  {
    severity?: 'critical' | 'warning' | 'info';
    type?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
  ```
- **Output:** `{ alerts: Alert[], total: number }`
- **Example:**
  ```typescript
  const { data } = trpc.alerts.list.useQuery({
    severity: 'critical',
    acknowledged: false,
    limit: 50,
  });
  ```

**alerts.acknowledge**
- **Type:** Mutation
- **Authentication:** Protected (operator or admin role)
- **Purpose:** Acknowledge an alert
- **Input:** `{ id: number }`
- **Output:** `Alert`
- **Side Effects:** Updates alert, creates audit log, may trigger notifications
- **Example:**
  ```typescript
  const acknowledge = trpc.alerts.acknowledge.useMutation();
  await acknowledge.mutateAsync({ id: 123 });
  ```

**alerts.resolve**
- **Type:** Mutation
- **Authentication:** Protected (admin role only)
- **Purpose:** Resolve an alert
- **Input:** `{ id: number }`
- **Output:** `Alert`
- **Side Effects:** Updates alert, creates audit log
- **Example:**
  ```typescript
  const resolve = trpc.alerts.resolve.useMutation();
  await resolve.mutateAsync({ id: 123 });
  ```

**alerts.stats**
- **Type:** Query
- **Authentication:** Protected
- **Purpose:** Get alert statistics
- **Input:** `{ startDate?: Date, endDate?: Date }`
- **Output:**
  ```typescript
  {
    total: number;
    bySeverity: { critical: number; warning: number; info: number };
    byType: Record<string, number>;
    acknowledged: number;
    resolved: number;
  }
  ```
- **Example:**
  ```typescript
  const { data: stats } = trpc.alerts.stats.useQuery({
    startDate: new Date('2024-01-01'),
  });
  ```

### 5.5 Rules Procedures

**rules.list**
- **Type:** Query
- **Authentication:** Protected
- **Purpose:** List all alert rules
- **Input:** None
- **Output:** `AlertRule[]`
- **Example:**
  ```typescript
  const { data: rules } = trpc.rules.list.useQuery();
  ```

**rules.create**
- **Type:** Mutation
- **Authentication:** Protected (admin role only)
- **Purpose:** Create new alert rule
- **Input:**
  ```typescript
  {
    name: string;
    description?: string;
    ruleType: string;
    conditions: object;
    severity: 'critical' | 'warning' | 'info';
    notificationChannels?: string[];
  }
  ```
- **Output:** `AlertRule`
- **Validation:** Zod schema validates rule structure
- **Side Effects:** Creates audit log
- **Example:**
  ```typescript
  const createRule = trpc.rules.create.useMutation();
  await createRule.mutateAsync({
    name: 'Prefix Length Change',
    ruleType: 'prefix_length',
    conditions: { maxLength: 24 },
    severity: 'warning',
  });
  ```

**rules.update**
- **Type:** Mutation
- **Authentication:** Protected (admin role only)
- **Purpose:** Update existing rule
- **Input:** `{ id: number, ...updateFields }`
- **Output:** `AlertRule`
- **Side Effects:** Updates rule, creates audit log
- **Example:**
  ```typescript
  const updateRule = trpc.rules.update.useMutation();
  await updateRule.mutateAsync({
    id: 123,
    enabled: false,
  });
  ```

**rules.delete**
- **Type:** Mutation
- **Authentication:** Protected (admin role only)
- **Purpose:** Delete alert rule
- **Input:** `{ id: number }`
- **Output:** `{ success: boolean }`
- **Side Effects:** Deletes rule, creates audit log
- **Example:**
  ```typescript
  const deleteRule = trpc.rules.delete.useMutation();
  await deleteRule.mutateAsync({ id: 123 });
  ```

### 5.6 Notifications Procedures

**notifications.getSettings**
- **Type:** Query
- **Authentication:** Protected
- **Purpose:** Get notification settings
- **Input:** None
- **Output:**
  ```typescript
  {
    teamsEnabled: boolean;
    slackEnabled: boolean;
    discordEnabled: boolean;
    emailEnabled: boolean;
    severityFilter: ('critical' | 'warning' | 'info')[];
  }
  ```
- **Security:** Webhook URLs are not returned (encrypted in database)
- **Example:**
  ```typescript
  const { data: settings } = trpc.notifications.getSettings.useQuery();
  ```

**notifications.updateSettings**
- **Type:** Mutation
- **Authentication:** Protected (admin role only)
- **Purpose:** Update notification settings
- **Input:**
  ```typescript
  {
    teamsEnabled?: boolean;
    teamsWebhookUrl?: string;
    slackEnabled?: boolean;
    slackWebhookUrl?: string;
    discordEnabled?: boolean;
    discordWebhookUrl?: string;
    emailEnabled?: boolean;
    severityFilter?: ('critical' | 'warning' | 'info')[];
  }
  ```
- **Output:** `NotificationSettings`
- **Security:** Webhook URLs are encrypted before storage
- **Side Effects:** Updates settings, creates audit log
- **Example:**
  ```typescript
  const updateSettings = trpc.notifications.updateSettings.useMutation();
  await updateSettings.mutateAsync({
    teamsEnabled: true,
    teamsWebhookUrl: 'https://outlook.office.com/webhook/...',
    severityFilter: ['critical', 'warning'],
  });
  ```

**notifications.testWebhook**
- **Type:** Mutation
- **Authentication:** Protected (admin role only)
- **Purpose:** Send test notification to verify configuration
- **Input:** `{ channel: 'teams' | 'slack' | 'discord' }`
- **Output:** `{ success: boolean, error?: string }`
- **Example:**
  ```typescript
  const testWebhook = trpc.notifications.testWebhook.useMutation();
  const result = await testWebhook.mutateAsync({ channel: 'teams' });
  ```

### 5.7 Error Handling

tRPC provides structured error handling with proper HTTP status codes:

**Error Codes:**
- `BAD_REQUEST` (400) - Invalid input
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `INTERNAL_SERVER_ERROR` (500) - Server error

**Error Structure:**
```typescript
{
  message: string;
  code: TRPCErrorCode;
  data?: {
    zodError?: ZodError; // For validation errors
    cause?: unknown;     // Original error
  };
}
```

**Client-Side Error Handling:**
```typescript
const createAlert = trpc.alerts.create.useMutation({
  onError: (error) => {
    if (error.data?.code === 'BAD_REQUEST') {
      toast.error('Invalid alert data');
    } else if (error.data?.code === 'UNAUTHORIZED') {
      router.push('/login');
    } else {
      toast.error('Failed to create alert');
    }
  },
});
```

### 5.8 API Performance

**Request Batching:** tRPC automatically batches multiple requests made within the same tick into a single HTTP request, reducing network overhead.

**Request Deduplication:** Identical queries made simultaneously are deduplicated, with all callers receiving the same result.

**Caching:** React Query (used by tRPC) provides automatic caching with configurable stale times and cache invalidation.

**Optimistic Updates:** Mutations can update the cache optimistically before the server responds, providing instant UI feedback.

---

## 6. Security Architecture

### 6.1 Authentication Design

The system implements a robust authentication mechanism using OAuth 2.0 with JWT tokens:

**Authentication Flow:**

1. **User initiates login** - User clicks login button, redirected to OAuth provider (Manus OAuth)
2. **OAuth authorization** - User authenticates with OAuth provider
3. **Callback handling** - OAuth provider redirects to `/api/oauth/callback` with authorization code
4. **Token exchange** - Server exchanges authorization code for access token
5. **User creation/lookup** - Server creates or retrieves user record based on OAuth identifier
6. **Session creation** - Server generates JWT token containing user ID and role
7. **Cookie setting** - JWT token stored in secure HTTP-only cookie
8. **Client authentication** - Subsequent requests include cookie, server validates JWT

**JWT Token Structure:**
```typescript
{
  userId: number;
  openId: string;
  role: 'admin' | 'operator' | 'viewer';
  iat: number; // Issued at
  exp: number; // Expiration (24 hours)
}
```

**Security Features:**
- **HTTP-only cookies** - Prevents XSS attacks from accessing tokens
- **Secure flag** - Cookies only sent over HTTPS in production
- **SameSite=Strict** - Prevents CSRF attacks
- **Short expiration** - Tokens expire after 24 hours
- **Token signing** - JWT tokens signed with secret key

### 6.2 Authorization Design

The system implements role-based access control (RBAC) with three roles:

**Role Definitions:**

| Role | Permissions |
|------|------------|
| **Viewer** | View dashboard, alerts, rules, metrics (read-only) |
| **Operator** | Viewer permissions + acknowledge alerts |
| **Admin** | Operator permissions + create/edit/delete rules, configure notifications, manage users |

**Authorization Enforcement:**

**Backend (tRPC Procedures):**
```typescript
// Protected procedure - requires authentication
const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Admin procedure - requires admin role
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});
```

**Frontend (UI Components):**
```typescript
const { user } = useAuth();

// Conditional rendering based on role
{user?.role === 'admin' && (
  <Button onClick={handleDelete}>Delete Rule</Button>
)}

// Conditional navigation
{['admin', 'operator'].includes(user?.role) && (
  <NavLink to="/administration">Administration</NavLink>
)}
```

### 6.3 Input Validation

All user inputs are validated at multiple layers:

**Client-Side Validation:**
- HTML5 form validation (required, pattern, min, max)
- React Hook Form validation rules
- Immediate user feedback

**API Layer Validation:**
- Zod schemas for all tRPC procedure inputs
- Type-safe validation with detailed error messages
- Automatic type inference

**Example Zod Schema:**
```typescript
const createAlertSchema = z.object({
  type: z.enum(['hijack', 'rpki', 'visibility', 'path', 'newprefix']),
  severity: z.enum(['critical', 'warning', 'info']),
  prefix: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/),
  asNumber: z.string().regex(/^AS\d+$/),
  description: z.string().min(1).max(500),
});
```

**Database Layer Validation:**
- CHECK constraints on enum columns
- NOT NULL constraints on required columns
- UNIQUE constraints on unique fields
- Foreign key constraints for referential integrity

### 6.4 SQL Injection Prevention

The system prevents SQL injection through multiple mechanisms:

**Parameterized Queries:** All database queries use parameterized statements through Drizzle ORM, which automatically escapes user input.

**ORM Usage:** Drizzle ORM provides a type-safe query builder that generates parameterized SQL, eliminating the need for raw SQL in most cases.

**Raw SQL Restrictions:** Raw SQL is only used for complex queries that benefit from manual optimization, and always with parameterized values:

```typescript
// Safe raw SQL with parameters
await db.execute(
  sql`SELECT * FROM bgp_alerts WHERE prefix = ${prefix} AND severity = ${severity}`
);
```

### 6.5 XSS Prevention

Cross-site scripting (XSS) attacks are prevented through:

**Automatic Escaping:** React automatically escapes all content rendered in JSX, preventing injection of malicious scripts.

**No Dangerous HTML:** The codebase does not use `dangerouslySetInnerHTML` or similar mechanisms that bypass React's escaping.

**Content Security Policy:** The system recommends configuring CSP headers in production:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;
```

### 6.6 CSRF Prevention

Cross-site request forgery (CSRF) attacks are prevented through:

**SameSite Cookies:** Session cookies use `SameSite=Strict` attribute, preventing cross-site requests from including the cookie.

**Origin Validation:** The server validates the Origin and Referer headers for state-changing requests.

**Token Validation:** For sensitive operations, the system can implement additional CSRF tokens if needed.

### 6.7 Secrets Management

Sensitive data is managed securely:

**Environment Variables:** All secrets (JWT secret, database credentials, API keys) are stored in environment variables, never in code.

**Webhook URL Encryption:** Webhook URLs are encrypted before storage in the database using AES-256-GCM:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**No Secrets in Logs:** Sensitive data is never logged. Webhook URLs are truncated in logs.

**No Secrets in Version Control:** `.gitignore` excludes `.env` files and other sensitive files.

### 6.8 HTTPS Configuration

The system supports HTTPS through Nginx reverse proxy:

**Recommended Configuration:**
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS header (Strict-Transport-Security)
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

**Certificate Management:**
- Let's Encrypt for free SSL certificates
- Automatic renewal with Certbot
- Certificate expiry monitoring

See `docs/HTTPS_SETUP.md` for detailed configuration instructions.

### 6.9 Rate Limiting

The system implements rate limiting to prevent abuse:

**Nginx Rate Limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=dashboard_limit:10m rate=10r/s;

location / {
    limit_req zone=dashboard_limit burst=20 nodelay;
    # ... proxy configuration
}
```

**Application Rate Limiting:** Future enhancement to implement per-user rate limiting at the application layer.

### 6.10 Security Headers

Recommended security headers for production:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 7. Integration Architecture

### 7.1 BGPalerter Integration

The dashboard integrates with BGPalerter through its REST API:

**Integration Characteristics:**
- **Read-only** - Never modifies BGPalerter configuration or data
- **Non-invasive** - Does not require BGPalerter modifications
- **Resilient** - Gracefully handles BGPalerter unavailability
- **Automatic discovery** - Reads configuration from BGPalerter's config.yml

**API Endpoints Used:**

| Endpoint | Method | Purpose | Polling Interval |
|----------|--------|---------|------------------|
| `/api/v1/status` | GET | System status, uptime, version | 30 seconds |
| `/api/v1/monitors` | GET | List of active monitors | 30 seconds |
| `/api/v1/alerts` | GET | Recent alerts | 30 seconds |

**Configuration Discovery:**

The dashboard reads BGPalerter's configuration file to automatically detect:
- API port (default: 8011)
- API host (default: 127.0.0.1)
- Monitored prefixes
- Email notification settings

**Error Handling:**

When BGPalerter is unavailable, the dashboard:
1. Logs warning with connection details
2. Returns default/empty values to UI
3. Displays "BGPalerter Unavailable" status
4. Continues attempting connection at regular intervals
5. Automatically recovers when BGPalerter becomes available

**Configuration File Location:**

The dashboard looks for BGPalerter's configuration in:
1. Environment variable `BGPALERTER_CONFIG_PATH`
2. Default path: `/home/ubuntu/BGPalerter/config/config.yml`

### 7.2 RIPE RIS Integration

The dashboard integrates with RIPE RIS (Routing Information Service) for route-collector data:

**API Endpoint:** `https://stat.ripe.net/data/`

**Data Retrieved:**
- **Routing data** - BGP announcements for specific prefixes
- **AS information** - AS details, peering information
- **Route collectors** - List of active route collectors

**Caching Strategy:**

RIS data is cached for 5 minutes to reduce API load:
```typescript
const RIS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { data: any; timestamp: number }>();

async function getRISData(prefix: string): Promise<RISData> {
  const cacheKey = `ris:${prefix}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < RIS_CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFromRIS(prefix);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

**Rate Limiting:**

The dashboard respects RIS API rate limits:
- Maximum 100 requests per minute
- Automatic backoff on rate limit errors
- Request queuing to prevent limit violations

**Error Handling:**

When RIS API is unavailable:
1. Log warning with error details
2. Return cached data if available
3. Display error message to user
4. Retry with exponential backoff

### 7.3 Webhook Integrations

The dashboard sends notifications to multiple platforms via webhooks:

#### 7.3.1 Microsoft Teams Integration

**Webhook Format:** Adaptive Cards

**Message Structure:**
```json
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "type": "AdaptiveCard",
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.4",
        "body": [
          {
            "type": "TextBlock",
            "text": "🚨 BGP Alert: Hijack Detected",
            "weight": "Bolder",
            "size": "Large"
          },
          {
            "type": "FactSet",
            "facts": [
              { "title": "Severity", "value": "Critical" },
              { "title": "Prefix", "value": "203.0.113.0/24" },
              { "title": "AS Number", "value": "AS58173" },
              { "title": "Time", "value": "2024-12-19 15:30:45" }
            ]
          },
          {
            "type": "TextBlock",
            "text": "Unauthorized announcement detected for prefix 203.0.113.0/24",
            "wrap": true
          }
        ]
      }
    }
  ]
}
```

**Color Coding:**
- Critical: Red (#FF0000)
- Warning: Orange (#FFA500)
- Info: Blue (#0078D4)

#### 7.3.2 Slack Integration

**Webhook Format:** Block Kit

**Message Structure:**
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 BGP Alert: Hijack Detected"
      }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Severity:*\nCritical" },
        { "type": "mrkdwn", "text": "*Prefix:*\n203.0.113.0/24" },
        { "type": "mrkdwn", "text": "*AS Number:*\nAS58173" },
        { "type": "mrkdwn", "text": "*Time:*\n2024-12-19 15:30:45" }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Description:*\nUnauthorized announcement detected for prefix 203.0.113.0/24"
      }
    }
  ]
}
```

#### 7.3.3 Discord Integration

**Webhook Format:** Embeds

**Message Structure:**
```json
{
  "embeds": [
    {
      "title": "🚨 BGP Alert: Hijack Detected",
      "color": 16711680,
      "fields": [
        { "name": "Severity", "value": "Critical", "inline": true },
        { "name": "Prefix", "value": "203.0.113.0/24", "inline": true },
        { "name": "AS Number", "value": "AS58173", "inline": true },
        { "name": "Time", "value": "2024-12-19 15:30:45", "inline": true },
        { "name": "Description", "value": "Unauthorized announcement detected for prefix 203.0.113.0/24" }
      ],
      "timestamp": "2024-12-19T15:30:45.000Z"
    }
  ]
}
```

**Color Codes:**
- Critical: 16711680 (red)
- Warning: 16753920 (orange)
- Info: 3447003 (blue)

#### 7.3.4 Webhook Delivery

**Retry Logic:**

```typescript
async function sendWebhook(url: string, payload: object): Promise<boolean> {
  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF = 1000; // 1 second
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 10000, // 10 seconds
      });
      
      if (response.ok) {
        logger.info('Webhook sent successfully', { url: url.substring(0, 50) });
        return true;
      }
      
      if (response.status >= 500) {
        // Server error, retry
        const backoff = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
        logger.warn('Webhook server error, retrying', { status: response.status, attempt, backoff });
        await sleep(backoff);
        continue;
      }
      
      // Client error (4xx), don't retry
      logger.error('Webhook client error', { status: response.status, body: await response.text() });
      return false;
      
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        logger.error('Webhook delivery failed after retries', { error, attempts: MAX_RETRIES });
        return false;
      }
      
      const backoff = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
      logger.warn('Webhook delivery error, retrying', { error, attempt, backoff });
      await sleep(backoff);
    }
  }
  
  return false;
}
```

**Delivery Guarantees:**
- At-least-once delivery (may deliver duplicates on retry)
- Asynchronous delivery (doesn't block alert creation)
- Failure logging for manual review

### 7.4 Email Integration

The dashboard integrates with BGPalerter's email notification system:

**Integration Method:** Email parsing

**Process:**
1. BGPalerter sends email notifications (configured in BGPalerter)
2. Dashboard polls BGPalerter API for alerts
3. Dashboard parses alert details from API response
4. Dashboard stores alerts in database
5. Dashboard triggers webhook notifications based on settings

**Email Formats Supported:**
- Hijack alerts
- RPKI validation failures
- Visibility alerts
- AS path changes
- New prefix announcements

---

## 8. Deployment Architecture

### 8.1 Deployment Model

The system is designed for single-server deployment typical of ISP network monitoring environments:

```
┌─────────────────────────────────────────────────────────┐
│                    Production Server                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Nginx (Port 80/443)                                │ │
│  │  - HTTPS termination                                │ │
│  │  - Reverse proxy                                    │ │
│  │  - Static file serving                              │ │
│  │  - Rate limiting                                    │ │
│  └────────────────┬───────────────────────────────────┘ │
│                   │                                      │
│                   ↓                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  BGPalerter Dashboard (Port 3000)                   │ │
│  │  - Node.js + Express                                │ │
│  │  - React frontend (served as static files)          │ │
│  │  - tRPC API                                         │ │
│  │  - PM2 process manager                              │ │
│  └────────────────┬───────────────────────────────────┘ │
│                   │                                      │
│                   ↓                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  SQLite Database                                    │ │
│  │  - database.sqlite                                  │ │
│  │  - Automatic backups                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  BGPalerter (Port 8011)                             │ │
│  │  - Existing installation                            │ │
│  │  - Not modified by dashboard                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Process Management

The dashboard uses PM2 for production process management:

**PM2 Configuration** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'bgpalerter-dashboard',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
  }],
};
```

**PM2 Features Used:**
- Automatic restart on crashes
- Memory limit enforcement (500MB)
- Log rotation
- Startup script generation
- Process monitoring

**PM2 Commands:**
```bash
# Start dashboard
pm2 start ecosystem.config.js

# Restart dashboard
pm2 restart bgpalerter-dashboard

# View logs
pm2 logs bgpalerter-dashboard

# Monitor resources
pm2 monit

# View detailed info
pm2 describe bgpalerter-dashboard
```

### 8.3 Automated Deployment

The system includes comprehensive deployment automation:

**Deployment Script** (`scripts/deploy-safe.sh`):

**10-Step Deployment Process:**
1. **Pre-deployment checks** - Verify prerequisites
2. **Backup creation** - Automatic timestamped backup
3. **Directory setup** - Create installation directory
4. **File copying** - Copy dashboard files
5. **Dependency installation** - `pnpm install`
6. **Environment configuration** - Auto-configure from BGPalerter
7. **Database migration** - Run pending migrations
8. **Build** - `pnpm build`
9. **PM2 configuration** - Start/restart with PM2
10. **Helper scripts** - Create operational scripts

**Safety Features:**
- User confirmation before changes
- Automatic backups before deployment
- Rollback script available
- Pre-deployment validation
- Non-destructive (never modifies BGPalerter)

**Pre-Deployment Validation** (`scripts/pre-deploy-check.sh`):

**10 Validation Checks:**
1. BGPalerter installation exists
2. BGPalerter API is accessible
3. Node.js version ≥ 18
4. pnpm is installed
5. PM2 is installed
6. Port 3000 is available
7. Sufficient disk space (≥ 2GB)
8. Write permissions
9. Network connectivity
10. Dashboard files present

**Rollback Script** (`scripts/rollback.sh`):

**Rollback Process:**
1. User selects backup to restore
2. Stop dashboard
3. Restore files from backup
4. Restart dashboard
5. Verify functionality

### 8.4 Directory Structure

**Production Directory Layout:**
```
/home/ubuntu/
├── BGPalerter/                    # Existing BGPalerter (not touched)
│   ├── config/
│   │   └── config.yml
│   ├── src/
│   ├── logs/
│   └── cache/
├── bgpalerter-dashboard/          # Dashboard installation
│   ├── client/                    # Frontend source
│   ├── server/                    # Backend source
│   ├── dist/                      # Built files
│   │   ├── public/                # Static frontend
│   │   └── index.js               # Backend bundle
│   ├── database.sqlite            # Database file
│   ├── logs/                      # Application logs
│   ├── ecosystem.config.js        # PM2 config
│   └── package.json
├── server-scripts/                # Helper scripts
│   ├── dashboard-status.sh
│   ├── dashboard-restart.sh
│   └── dashboard-logs.sh
└── bgpalerter-dashboard-backups/  # Automatic backups
    ├── backup-2024-12-19-10-30/
    ├── backup-2024-12-19-14-15/
    └── backup-2024-12-19-18-45/
```

### 8.5 Environment Configuration

**Environment Variables:**

The dashboard uses the following environment variables:

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `NODE_ENV` | Environment mode | development | No |
| `PORT` | HTTP server port | 3000 | No |
| `BGPALERTER_API_URL` | BGPalerter API URL | http://127.0.0.1:8011 | No |
| `BGPALERTER_CONFIG_PATH` | BGPalerter config path | ~/BGPalerter/config | No |
| `DATABASE_URL` | Database file path | ./database.sqlite | No |
| `JWT_SECRET` | JWT signing secret | (auto-generated) | Yes |
| `ENCRYPTION_KEY` | Webhook URL encryption key | (auto-generated) | Yes |
| `LOG_LEVEL` | Logging level | info | No |

**Auto-Configuration:**

The deployment script automatically:
1. Reads BGPalerter's config.yml
2. Detects API port
3. Generates secure secrets
4. Creates .env file
5. Validates configuration

### 8.6 Logging Configuration

**Log Files:**
- `logs/out.log` - Standard output (info, debug)
- `logs/error.log` - Error output (warn, error)
- `logs/access.log` - HTTP access log (Nginx)

**Log Rotation:**
- PM2 automatic log rotation
- Maximum 10 files per log type
- Maximum 10MB per file
- Compressed old logs

**Log Format:**
```
[2024-12-19T15:30:45.123Z] [INFO] Alert created {"alertId":123,"type":"hijack","severity":"critical","userId":1}
```

### 8.7 Backup Strategy

**Automatic Backups:**
- Created before each deployment
- Timestamped directories
- Include all files except node_modules
- Retained for 30 days

**Manual Backups:**
```bash
# Create manual backup
cp -r ~/bgpalerter-dashboard ~/bgpalerter-dashboard-backup-$(date +%Y%m%d-%H%M%S)

# Backup database only
cp ~/bgpalerter-dashboard/database.sqlite ~/database-backup-$(date +%Y%m%d-%H%M%S).sqlite
```

**Backup Contents:**
- Application files
- Database file
- Configuration files
- Logs (optional)

---

## 9. Performance Design

### 9.1 Frontend Performance

**Bundle Optimization:**
- Code splitting with Vite
- Tree shaking for unused code
- Minification and compression
- Asset optimization

**React Performance:**
- Memoization with `useMemo` and `useCallback`
- Component lazy loading
- Efficient re-render prevention
- Virtual scrolling for long lists (future enhancement)

**Caching Strategy:**
- React Query automatic caching
- Stale-while-revalidate pattern
- Configurable cache times per query

**Example Cache Configuration:**
```typescript
const { data: alerts } = trpc.alerts.list.useQuery(filters, {
  staleTime: 30000, // Consider fresh for 30 seconds
  cacheTime: 300000, // Keep in cache for 5 minutes
  refetchOnWindowFocus: true,
  refetchInterval: 30000, // Auto-refresh every 30 seconds
});
```

### 9.2 Backend Performance

**Database Optimization:**
- Comprehensive indexes on frequently queried columns
- Query optimization with EXPLAIN
- Connection pooling (Drizzle default)
- Prepared statements for repeated queries

**API Performance:**
- Request batching (tRPC automatic)
- Request deduplication (tRPC automatic)
- Asynchronous processing (async/await)
- Non-blocking I/O (Node.js default)

**Caching:**
- RIS data cached for 5 minutes
- BGPalerter status cached for 30 seconds (via React Query)
- Future: Redis for distributed caching

### 9.3 Database Performance

**Index Strategy:**

All frequently queried columns are indexed:
- `bgp_alerts`: type, severity, prefix, as_number, acknowledged, resolved, created_at
- `alert_rules`: enabled, rule_type, created_by
- `users`: open_id, role
- `performance_metrics`: metric_type, timestamp
- `prefix_ownership`: prefix, expected_asn

**Query Optimization:**

Complex queries are optimized:
```sql
-- Efficient alert statistics query
SELECT 
  severity,
  COUNT(*) as count
FROM bgp_alerts
WHERE created_at >= ?
GROUP BY severity;

-- Uses index on created_at and severity
```

**Database Maintenance:**

SQLite maintenance tasks:
- VACUUM weekly (reclaim space)
- ANALYZE monthly (update statistics)
- Integrity check monthly

### 9.4 Network Performance

**HTTP/2:**
- Nginx configured for HTTP/2
- Multiplexing reduces latency
- Header compression

**Compression:**
- Gzip compression for text assets
- Brotli compression (future enhancement)
- Appropriate compression levels

**CDN (Future Enhancement):**
- Static assets served from CDN
- Reduced latency for global users
- Improved availability

### 9.5 Performance Monitoring

**Metrics Collected:**
- BGP update rate
- API response time
- Database query time
- Memory usage
- CPU usage
- Alert frequency

**Performance Targets:**

| Metric | Target | Current |
|--------|--------|---------|
| Page load time | < 2s | ~1.5s |
| API response time | < 200ms | ~100ms |
| Database query time | < 50ms | ~20ms |
| Memory usage | < 500MB | ~150MB |
| CPU usage (idle) | < 5% | ~2% |

---

## 10. Monitoring & Observability

### 10.1 Logging Strategy

The system implements structured logging with multiple levels:

**Log Levels:**
- **DEBUG** - Detailed flow information for development
- **INFO** - Normal operational events
- **WARN** - Recoverable issues that don't prevent operation
- **ERROR** - Unrecoverable errors requiring attention

**Structured Logging Format:**
```typescript
logger.info('Alert created', {
  alertId: alert.id,
  type: alert.type,
  severity: alert.severity,
  prefix: alert.prefix,
  asNumber: alert.asNumber,
  userId: ctx.user.id,
  duration: Date.now() - startTime,
});
```

**Log Aggregation:**

Logs are written to files and can be aggregated with external tools:
- PM2 log management
- Syslog integration (future)
- Elastic Stack integration (future)
- CloudWatch Logs (future)

### 10.2 Error Tracking

**Error Logging:**

All errors are logged with full context:
```typescript
try {
  await sendWebhook(url, payload);
} catch (error) {
  logger.error('Webhook delivery failed', {
    channel: 'teams',
    webhookUrl: url.substring(0, 50) + '...',
    error: error.message,
    stack: error.stack,
    alertId: alert.id,
    retryCount: attempt,
  });
}
```

**Error Monitoring (Future):**

Integration with external error tracking:
- Sentry for error aggregation
- Automatic error grouping
- Stack trace analysis
- User impact tracking

### 10.3 Performance Monitoring

**Application Metrics:**

The system collects performance metrics:
- Request duration
- Database query time
- External API latency
- Memory usage
- CPU usage

**Metrics Storage:**

Metrics are stored in the `performance_metrics` table for visualization in the dashboard.

**External Monitoring (Future):**

Integration with monitoring platforms:
- Prometheus for metrics collection
- Grafana for visualization
- DataDog for APM
- New Relic for full-stack monitoring

### 10.4 Health Checks

**Application Health:**

PM2 monitors application health:
- Process running status
- Memory usage
- CPU usage
- Restart count

**Dependency Health:**

The dashboard monitors dependencies:
- BGPalerter API availability
- Database connectivity
- External API availability (RIS, webhooks)

**Health Check Endpoint (Future):**

```typescript
// GET /api/health
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  version: '3.4.0',
  uptime: 86400,
  dependencies: {
    bgpalerter: { status: 'healthy', latency: 50 },
    database: { status: 'healthy', latency: 5 },
    ris: { status: 'healthy', latency: 200 },
  },
}
```

### 10.5 Alerting

**Current Alerting:**

The dashboard sends notifications for BGP events. Future enhancements include:

**System Alerting (Future):**
- Dashboard downtime alerts
- High error rate alerts
- Performance degradation alerts
- Disk space alerts
- Memory usage alerts

**Alert Channels:**
- Email
- Webhooks (Teams, Slack, Discord)
- SMS (future)
- PagerDuty (future)

---

## 11. Disaster Recovery

### 11.1 Backup Strategy

**Automated Backups:**

The deployment script creates automatic backups:
- Before each deployment
- Timestamped directories
- Full application backup
- Retained for 30 days

**Database Backups:**

SQLite database is backed up:
- Before deployments
- Daily scheduled backups (recommended)
- Offsite backup recommended

**Backup Script:**
```bash
#!/bin/bash
# Daily backup script (add to cron)

BACKUP_DIR="/home/ubuntu/bgpalerter-dashboard-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_FILE="/home/ubuntu/bgpalerter-dashboard/database.sqlite"

# Create backup
mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/database-$TIMESTAMP.sqlite"

# Compress
gzip "$BACKUP_DIR/database-$TIMESTAMP.sqlite"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "database-*.sqlite.gz" -mtime +30 -delete

echo "Backup completed: database-$TIMESTAMP.sqlite.gz"
```

**Cron Configuration:**
```bash
# Daily backup at 2 AM
0 2 * * * /home/ubuntu/server-scripts/backup-database.sh
```

### 11.2 Recovery Procedures

**Application Recovery:**

If the dashboard fails:
1. Check PM2 status: `pm2 list`
2. View logs: `pm2 logs bgpalerter-dashboard`
3. Restart: `pm2 restart bgpalerter-dashboard`
4. If restart fails, rollback: `bash scripts/rollback.sh`

**Database Recovery:**

If database is corrupted:
1. Stop dashboard: `pm2 stop bgpalerter-dashboard`
2. Restore from backup:
   ```bash
   cp ~/bgpalerter-dashboard-backups/database-YYYYMMDD-HHMMSS.sqlite \
      ~/bgpalerter-dashboard/database.sqlite
   ```
3. Restart dashboard: `pm2 restart bgpalerter-dashboard`
4. Verify functionality

**Complete System Recovery:**

If server fails:
1. Provision new server
2. Install prerequisites (Node.js, pnpm, PM2)
3. Install BGPalerter
4. Restore dashboard from backup:
   ```bash
   tar -xzf bgpalerter-dashboard-backup.tar.gz
   cd bgpalerter-dashboard
   pnpm install
   pnpm build
   pm2 start ecosystem.config.js
   ```
5. Restore database from backup
6. Configure Nginx
7. Verify functionality

### 11.3 Recovery Time Objectives

**RTO (Recovery Time Objective):**

| Scenario | RTO | Procedure |
|----------|-----|-----------|
| Application crash | < 1 minute | PM2 automatic restart |
| Configuration error | < 5 minutes | Rollback to previous version |
| Database corruption | < 15 minutes | Restore from backup |
| Server failure | < 1 hour | Rebuild on new server |

**RPO (Recovery Point Objective):**

| Data Type | RPO | Backup Frequency |
|-----------|-----|------------------|
| BGP alerts | 0 (no loss) | Continuous (database) |
| Configuration | < 24 hours | Daily backups |
| Performance metrics | < 24 hours | Daily backups |
| Audit logs | < 24 hours | Daily backups |

### 11.4 High Availability (Future)

For high-availability deployments:

**Database Replication:**
- Migrate to PostgreSQL
- Primary-replica replication
- Automatic failover

**Application Clustering:**
- Multiple dashboard instances
- Load balancer (Nginx, HAProxy)
- Shared session storage (Redis)

**Geographic Redundancy:**
- Multi-region deployment
- DNS failover
- Data replication

---

## 12. Compliance & Standards

### 12.1 Industry Standards Compliance

The system complies with the following industry standards:

**Web Standards:**
- HTML5
- CSS3
- ECMAScript 2022+
- HTTP/1.1 and HTTP/2
- WebSocket (future)

**API Standards:**
- RESTful principles (for external integrations)
- JSON data format
- OAuth 2.0 authentication
- JWT tokens (RFC 7519)

**Security Standards:**
- OWASP Top 10 addressed
- CWE/SANS Top 25 addressed
- TLS 1.2+ for HTTPS
- Secure cookie attributes
- CSRF protection
- XSS prevention

**Database Standards:**
- SQL-92 compliance
- ACID transactions
- Referential integrity
- Normalized schema (3NF)

### 12.2 Code Quality Standards

**TypeScript Standards:**
- Strict mode enabled
- No implicit any
- Comprehensive type coverage
- ESLint for code quality
- Prettier for formatting

**React Standards:**
- Functional components
- Hooks best practices
- Props typing
- Performance optimization
- Accessibility (WCAG 2.1 AA target)

**Node.js Standards:**
- Async/await pattern
- Error handling
- Structured logging
- Security best practices
- Performance optimization

### 12.3 Testing Standards

**Test Coverage:**
- Unit tests for business logic
- Integration tests for services
- API tests for tRPC procedures
- Component tests for React (future)
- E2E tests (future)

**Test Quality:**
- Descriptive test names
- Isolated tests
- Mocking external dependencies
- Assertion clarity
- Edge case coverage

### 12.4 Documentation Standards

**Code Documentation:**
- JSDoc comments for complex functions
- README files in each major directory
- Inline comments for complex logic
- Type definitions as documentation

**User Documentation:**
- Installation guide
- Deployment guide
- Configuration guide
- Troubleshooting guide
- API reference (self-documenting via tRPC)

**Technical Documentation:**
- Architecture design (this document)
- Database schema
- API specifications
- Security architecture
- Deployment procedures

### 12.5 Accessibility Standards

**WCAG 2.1 Compliance (Target: AA):**

**Perceivable:**
- Text alternatives for images
- Color contrast ratios (4.5:1 minimum)
- Responsive design for different screen sizes
- Keyboard navigation support

**Operable:**
- Keyboard accessible
- Sufficient time for interactions
- No seizure-inducing content
- Clear navigation

**Understandable:**
- Readable text
- Predictable behavior
- Input assistance
- Error identification

**Robust:**
- Valid HTML
- Semantic markup
- ARIA labels where needed
- Cross-browser compatibility

### 12.6 Privacy & Data Protection

**Data Collection:**
- Minimal data collection
- Clear purpose for each data point
- User consent for optional data

**Data Storage:**
- Encrypted sensitive data
- Secure database
- Access controls
- Audit logging

**Data Retention:**
- Defined retention periods
- Automatic purging of old data
- User data deletion on request

**Data Sharing:**
- No third-party data sharing
- Webhook data sent only to configured channels
- Secure transmission (HTTPS)

---

## Appendix A: Glossary

**AS (Autonomous System):** A collection of IP routing prefixes under the control of one or more network operators that presents a common routing policy to the Internet.

**ASN (Autonomous System Number):** A unique identifier assigned to an Autonomous System.

**BGP (Border Gateway Protocol):** The routing protocol used to exchange routing information between autonomous systems on the Internet.

**BGPalerter:** An open-source BGP monitoring tool that detects hijacks, RPKI validation failures, and other BGP anomalies.

**CIDR (Classless Inter-Domain Routing):** A method for allocating IP addresses and routing IP packets, expressed as prefix/length (e.g., 203.0.113.0/24).

**Hijack:** Unauthorized announcement of IP prefixes by an AS that does not own them.

**JWT (JSON Web Token):** A compact, URL-safe means of representing claims to be transferred between two parties.

**OAuth:** An open standard for access delegation, commonly used for token-based authentication.

**Prefix:** A range of IP addresses expressed in CIDR notation.

**RIS (Routing Information Service):** RIPE NCC's service providing BGP routing data from multiple route collectors.

**RPKI (Resource Public Key Infrastructure):** A security framework to validate the association between AS numbers and IP address blocks.

**ROA (Route Origin Authorization):** A cryptographically signed object that states which AS is authorized to originate a particular IP prefix.

**tRPC:** A TypeScript library for building end-to-end type-safe APIs without code generation.

**Webhook:** An HTTP callback that delivers real-time information to other applications.

---

## Appendix B: References

This document references the following external resources:

1. **BGPalerter Documentation:** https://github.com/nttgin/BGPalerter
2. **RIPE RIS API:** https://stat.ripe.net/docs/data_api
3. **tRPC Documentation:** https://trpc.io/docs
4. **React Documentation:** https://react.dev/
5. **TypeScript Documentation:** https://www.typescriptlang.org/docs/
6. **Drizzle ORM Documentation:** https://orm.drizzle.team/docs/overview
7. **OWASP Top 10:** https://owasp.org/www-project-top-ten/
8. **WCAG 2.1:** https://www.w3.org/TR/WCAG21/

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Manus AI | Initial release |

---

**End of Engineering Design Document**

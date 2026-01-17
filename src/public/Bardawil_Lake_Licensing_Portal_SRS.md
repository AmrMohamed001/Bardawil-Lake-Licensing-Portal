**Software Requirements Specification**

**Bardawil Lake Licensing Portal**

جهازمستقبل مصر للتنمية المستدامة

Egypt Future Device for Sustainable Development

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Date | January 15, 2026 |
| Status | Draft |
| Author | System Analysis Team |

# Table of Contents

*(To be generated automatically in Word)*

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) document provides a comprehensive description of the Bardawil Lake Licensing Portal system. The system is designed to digitize and streamline the management of fishing licenses, boat registrations, and related permits for Lake Bardawil in Egypt.

## 1.2 Scope

The Bardawil Lake Licensing Portal will provide a bilingual (Arabic primary, English secondary) web-based system to:

-   Enable citizens to apply for fishing licenses and boat registrations online

-   Support multiple fisherman categories (صياد، صياد تحت السن، مندوب، تاجر، عامل تاجر، شيال)

-   Support multiple boat and vehicle types (مركب، سيارات، عائمة أفراد)

-   Provide government administrators with tools to review and approve applications

-   Manage payment workflow with Supply Order generation and verification

-   Configure and manage pricing for all license categories

-   Track application status throughout the approval workflow

-   Generate notifications for application updates in Arabic

-   Maintain a centralized database of licenses and permits

-   Provide public access to news and announcements related to Lake Bardawil

-   All user inputs and communications are primarily in Arabic

## 1.3 Definitions and Acronyms

  **Term**                            **Definition**
  SRS                                 Software Requirements Specification

  UI                                  User Interface

  API                                 Application Programming Interface

  PDF                                 Portable Document Format

  SMS                                 Short Message Service

  NID                                 National ID

  License                             A permit allowing fishing or boat operation on Lake Bardawil

  Application Status                  Current state of a license application (pending, under review, approved, rejected)

# 2. Overall Description

## 2.1 Product Perspective

The Bardawil Lake Licensing Portal is a standalone web-based application that serves as the primary interface between citizens, fishermen, and government administrators for managing lake-related licenses and permits. The system integrates with Egypt\'s national identity verification systems and provides bilingual support (Arabic and English).

## 2.2 Product Features

-   User authentication and registration with national ID verification

-   Multi-step license application forms with document upload

-   Application tracking with real-time status updates

-   Admin panel for reviewing and processing applications

-   Dashboard with statistics and quick actions

-   Notification system (in-app and SMS)

-   News and announcements portal

-   Document management and PDF generation

-   Bilingual interface (Arabic/English)

-   Responsive design for mobile and desktop access

## 2.3 User Classes and Characteristics

### 2.3.1 Citizens/Fishermen

-   Primary users who apply for licenses and track applications

-   May have varying levels of technical literacy

-   Require clear instructions and guidance

-   Access system occasionally (during license renewal periods)

### 2.3.2 Administrative Staff

-   Government employees who review and process applications

-   Daily system users with moderate to high technical proficiency

-   Require efficient tools for bulk processing

-   Need comprehensive reporting capabilities

### 2.3.3 System Administrators

-   IT staff responsible for system configuration and maintenance

-   High technical proficiency

-   Manage user roles, permissions, and system settings

-   Monitor system performance and security

### 2.3.4 Public Users

-   Visitors who access public information without authentication

-   View news, announcements, and general information

-   No application submission capabilities

# 3. Functional Requirements

## 3.1 User Authentication and Registration

### 3.1.1 User Registration (FR-AUTH-001)

**Description:** New users must be able to create an account using their national ID and personal information.

**Priority:** High

**Input:**

-   First Name (Arabic)

-   Last Name (Arabic)

-   National ID Number (14 digits)

-   Phone Number (Egyptian format: 05xxxxxxxx)

-   Password (minimum 8 characters)

-   Password Confirmation

-   Acceptance of Terms and Conditions

**Processing:**

-   Validate all required fields

-   Check for duplicate national ID

-   Verify password strength and match

-   Hash password using bcrypt or similar

-   Create user account in database

-   Account is immediately active (no email verification required)

**Output:** User account created, redirect to login page with success message.

### 3.1.2 User Login (FR-AUTH-002)

**Description:** Registered users must be able to log in using their national ID and password.

**Priority:** High

**Input:**

-   National ID Number (14 digits)

-   Password

**Processing:**

-   Validate credentials against database

-   Check account status (active/suspended)

-   Generate JWT token with user information

-   Set secure HTTP-only cookie with JWT

-   Log login attempt

**Output:** JWT cookie set, redirect to user dashboard. Display error message for invalid credentials.

### 3.1.3 Password Reset (FR-AUTH-003)

Users who forget their password can reset it using their national ID and phone number. A verification code will be sent to their registered phone number for identity confirmation.

## 3.2 License Application Management

### 3.2.1 New Fisherman License Application (FR-APP-001)

**Description:** Users can submit a new application for a fisherman license through a multi-step form. The system supports multiple fisherman categories.

**Priority:** High

**Fisherman Categories:**

-   صياد (Fisherman)

-   صياد تحت السن (Underage Fisherman)

-   مندوب (Representative)

-   تاجر (Merchant)

-   عامل تاجر (Merchant Worker)

-   شيال (Porter/Loader)

**Application Steps:**

1.  **Step 1: Personal Information & License Type**

-   Full Name (Arabic)

-   National ID Number (with validation)

-   Phone Number

-   Governorate (dropdown)

-   Date of Birth (date picker)

-   Fisherman Category (dropdown: صياد، صياد تحت السن، مندوب، تاجر، عامل تاجر، شيال)

-   License Status Selection:

-   \- New License (صياد جديد): First-time applicant

-   \- Renewal (تجديد رخصة): Has previous fishing license

2.  **Step 2: Documents Upload (Required Documents)**

All documents must be uploaded in Arabic. Required documents for fisherman:

-   فيش جنائي موجه للجهاز (Police Clearance Certificate directed to the agency) - Required

-   صورة بطاقة الرقم القومي سارية (Copy of valid National ID) - Required

-   صورة بطاقة الصيد القديمة (Copy of old fishing card) - Required if Renewal

-   موقف التجنيد (Military Service Status Document) - Required

-   صورة التأمين (Insurance Document) - Required if insured fisherman (إذا كان صياد مؤمن عليه)

-   صورة شخصية 4×6 خلفية بيضاء (Personal photo 4×6 white background) - Required

**Document Upload Rules:**

-   Each document must be clearly labeled in Arabic

-   Maximum file size: 5MB per document

-   Accepted formats: JPG, PNG, PDF

-   Drag-and-drop or click to upload

-   Preview thumbnail after upload

-   Option to replace uploaded document

3.  **Step 3: Review and Confirmation**

-   Display summary of all entered information in Arabic

-   Show uploaded documents as thumbnails with labels

-   Terms and conditions acceptance checkbox

-   Legal responsibility declaration checkbox

-   Final submission button

**Validation Rules:**

-   All required fields must be completed

-   National ID must be exactly 14 digits

-   Phone number must match Egyptian format

-   For renewal: Previous fishing card is mandatory

-   For new license: Previous fishing card is optional/hidden

-   For underage fisherman: Special validation rules apply

-   Insurance document conditional based on fisherman status

-   All document names must be in Arabic

**Output:** Application submitted with unique reference number (e.g., #BRD-2025-001), confirmation message displayed in Arabic.

### 3.2.2 Boat/Vehicle License Application (FR-APP-002)

**Description:** Users can submit applications for different types of boat and vehicle licenses.

**Priority:** High

**License Types:**

-   ترخيص مركب (Boat License)

-   ترخيص سيارات (Vehicle License)

-   عائمة أفراد (Individual Float)

**Required Information:**

-   Registration Number (رقم التسجيل)

-   Boat/Vehicle Name (اسم المركب/السيارة)

-   Type Selection (نوع الترخيص): مركب، سيارة، عائمة أفراد

-   Owner Name (اسم المالك) - Arabic

-   Owner National ID (الرقم القومي للمالك)

**Required Documents for Boat License (الأوراق المطلوبة للمراكب):**

-   أصل رخصة العام السابق (Original license from previous year) - Required

-   صورة بطاقة المالك (Copy of owner\'s national ID) - Required

-   خطاب من الجمعية المنتمي إليها (Letter from affiliated association stating boat is debt-free) - يفيد بأن المركب خالي المديونية - Required

-   خطاب من التأمينات (Letter from insurance) - يفيد بسداد رسوم التأمينات عن الفترة من\... إلى\... - Required

-   خطاب أو إيصال سداد الضرائب (Tax payment letter/receipt from tax office) - بمأمورية الضرائب - Required

-   استمارة طلب تجديد ترخيص مركب (Boat license renewal form) - استمارة جهاز مستقبل مصر - Downloadable form to fill and upload - Required

-   صورة من إيصال سداد رسوم الترخيص (Copy of license fee payment receipt) - Uploaded after payment at financial department - Required after payment

**Application Workflow:**

4.  User submits application with all documents except payment receipt

5.  Admin reviews application

6.  If approved, admin generates Supply Order (أمر توريد للخزانة) with order ID, name, and payment amount

7.  User receives notification with Supply Order document

8.  User pays at Financial Department (القسم المالي) and receives cash receipt (وصل استلام نقدية)

9.  User submits payment receipt to licensing department

10. Admin marks application as paid

11. User receives license within specified days

**Special Features:** Downloadable boat license renewal form template (استمارة جهاز مستقبل مصر) that users can fill out and upload.

### 3.2.3 Application Status Tracking (FR-APP-003)

**Description:** Users can track their application status through multiple channels.

**Priority:** High

**Tracking Methods:**

-   Dashboard view showing all applications

-   Dedicated tracking page with search by application number

-   Filter by license type (all, fisherman, boat, vehicle)

-   Search by application reference number

**Application Status Workflow:**

  **Status**                    **Description**                                        **Color Indicator**

  Application Received          Initial submission completed                           Blue

  Under Review                  Being reviewed by administrators                       Orange

  Approved - Payment Required   Application approved, supply order generated           Yellow

  Payment Pending               Waiting for user to pay at financial department        Yellow

  Payment Submitted             User uploaded payment receipt, awaiting verification   Orange

  Payment Verified              Payment confirmed by admin                             Green

  Processing License            License document being prepared                        Blue

  Ready for Collection          License ready for pickup/delivery                      Green

  Rejected                      Application rejected with reason                       Red

  Completed                     Process fully completed, license delivered             Green

**Payment Workflow Details:**

12. Admin reviews application and approves it

13. System generates Supply Order (أمر توريد للخزانة) PDF document containing:

14. \- Order ID (رقم الأمر)

15. \- Applicant Name (اسم المتقدم)

16. \- License Type (نوع الترخيص)

17. \- Payment Amount (المبلغ المطلوب) - Retrieved from admin-configured prices

18. \- Payment Instructions (تعليمات الدفع)

19. User downloads Supply Order document

20. User goes to Financial Department (القسم المالي) with printed document

21. User pays the specified amount and receives Cash Receipt (وصل استلام نقدية)

22. User uploads Cash Receipt image/PDF to the system

23. Licensing Department admin verifies payment and marks as paid

24. License processing begins and user receives notification when ready

**Status Timeline Display:**

-   Vertical timeline showing all status changes

-   Each status includes timestamp and description

-   Visual indicators (checkmarks, icons) for completed steps

-   Ability to download application details as PDF

## 3.3 User Dashboard

### 3.3.1 Dashboard Overview (FR-DASH-001)

**Description:** Personalized dashboard showing user information and quick actions.

**Priority:** High

**Dashboard Components:**

25. **Welcome Section**

-   Greeting with user\'s name and emoji

-   Quick message about application status or pending actions

-   Two primary action buttons: \"Submit New License Application\" and \"View Current Status\"

26. **Statistics Cards**

-   Pending Payments: Count and amount (needs collection)

-   Accepted Applications: Count ready for use

-   Applications Under Review: Count in pending/review status

27. **Recent Applications Table**

-   Application reference number (clickable link)

-   License type (fisherman/boat/vehicle)

-   Date of submission

-   Current status with color indicator

-   Action column with \"View Details\" link

28. **Quick Links Section**

-   \"Submit New License Application\" with icon

-   \"Inquire About Application Status\" with icon

-   \"Technical Support\" with icon

## 3.4 Administrative Panel

### 3.4.1 Admin Dashboard (FR-ADMIN-001)

**Description:** Comprehensive dashboard for administrative staff to manage applications.

**Priority:** High

**Dashboard Components:**

29. **Statistics Overview**

-   Total number of licenses: breakdown by type

-   New applications: count requiring attention

-   Applications under review: count in progress

-   Active licenses: currently valid count

30. **Charts and Analytics**

-   Monthly license trend: line chart showing new vs. rejected applications

-   License distribution: pie chart showing percentage by status (active, suspended, expired, rejected)

-   Percentage breakdowns with color coding

31. **Recent Activity Feed**

-   Latest application status changes

-   Recent approvals/rejections with timestamps

-   License validity updates

32. **Quick Actions Sidebar**

-   Add new fisherman license

-   Generate reports

-   System settings

-   Send notification

### 3.4.2 Application Review Interface (FR-ADMIN-002)

**Description:** Interface for administrators to review and process license applications.

**Priority:** High

**Review Features:**

-   View all application details in a modal/side panel

-   Display applicant information with profile photo

-   Show all uploaded documents with zoom/download capability

-   Application history and status log

-   Comment/notes field for internal use

-   Three action buttons: Approve (green), Reject (red), Defer (yellow)

-   Rejection requires reason selection or text input

-   Approval triggers notification to applicant

**Application List View:**

-   Filterable by status (all, new, under review, approved, rejected)

-   Sortable by date, applicant name, license type

-   Bulk selection for batch processing

-   Export to Excel/PDF functionality

-   Pagination with configurable items per page

### 3.4.3 Pricing Configuration (FR-ADMIN-003)

**Description:** Administrators can configure license prices for different categories through the system settings.

**Priority:** High

**Configurable Price Categories:**

**Fisherman Licenses (تراخيص الصيادين):**

-   صياد (Fisherman) - New and Renewal prices

-   صياد تحت السن (Underage Fisherman)

-   مندوب (Representative)

-   تاجر (Merchant)

-   عامل تاجر (Merchant Worker)

-   شيال (Porter/Loader)

**Boat and Vehicle Licenses (تراخيص المراكب والسيارات):**

-   ترخيص مركب (Boat License) - by size/type categories

-   ترخيص سيارات (Vehicle License)

-   عائمة أفراد (Individual Float)

**Admin Interface Features:**

-   Table view of all license types with current prices

-   Edit price functionality with validation (must be positive number)

-   Price history log showing who changed prices and when

-   Bulk price update option with percentage increase/decrease

-   Export price list to Excel/PDF

-   Set effective date for new prices (optional)

-   Currency display in Egyptian Pounds (EGP/جنيه مصري)

**Business Rule:** Price changes are logged for audit purposes. When generating Supply Orders, the system uses the current active prices at the time of approval.

### 3.4.4 Notifications Management (FR-ADMIN-004)

Administrators can create and send system-wide notifications or targeted messages to specific users or groups. Notification interface includes priority selection (critical, important, normal), recipient selection, and message composition in Arabic.

## 3.5 Notification System

### 3.5.1 In-App Notifications (FR-NOTIF-001)

**Description:** Users receive in-app notifications for application status changes in Arabic.

**Priority:** High

**Notification Types:**

-   Application received confirmation (تم استلام الطلب)

-   Application under review (الطلب قيد المراجعة)

-   Application approved - payment required (تم قبول الطلب - مطلوب الدفع)

-   Supply Order generated (تم إنشاء أمر التوريد)

-   Payment receipt received (تم استلام إيصال الدفع)

-   Payment verified (تم التحقق من الدفع)

-   License ready for collection (الرخصة جاهزة للاستلام)

-   Application rejected with reason (تم رفض الطلب)

-   License expiration warning (30 days, 7 days) (تحذير انتهاء صلاحية الرخصة)

-   System announcements (إعلانات النظام)

**Notification Features:**

-   Bell icon in header with unread count badge

-   Dropdown panel showing recent notifications in Arabic

-   Mark as read/unread functionality

-   Delete individual notifications

-   \"Mark all as read\" bulk action (تحديد الكل كمقروء)

-   Notification persistence until dismissed

-   Link to related application from notification

-   Timestamp in Arabic format

## 3.6 Public Portal

### 3.6.1 Homepage (FR-PUBLIC-001)

**Description:** Public-facing homepage providing information about the licensing system.

**Priority:** Medium

**Homepage Sections:**

-   Hero section with lake image and system tagline

-   Call-to-action buttons: \"Register\" and \"Login\"

-   Services overview cards (fisherman licenses, boat licenses, application tracking)

-   Interactive marina map showing available locations

-   Latest news and announcements section

-   Quick stats (sustainable development messaging)

### 3.6.2 News and Announcements (FR-PUBLIC-002)

**Description:** Public news portal with articles about lake management and updates.

**Features:**

-   Article listing with featured images

-   Search functionality

-   Category filtering (all, announcements, news, regulations, events)

-   Article detail view with full content

-   Author attribution and publish date

-   Related articles suggestions

-   Social sharing buttons (optional)

## 3.7 Document Management

### 3.7.1 Document Upload (FR-DOC-001)

**Description:** System supports uploading various document types during application process.

**Requirements:**

-   Drag-and-drop upload interface

-   Click to browse file selection

-   Multiple file selection support

-   Upload progress indicator

-   File size validation (max 5MB per file)

-   File type validation (JPG, PNG, PDF only)

-   Image preview after upload

-   Remove uploaded file capability

-   Automatic file naming and storage

### 3.7.2 Document Download (FR-DOC-002)

Users and administrators can download application documents and generated PDFs. Download includes application summary, all uploaded documents, and approval certificates.

### 3.7.3 PDF Generation (FR-DOC-003)

**Description:** System automatically generates PDF documents in Arabic for various purposes.

**Generated PDF Documents:**

-   Supply Order (أمر توريد للخزانة) - Generated when application is approved

-   Approved license certificates with QR codes for verification

-   Application summary reports in Arabic

-   Payment receipts and confirmation documents

-   Administrative reports and statistics

**Supply Order (أمر توريد للخزانة) Contents:**

-   System header with logo (جواز مستقبل مصر للتنمية المستدامة)

-   Document title: أمر توريد للخزانة

-   Order ID (رقم الأمر): Unique identifier

-   Date of issuance (تاريخ الإصدار): Arabic format

-   Applicant information:

-   \- Full name (الاسم الكامل)

-   \- National ID (الرقم القومي)

-   \- Application number (رقم الطلب)

-   License details:

-   \- License type (نوع الترخيص)

-   \- License category (فئة الترخيص)

-   Payment information:

-   \- Amount to be paid (المبلغ المطلوب)

-   \- Currency: جنيه مصري (EGP)

-   Instructions for payment (تعليمات الدفع):

-   \- Go to Financial Department (التوجه إلى القسم المالي)

-   \- Present this document (تقديم هذا المستند)

-   \- Receive cash receipt (استلام وصل استلام نقدية)

-   \- Upload receipt to system (رفع الوصل على النظام)

-   Footer with contact information and QR code for verification

**Technical Requirements:** PDF library must support Arabic fonts (Amiri, Cairo, Tajawal, or similar). All text must be RTL-formatted. QR codes should encode application number and order ID for verification.

# 4. Non-Functional Requirements

## 4.1 Performance Requirements

  **Requirement**                     **Specification**
  Page Load Time                      \< 3 seconds for standard pages on 3G connection

  API Response Time                   \< 1 second for database queries

  Concurrent Users                    Support minimum 500 concurrent users

  Document Upload                     Complete within 10 seconds for 5MB file

  Search Results                      Return results within 2 seconds

  Database Queries                    Optimized with proper indexing, \< 500ms

## 4.2 Security Requirements

### 4.2.1 Authentication and Authorization (NFR-SEC-001)

-   Password hashing using bcrypt with minimum 10 rounds

-   Session management with secure tokens (JWT)

-   Session timeout after 30 minutes of inactivity

-   Role-based access control (RBAC)

-   Two-factor authentication option for admin accounts

-   Account lockout after 5 failed login attempts

### 4.2.2 Data Protection (NFR-SEC-002)

-   HTTPS encryption for all communications

-   Database encryption at rest

-   PII data encryption (names, IDs, phone numbers)

-   Secure file storage with access controls

-   Regular security audits and penetration testing

-   GDPR/data protection compliance

-   Audit logging of all sensitive operations

### 4.2.3 Input Validation (NFR-SEC-003)

-   Server-side validation for all inputs

-   SQL injection prevention (parameterized queries)

-   XSS protection (input sanitization)

-   CSRF token validation

-   File upload validation (type, size, content)

-   Rate limiting on API endpoints

## 4.3 Usability Requirements

-   Arabic as primary language - all inputs, forms, and system text in Arabic

-   RTL (Right-to-Left) layout as default for Arabic interface

-   English as secondary language option (interface translation only)

-   All user-submitted data must be in Arabic (names, documents, etc.)

-   Responsive design for mobile, tablet, and desktop devices

-   Intuitive navigation with clear Arabic hierarchy

-   Consistent UI/UX patterns throughout application

-   Accessible design following WCAG 2.1 Level AA guidelines

-   Clear error messages in Arabic with actionable guidance

-   Progress indicators for multi-step processes with Arabic labels

-   Help tooltips and contextual assistance in Arabic

-   Maximum 3 clicks to reach any functionality

-   Date formats in Arabic (DD/MM/YYYY or Arabic calendar)

-   Currency displayed in Egyptian Pounds (جنيه مصري)

-   Phone number format validation for Egyptian numbers

## 4.4 Reliability Requirements

-   System uptime: 99.5% (excluding scheduled maintenance)

-   Scheduled maintenance window: Sundays 2:00-4:00 AM

-   Automatic backup every 24 hours

-   Backup retention: 30 days

-   Disaster recovery plan with RTO \< 4 hours

-   Data recovery point objective (RPO) \< 1 hour

-   Error logging and monitoring system

-   Graceful degradation for non-critical features

## 4.5 Scalability Requirements

-   Horizontal scaling capability for application servers

-   Database replication support

-   CDN integration for static assets

-   Load balancing across multiple servers

-   Microservices architecture for future expansion

-   API versioning support

-   Queue system for asynchronous processing (email, SMS)

## 4.6 Browser and Device Compatibility

  **Platform**                        **Minimum Version**
  Chrome                              Version 90+

  Firefox                             Version 88+

  Safari                              Version 14+

  Edge                                Version 90+

  Mobile Safari (iOS)                 iOS 13+

  Chrome Mobile (Android)             Android 8+

  Screen Resolution                   Minimum 320px width (mobile-first)

# 5. System Architecture and Technical Requirements

## 5.1 Technology Stack (Recommended)

### 5.1.1 Frontend

-   Framework: React.js 18+ or Vue.js 3+

-   UI Library: Tailwind CSS or Material-UI

-   State Management: Redux or Vuex

-   HTTP Client: Axios

-   Form Handling: Formik or VeeValidate

-   Charts: Chart.js or Recharts

-   Date Picker: React Datepicker or Vue Datepicker

-   i18n: react-i18next or vue-i18n

### 5.1.2 Backend

-   Runtime: Node.js 18+ with Express.js

-   API: RESTful API with JSON responses

-   Authentication: JWT (JSON Web Tokens) with secure HTTP-only cookies

-   Session Management: Stateless JWT with refresh token strategy

-   Cookie Configuration: Secure, HttpOnly, SameSite=Strict

-   File Upload: Multer (Node.js) or similar with size/type validation

-   PDF Generation: Puppeteer or PDFKit for Supply Orders and certificates

-   Arabic Text Support: Ensure PDF libraries support Arabic fonts (Amiri, Cairo, etc.)

### 5.1.3 Database

-   Primary Database: PostgreSQL

-   ORM: Prisma, Sequelize, or TypeORM

-   Caching: Redis for session storage and caching

-   File Storage: AWS S3, MinIO, or local storage with backup

### 5.1.4 DevOps and Infrastructure

-   Version Control: Git with GitHub/GitLab

-   CI/CD: GitHub Actions or GitLab CI

-   Containerization: Docker

-   Orchestration: Docker Compose or Kubernetes (for scaling)

-   Monitoring: PM2, New Relic, or Datadog

-   Logging: Winston or Pino

-   Web Server: Nginx as reverse proxy

## 5.2 Database Schema (Key Entities)

### 5.2.1 Users Table

-   id (UUID/Integer, Primary Key)

-   national_id (String, Unique, Indexed) - 14 digits

-   first_name_ar (String) - First name in Arabic

-   last_name_ar (String) - Last name in Arabic

-   phone (String, Unique) - Egyptian format

-   password_hash (String) - bcrypt hashed

-   role (Enum: citizen, admin, super_admin)

-   status (Enum: active, suspended)

-   created_at (Timestamp)

-   updated_at (Timestamp)

-   last_login (Timestamp)

### 5.2.2 Applications Table

-   id (UUID/Integer, Primary Key)

-   application_number (String, Unique, e.g., BRD-2025-014)

-   user_id (Foreign Key → Users)

-   application_type (Enum: fisherman, boat, vehicle, individual_float)

-   license_category (String) - For fisherman: صياد، صياد تحت السن، مندوب، تاجر، عامل تاجر، شيال

-   is_renewal (Boolean) - True if renewal, False if new

-   status (Enum: received, under_review, approved_payment_required, payment_pending, payment_submitted, payment_verified, processing, ready, rejected, completed)

-   payment_amount (Decimal, Nullable) - Set when approved

-   supply_order_id (String, Nullable) - Generated order ID

-   supply_order_path (String, Nullable) - Path to generated PDF

-   payment_receipt_path (String, Nullable) - Uploaded by user

-   submitted_at (Timestamp)

-   reviewed_at (Timestamp, Nullable)

-   reviewed_by (Foreign Key → Users, Nullable)

-   approved_at (Timestamp, Nullable)

-   payment_verified_at (Timestamp, Nullable)

-   rejection_reason (Text, Nullable)

-   data (JSON/Text) - stores application-specific data in Arabic

-   created_at (Timestamp)

-   updated_at (Timestamp)

### 5.2.3 Documents Table

-   id (UUID/Integer, Primary Key)

-   application_id (Foreign Key → Applications)

-   document_type (Enum: national_id_front, national_id_back, photo, police_clearance, etc.)

-   file_path (String)

-   file_name (String)

-   file_size (Integer)

-   mime_type (String)

-   uploaded_at (Timestamp)

### 5.2.4 Notifications Table

-   id (UUID/Integer, Primary Key)

-   user_id (Foreign Key → Users)

-   type (Enum: application_update, payment_reminder, system_announcement)

-   title (String)

-   message (Text)

-   read (Boolean, Default: false)

-   created_at (Timestamp)

-   read_at (Timestamp, Nullable)

### 5.2.5 License Prices Table

-   id (UUID/Integer, Primary Key)

-   license_type (Enum: fisherman, boat, vehicle, individual_float)

-   category (String) - صياد، صياد تحت السن، مندوب، تاجر، عامل تاجر، شيال، مركب، سيارة، etc.

-   price (Decimal) - Amount in EGP

-   is_renewal_price (Boolean) - Different price for renewal vs new

-   effective_from (Date) - When this price becomes active

-   effective_until (Date, Nullable) - When price expires

-   created_by (Foreign Key → Users)

-   created_at (Timestamp)

-   updated_at (Timestamp)

### 5.2.6 Price Change History Table

-   id (UUID/Integer, Primary Key)

-   license_price_id (Foreign Key → License Prices)

-   old_price (Decimal)

-   new_price (Decimal)

-   changed_by (Foreign Key → Users)

-   reason (Text, Nullable)

-   changed_at (Timestamp)

### 5.2.7 Application Status History Table

-   id (UUID/Integer, Primary Key)

-   application_id (Foreign Key → Applications)

-   old_status (String)

-   new_status (String)

-   changed_by (Foreign Key → Users)

-   notes (Text, Nullable)

-   changed_at (Timestamp)

## 5.3 API Endpoints (Sample)

  **Endpoint**                                 **Method**    **Description**                       **Auth Required**

  /api/auth/register                           POST          User registration (Arabic inputs)     No

  /api/auth/login                              POST          User login (sets JWT cookie)          No

  /api/auth/logout                             POST          User logout (clears cookie)           Yes

  /api/auth/refresh                            POST          Refresh JWT token                     Yes

  /api/applications                            GET           List user applications                Yes

  /api/applications                            POST          Submit new application                Yes

  /api/applications/:id                        GET           Get application details               Yes

  /api/applications/:id/documents              POST          Upload documents                      Yes

  /api/applications/:id/track                  GET           Track application status              Yes

  /api/applications/:id/payment-receipt        POST          Upload payment receipt                Yes

  /api/admin/applications                      GET           List all applications (admin)         Yes (Admin)

  /api/admin/applications/:id/review           PUT           Review application                    Yes (Admin)

  /api/admin/applications/:id/approve          POST          Approve and generate Supply Order     Yes (Admin)

  /api/admin/applications/:id/verify-payment   PUT           Verify payment receipt                Yes (Admin)

  /api/admin/prices                            GET           Get all license prices                Yes (Admin)

  /api/admin/prices/:id                        PUT           Update license price                  Yes (Admin)

  /api/admin/prices/history                    GET           Get price change history              Yes (Admin)

  /api/notifications                           GET           Get user notifications (Arabic)       Yes

  /api/notifications/:id/read                  PUT           Mark notification as read             Yes

  /api/news                                    GET           Get news articles (public)            No

  /api/news/:id                                GET           Get news article details              No

  /api/forms/boat-renewal                      GET           Download boat renewal form template   Yes

# 6. Business Rules and Constraints

## 6.1 Application Processing Rules

33. BR-001: Applicant must be 18 years or older for adult licenses (صياد تحت السن exempt)

34. BR-002: Each user can have maximum 3 active applications simultaneously

35. BR-003: Applications expire after 30 days if payment not completed

36. BR-004: Rejected applications can be resubmitted after 30 days

37. BR-005: All required documents must be uploaded before submission

38. BR-006: National ID must be valid, unique, and exactly 14 digits

39. BR-007: Phone numbers must be Egyptian format (+20 or 05xxxxxxxx)

40. BR-008: All user inputs must be in Arabic (names, addresses, etc.)

41. BR-009: Applications are processed in FIFO (First In, First Out) order

42. BR-010: Priority processing available for renewals (configurable)

43. BR-011: Admin must provide reason for rejection in Arabic

44. BR-012: Supply Order must be generated before payment can be made

45. BR-013: Payment receipt must be uploaded and verified before license issuance

46. BR-014: License cannot be issued until payment is verified by admin

## 6.2 License Validity Rules

47. BR-015: Fisherman licenses valid for 1 year from issuance

48. BR-016: Boat licenses valid for 1 year from issuance (renewable annually)

49. BR-017: License renewal application can be submitted 30 days before expiration

50. BR-018: Expired licenses require new application (no renewal after 90 days)

51. BR-019: Suspended licenses cannot be renewed until suspension is lifted

52. BR-020: Previous year\'s license (أصل رخصة العام السابق) required for boat renewal

## 6.3 Document Requirements

53. BR-021: All documents must be labeled in Arabic

54. BR-022: National ID images must show all corners clearly and be valid

55. BR-023: Personal photo must be 4×6 with white background (صورة 4\*6 خلفية بيضاء)

56. BR-024: Police clearance (فيش جنائي) must be directed to the agency and dated within last 3 months

57. BR-025: For renewal: Previous fishing card (صورة بطاقة الصيد القديمة) is mandatory

58. BR-026: Military service status document (موقف التجنيد) required for all male applicants

59. BR-027: Insurance document required only for insured fishermen (صياد مؤمن عليه)

60. BR-028: Boat applications require association debt-free letter (خطاب من الجمعية)

61. BR-029: Tax payment receipt (إيصال سداد الضرائب) required for boat licenses

62. BR-030: Boat license renewal form (استمارة جهاز مستقبل مصر) must be downloaded, filled, and uploaded

## 6.4 Payment and Pricing Rules

63. BR-031: Prices are configured per license type and category in admin panel

64. BR-032: Different prices for new applications vs renewals

65. BR-033: Payment amount is locked at time of approval (price changes don\'t affect pending applications)

66. BR-034: Supply Order (أمر توريد للخزانة) contains order ID, applicant name, and exact amount

67. BR-035: User must pay at Financial Department (القسم المالي) and receive cash receipt

68. BR-036: Payment receipt must be uploaded as image or PDF

69. BR-037: Admin must verify payment receipt matches Supply Order amount

70. BR-038: License processing begins only after payment verification

71. BR-039: All prices displayed in Egyptian Pounds (جنيه مصري)

## 6.5 System Access Rules

72. BR-040: Users accounts are immediately active after registration (no email verification)

73. BR-041: Admin accounts require two-factor authentication (optional enhancement)

74. BR-042: Suspended users cannot log in or submit applications

75. BR-043: User data can only be deleted by super_admin role

76. BR-044: Application history must be retained for 5 years (audit requirement)

77. BR-045: JWT tokens expire after 24 hours and must be refreshed

78. BR-046: Cookies must be secure, HTTP-only, and SameSite=Strict

# 7. User Interface Requirements

## 7.1 Design Principles

-   Clean, modern interface with Egyptian government branding

-   Primary color: Teal/Turquoise (#2E9B9F) representing Lake Bardawil

-   Secondary colors: Gold (#C9A961) for Egypt, Green for approved status

-   Logo: Sun rays over water waves symbolizing sustainable development

-   Arabic-first design with proper RTL support

-   Consistent spacing and alignment throughout

-   Clear visual hierarchy with headings and sections

-   Accessible color contrast ratios (WCAG AA compliant)

## 7.2 Navigation Structure

### 7.2.1 User Navigation (Authenticated)

-   Dashboard (Home icon)

-   My Licenses (ID card icon)

-   My Boats/Vehicles (Boat icon)

-   Notifications (Bell icon with badge)

-   Settings (Gear icon)

-   Logout

### 7.2.2 Admin Navigation

-   Dashboard (Home icon)

-   License Requests Review (Clipboard icon)

-   Users Management (People icon)

-   Reports (Chart icon)

-   Notifications (Bell icon)

-   Settings (Gear icon)

### 7.2.3 Public Navigation (Unauthenticated)

-   Home

-   About

-   Licenses

-   Contact

-   News

-   Login/Register

## 7.3 Form Validation and Error Handling

-   Real-time validation with inline error messages

-   Required field indicators (\* or \"required\" label)

-   Field-specific validation messages (e.g., \"National ID must be 14 digits\")

-   Success messages displayed prominently after form submission

-   Error summary at top of form for server-side validation errors

-   Disabled submit button until all required fields are valid

-   Loading spinner during form submission

-   Toast notifications for async operations (save, delete, etc.)

## 7.4 Responsive Design Breakpoints

  **Device**              **Width**               **Layout Changes**

  Mobile                  320-767px               Single column, hamburger menu, stacked forms

  Tablet                  768-1023px              Two columns, sidebar may collapse, touch-friendly

  Desktop                 1024px+                 Full layout, sidebar visible, multi-column forms

## 7.5 Loading and Empty States

-   Skeleton screens for data loading

-   Spinner for quick operations (\< 3 seconds)

-   Progress bars for long operations (file uploads)

-   Empty state messages with call-to-action (e.g., \"No applications yet. Submit your first application!\")

-   Error state with retry option

-   Offline state detection with appropriate message

# 8. Testing Requirements

## 8.1 Testing Strategy

  **Test Type**           **Coverage**                  **Tools**

  Unit Testing            80%+ code coverage            Jest, Mocha, PyTest

  Integration Testing     All API endpoints             Supertest, Postman

  End-to-End Testing      Critical user flows           Cypress, Selenium

  Performance Testing     Load and stress testing       JMeter, k6

  Security Testing        Vulnerability scanning        OWASP ZAP, Snyk

  Accessibility Testing   WCAG 2.1 compliance           axe, Pa11y

  Browser Testing         Cross-browser compatibility   BrowserStack, LambdaTest

  Mobile Testing          iOS and Android devices       BrowserStack, Real devices

## 8.2 Test Cases (Sample)

### 8.2.1 User Registration

79. TC-001: Successful registration with valid data

80. TC-002: Registration fails with duplicate email

81. TC-003: Registration fails with weak password

82. TC-004: Registration fails with invalid phone format

83. TC-005: Email verification link works correctly

84. TC-006: Terms and conditions must be accepted

### 8.2.2 Application Submission

85. TC-007: Submit application with all required documents

86. TC-008: Application fails without required documents

87. TC-009: Document upload size limit enforced

88. TC-010: Invalid file type rejected

89. TC-011: Application number generated correctly

90. TC-012: Notification sent after submission

### 8.2.3 Admin Review Process

91. TC-013: Admin can view application details

92. TC-014: Admin can approve application

93. TC-015: Admin must provide reason for rejection

94. TC-016: Status history updated correctly

95. TC-017: Notification sent to user after review

96. TC-018: Approved application generates PDF certificate

# 9. Deployment and Maintenance

## 9.1 Deployment Requirements

-   Production server: Linux-based (Ubuntu 20.04+ or CentOS 8+)

-   Minimum server specs: 4 CPU cores, 8GB RAM, 100GB SSD

-   Database server: Separate instance for production

-   SSL certificate from trusted CA (Let\'s Encrypt acceptable)

-   Domain name with proper DNS configuration

-   Firewall configuration (ports 80, 443 open)

-   CDN setup for static assets (optional but recommended)

-   Monitoring and alerting system configured

## 9.2 Backup Strategy

-   Automated daily database backups at 3:00 AM

-   Weekly full system backups including uploaded files

-   30-day backup retention policy

-   Offsite backup storage (different physical location)

-   Quarterly backup restore testing

-   Documented recovery procedures

## 9.3 Maintenance Windows

-   Scheduled maintenance: Every Sunday 2:00-4:00 AM

-   Advance notification: 48 hours via email and in-app announcement

-   Emergency maintenance: As needed with immediate notification

-   System status page for real-time updates

## 9.4 Update and Patch Management

-   Security patches: Applied within 48 hours of release

-   Feature updates: Monthly release cycle

-   Breaking changes: Communicated 2 weeks in advance

-   Database migrations: Tested in staging before production

-   Rollback plan for each deployment

# 10. Appendices

## 10.1 User Flow Diagrams

*User flow diagrams illustrating the step-by-step process for key user journeys should be created, including:*

-   User registration and login flow

-   Fisherman license application flow

-   Boat license application flow

-   Application tracking flow

-   Admin review and approval flow

-   Password reset flow

## 10.2 Wireframes Reference

*The following design screenshots have been analyzed to create this SRS:*

-   splash.png - Application loading screen

-   login.png - User login interface

-   registeration.png - User registration form

-   home.png - User dashboard/homepage

-   ترخيص\_جديد.png - New license application form (Arabic)

-   Frame.png - User dashboard with quick actions

-   Frame-1.png - Application form (boat/vehicle details)

-   Frame-2.png - Application tracking interface

-   Frame-3.png - License application form (fisherman)

-   Frame-4.png - Admin dashboard

-   Frame-5.png - Admin control panel (main)

-   Frame-6.png - Notifications management panel

-   Frame-7.png - Application review details (admin)

-   Group_2.png - Public news portal

-   body.png - License review panel (admin)

-   body-1.png - License applications list view

## 10.3 Glossary

  **Term**                            **Definition**
  Bardawil Lake                       A salt lake in the northern part of the Sinai Peninsula in Egypt

  License                             Official permission to engage in fishing or operate a boat on Bardawil Lake

  Application                         A formal request submitted by a user for a license

  Status                              Current state of an application in the review process

  Admin                               Administrative user with permissions to review and approve applications

  National ID                         Egyptian national identification number (14 digits)

  JWT                                 JSON Web Token - used for secure authentication

  API                                 Application Programming Interface

  CRUD                                Create, Read, Update, Delete operations

  RTL                                 Right-to-Left text direction for Arabic language

## 10.4 References

-   Egyptian Government Digital Transformation Guidelines

-   WCAG 2.1 Web Accessibility Guidelines

-   OWASP Security Best Practices

-   Egyptian Data Protection Regulations

-   ISO/IEC 25010 Software Quality Standards

# 11. Document Control

## 11.1 Change History

  **Version**       **Date**           **Author**             **Changes**

  1.0               January 15, 2026   System Analysis Team   Initial SRS document created based on design analysis

## 11.2 Approval

  **Role**          **Name**                             **Signature**                        **Date**

  Project Manager   \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_

  Technical Lead    \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_

  Product Owner     \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_

  Stakeholder       \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_

*\-\-- End of Document \-\--*

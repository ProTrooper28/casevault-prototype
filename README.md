# CaseVault Prototype

Build the initial frontend prototype for a Smart India Hackathon 2026 project.

PROJECT:

CaseVault AI

TAGLINE:

Secure Digital Document Management for Legal & Investigation Documents

PROBLEM STATEMENT:

SIH26190

Secure Digital Document Management System for Legal and Investigation Documents

Organization:

Ministry of Home Affairs

Department:

National Crime Records Bureau (NCRB)

IMPORTANT:

We are building this in phases.

RIGHT NOW I ONLY WANT THE COMPLETE UI/SITE STRUCTURE AND A HIGH-QUALITY WORKING FRONTEND PROTOTYPE.

DO NOT spend time implementing real AI, OCR, blockchain, cloud storage, complex authentication, or external APIs yet.

Use realistic MOCK DATA and local frontend state wherever necessary.

Every page, navigation item, button and major interaction should work at the UI/prototype level.

The application should feel like a serious law-enforcement/government technology platform, NOT a generic SaaS dashboard.

TECH STACK:

React

JavaScript

Tailwind CSS

DESIGN DIRECTION:

Clean, professional, trustworthy and modern.

Primary:

Deep navy / blue

Supporting:

White

Light blue

Green for verified/safe

Orange for warnings/actions

Red only for security alerts

Subtle purple for AI-related elements

Avoid:

- Excessive gradients

- Glassmorphism

- Neon effects

- Huge animations

- Generic AI illustrations

- Overly rounded childish cards

- Excessive empty space

- Startup landing-page aesthetics

Use:

- Clean borders

- Compact cards

- Strong typography

- Professional tables

- Status badges

- Timeline components

- Subtle shadows

- Consistent spacing

The UI should look suitable for a serious NCRB / Ministry of Home Affairs system.

==================================================

LOGIN

==================================================

Create a professional login screen.

Brand:

CaseVault AI

Subtitle:

Secure Digital Document & Evidence Management

Fields:

Email

Password

Buttons:

Login

Continue as Guest

The "Continue as Guest" button MUST work and take the user directly to the Dashboard.

For now no real authentication is required.

==================================================

APP LAYOUT

==================================================

After login, create a persistent application layout.

Left sidebar:

Dashboard

Cases

Documents

Evidence

Smart Search

Integrity

Audit Trail

Access Management

Bottom:

Profile

Settings

Top bar:

Current page title

Global search

Notifications

User/role indicator

Make sidebar responsive.

==================================================

DASHBOARD

==================================================

Create a realistic dashboard.

Header:

Good morning, Investigator

Stats:

Active Cases

24

Documents

1,284

Evidence Items

376

Pending Verification

8

Integrity:

98% Verified

Recent Cases section.

Recent Activity section.

Quick Actions:

Create Case

Upload Document

Search Documents

Verify Integrity

Use realistic demo data.

Do NOT imply these numbers are real government statistics.

Clearly treat them as prototype/demo data.

==================================================

CASES

==================================================

Create a Cases page.

Include search and filters.

Seed realistic demo cases:

FIR-2026-00124

Theft Investigation

Andheri, Mumbai

Active

CASE-2026-00418

Financial Fraud Investigation

New Delhi

Under Review

CASE-2026-00731

Missing Person Investigation

Guwahati

Active

Each case should be clickable.

Clicking a case opens its Case Details page.

==================================================

CASE DETAILS

==================================================

Create a detailed case page.

Header:

Case ID

Case title

Location

Status

Assigned investigator

Tabs:

Overview

Documents

Evidence

Timeline

Access

Overview should show:

Case information

People involved

Important dates

Assigned officers

Case status

Documents tab should show documents belonging to that case.

Evidence tab should show evidence records.

Timeline should show chronological case activity.

Access should show authorized users.

==================================================

DOCUMENTS

==================================================

Create a document management page.

Categories:

FIRs

Investigation Reports

Witness Statements

Forensic Reports

Court Filings

Evidence Records

Legal Documents

Each document should show:

Document name

Document type

Case ID

Uploaded by

Date

Version

Integrity status

Access level

Actions:

View

Verify

History

Add:

Upload Document

The upload interaction should work at the frontend level.

Accepted:

PDF

PNG

JPG

JPEG

==================================================

DOCUMENT VIEWER

==================================================

Create a polished document detail/viewer screen.

Left:

Document preview area.

Right:

Document Information

Example:

Document:

First Information Report

Document Type:

FIR

Case Type:

Theft

Date:

12 Jan 2026

Location:

Andheri, Mumbai

Persons Involved:

Rahul Sharma

Sections:

IPC 379, 411

Case ID:

FIR-2026-00124

Below this show:

AI Extracted Information

Integrity:

✓ VERIFIED

SHA-256:

a84f...92bd

Version:

1.0

Uploaded by:

Police Investigator

Actions:

Verify Integrity

Download

Share

View Audit History

==================================================

AI PROCESSING

==================================================

Create an AI Processing section.

Show a document being processed through:

1. OCR

2. Document Classification

3. Entity Extraction

4. Metadata Extraction

5. Semantic Indexing

Use an attractive but professional processing UI.

For now these can use deterministic mock states.

Do NOT claim that real AI is running.

Make the UI ready for future Python/FastAPI integration.

==================================================

SMART SEARCH

==================================================

Create a Smart Search page.

Large search bar.

Example queries:

"documents related to Rahul Sharma"

"FIR documents for theft"

"evidence from Andheri"

"documents uploaded in January 2026"

Return realistic mock results.

Each result should show:

Document

Case

Document type

Relevant extracted information

Integrity status

Make the search actually filter the seeded frontend data.

The architecture should later allow Sentence Transformers + FAISS integration.

==================================================

INTEGRITY

==================================================

Create an Integrity & Verification page.

Show:

Document Hash

SHA-256

Integrity Status

✓ VERIFIED

Last Verified

12 Jan 2026, 14:41

Version

1.0

Audit Record

#18429

Create a prominent button:

SIMULATE TAMPERING

When clicked, change the document state to:

⚠ INTEGRITY COMPROMISED

Show:

Original Hash

New Hash

HASH MISMATCH DETECTED

Add:

RESTORE ORIGINAL

For now this can be frontend state.

Later we will replace it with actual SHA-256 verification.

==================================================

AUDIT TRAIL

==================================================

Create an audit timeline.

Example:

14:32

Investigator uploaded FIR

14:33

AI document processing completed

14:33

Document fingerprint generated

14:35

Investigator viewed document

14:38

Access granted to Forensic Officer

14:41

Integrity verified

Each record should show:

Time

User

Action

Document

Status

==================================================

ACCESS MANAGEMENT

==================================================

Create role-based access management UI.

Roles:

Police Investigator

Forensic Officer

Legal Officer

Prosecutor

Court Authority

Administrator

Show permissions:

View

Upload

Download

Edit

Verify

Share

Create a functional-looking Grant Access modal using frontend state.

==================================================

EVIDENCE

==================================================

Create an Evidence page.

Show:

Evidence ID

Case ID

Evidence type

Submitted by

Date

Integrity status

Chain of custody status

Create an evidence detail page with:

Chain of Custody Timeline

Collected

→ Transferred

→ Examined

→ Stored

→ Accessed

This is a prototype representation for now.

==================================================

NAVIGATION

==================================================

Every sidebar item must navigate to an actual page.

No dead buttons.

Use React routing.

The following flow MUST work:

Login

→ Continue as Guest

→ Dashboard

→ Cases

→ Open Case

→ Documents

→ Open Document

→ AI Processing

→ Integrity

→ Audit Trail

→ Smart Search

==================================================

MOCK DATA

==================================================

Use consistent mock data across the entire application.

The same case IDs, people, documents and timestamps should appear consistently throughout the app.

Do not randomly generate important information on refresh.

==================================================

IMPORTANT DEVELOPMENT RULES

==================================================

Do NOT implement:

Real blockchain

Real OCR

Real ML

Real cloud storage

Complex authentication

External APIs

yet.

We will implement these later one feature at a time.

Focus on:

1. Complete navigation

2. Complete screen structure

3. Realistic mock data

4. Polished UI

5. Responsive design

6. No broken buttons

7. No console errors

8. No unnecessary dependencies

9. Maintainable component structure

Before finishing, test the complete navigation flow and ensure there are no blank pages or broken routes.

The result should look like a serious, polished SIH prototype that is ready for deeper functionality to be added later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed179ef1-ae11-4375-a706-fe064b47f5cb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

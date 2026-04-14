# AI Beauty Product Scanner
## By Taylor Poe, Jacob Griffith, & Alfredo Rosado
> Scan • Understand • Decide  
> A full-stack AI-powered beauty product scanner that helps users understand product ingredients, compare products, and make better purchasing decisions.

---

## Overview

AI Beauty Product Scanner is a web-based application built to analyze beauty and skincare products using ingredient data, OCR, structured scoring, and AI-generated explanations.

The goal of this project is to move beyond simple “good” or “bad” product ratings and create a system that can:

- scan product labels
- extract ingredient data
- match ingredients against a structured database
- score product safety
- explain flagged ingredients in plain language
- compare products side-by-side
- scale using real product datasets and enrichment sources

This project was built as a team capstone, but it is being designed like a real product with room for continued growth, monetization, and production scaling.

---

## Live Demo

- Main App: `https://beauty-ingredient-scanner.vercel.app/`
- Dashboard: `https://beauty-ingredient-scanner.vercel.app/dashboard`
- Compare: `https://beauty-ingredient-scanner.vercel.app/compare`

---

## Team

- **Taylor Poe** — product direction, full-stack implementation, UI/UX, architecture, dataset integration
- **Jacob Griffith** — data pipeline work, PubChem integration, backend/data enrichment
- **Alfredo Rosado** — presentation, product planning, future AI chatbox workflow and user interaction features

---

## Problem

Most consumers do not understand ingredient labels.

Existing beauty-scanner apps often:
- rely on generic scoring systems
- do not explain why a product is flagged
- do not support meaningful comparison
- do not personalize results
- provide limited transparency into ingredient-level concerns

This leaves users with a score, but not enough understanding to make a confident decision.

---

## Solution

This application creates a full import-and-analysis pipeline that powers a real product experience.

Users can:

- search for products
- scan ingredient labels using OCR
- analyze ingredients against a database
- receive a safety score
- compare products side-by-side
- get AI-driven explanations
- use packaging checks as an additional signal

The app is built on a real dataset pipeline rather than hardcoded demo data.

---

## Core Features

### MVP Features

- Product search
- Product comparison
- Ingredient label OCR scanning
- Ingredient parsing and matching
- Structured safety scoring
- Product score badges (green / yellow / red)
- Ingredient previews
- Flagged ingredient counts
- Imported product catalog support
- Database-backed UI

### Advanced Features / In Progress

- Packaging consistency checks
- PubChem enrichment for unknown ingredients
- Expanded ingredient normalization and aliases
- AI chatbox for ingredient/product questions
- Personalized scoring
- Alerts and saved product history

---

## Tech Stack

### Frontend
- **Next.js**
- **React**
- **Tailwind CSS**

### Backend
- **Next.js API Routes**
- **TypeScript**

### Database / ORM
- **PostgreSQL**
- **Prisma**

### OCR / AI / Enrichment
- **Google Vision API** for OCR
- **OpenAI API** for AI explanations
- **PubChem** enrichment service for unknown ingredients

### Deployment
- **Vercel**

### Data Pipeline
- Custom TypeScript scripts for:
  - Excel conversion
  - dataset transformation
  - batch imports
  - product + ingredient seeding

---

## Architecture

```mermaid
flowchart TD
    A[Raw Product Datasets / Regulatory Data]
    B[Transform Scripts]
    C[Seed Pipeline]
    D[(PostgreSQL Database)]
    E[Prisma ORM]
    F[Next.js API Routes]
    G[UI: Search / Compare / Scan]
    H[Google Vision OCR]
    I[PubChem Enrichment]
    J[OpenAI Explanations]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    F --> I
    F --> J

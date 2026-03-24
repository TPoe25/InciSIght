# AI Beauty Product Scanner – Team Capstone Pitch & Build Plan (Prisma Stack)
## Taylor Poe, Alfredo Rosado, Jacob Griffith
### 3-23-26

## Project Vision
We are building a web-based AI-powered beauty product scanner that helps users understand ingredient safety, personalize results, and make better purchasing decisions.
Instead of just labeling products as “good” or “bad,” our app focuses on:
explaining why a product is flagged
adapting results based on the user
suggesting safer alternatives
This project is designed as both a capstone and a scalable product, with long-term potential including monetization, AI-driven improvements, and real-world deployment.

## Problem
Consumers often do not understand ingredient labels.
Current apps:
use generic scoring
lack personalization
provide weak explanations
don’t support comparison

## Solution
### Users can:
upload product label images
search products
analyze ingredients
receive a safety score
get AI explanations
compare products and find alternatives

# Core Features (MVP)
OCR image scanning
Product search
Ingredient analysis
Safety scoring (green/yellow/red)
AI explanation
Safer alternatives

## Advanced Features
Personalized scoring
Custom ingredient alerts
Product comparison
AI assistant
Sustainability score

## Final Tech Stack (UPDATED)
Frontend
Next.js (React)
Hosted on Vercel
Backend
Next.js API routes (primary backend)
Optional Python microservice for OCR/AI
Database
PostgreSQL
ORM
Prisma
Authentication
NextAuth (recommended) OR JWT

## Why Prisma
Type-safe database queries
Clean relational modeling
Works perfectly with Next.js + Vercel
Faster development for team

## Architecture
Frontend (Next.js on Vercel)
↓
API Routes (Next.js backend)
↓
Prisma ORM
↓
PostgreSQL Database
Optional:
Python service for OCR + AI

## Authentication & Authorization
User login via NextAuth or JWT
Secure sessions
Protected routes
Role-based access (free vs premium)

## Async Processing
OCR runs asynchronously
AI processing handled in background
job queue system (future)

## AI System
AI is used for:
explanations
recommendations
comparisons
Future:
AI-assisted database updates
smarter personalization

## Database (Prisma + Postgres)
### Core models:
User
UserProfile
Product
Ingredient
ProductIngredient
Scan
Subscription

# Monetization
## Freemium model:
### Free:
basic scans
score
Premium:
unlimited scans
personalization
alerts
comparisons
AI insights

## Scaling
Vercel serverless scaling
PostgreSQL scaling
Redis (future)
Docker (future)

## Development Plan
Sprint 1: Setup
Sprint 2: DB + API
Sprint 3: OCR + scoring
Sprint 4: AI
Sprint 5: personalization
Sprint 6: polish

'''
“We’re building an AI-powered beauty scanner that explains ingredients and personalizes results.”
“We’re using Next.js with Prisma and PostgreSQL to build a scalable and production-ready system.”
'''

# Conclusion
## This project combines:
- full-stack dev
- AI
- scalable architecture
- and is designed to go beyond a capstone into a real product.

Prisma Setup

Privacy Policy

Terms of Service

In App Disclaimers

UI Walkthrough

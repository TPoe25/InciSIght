-- AI Beauty Product Scanner
-- PostgreSQL starter schema

-- Optional extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- ENUMS
-- =========================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'high');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_color') THEN
        CREATE TYPE score_color AS ENUM ('green', 'yellow', 'red');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE plan_type AS ENUM ('free', 'premium');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
        CREATE TYPE job_type AS ENUM (
            'ocr_scan',
            'ingredient_analysis',
            'ai_explanation',
            'alternative_recommendation',
            'database_sync'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider') THEN
        CREATE TYPE auth_provider AS ENUM ('local', 'google', 'github', 'apple');
    END IF;
END$$;

-- =========================
-- USERS / AUTH
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    auth_provider auth_provider NOT NULL DEFAULT 'local',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_password_or_oauth_chk
        CHECK (
            (auth_provider = 'local' AND password_hash IS NOT NULL)
            OR (auth_provider <> 'local')
        )
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
    ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

-- =========================
-- USER PROFILE / PREFERENCES
-- =========================

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(50),                 -- oily, dry, combination, sensitive
    pregnancy_safe_preference BOOLEAN NOT NULL DEFAULT FALSE,
    vegan_preference BOOLEAN NOT NULL DEFAULT FALSE,
    cruelty_free_preference BOOLEAN NOT NULL DEFAULT FALSE,
    fragrance_free_preference BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_allergies (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allergen_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, allergen_name)
);

CREATE TABLE IF NOT EXISTS user_ingredient_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    preference_type VARCHAR(50) NOT NULL, -- avoid, prefer, alert
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, ingredient_name, preference_type)
);

-- =========================
-- BRANDS / PRODUCTS
-- =========================

CREATE TABLE IF NOT EXISTS brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website_url TEXT,
    cruelty_free BOOLEAN,
    vegan BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id BIGINT REFERENCES brands(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),                -- cleanser, shampoo, lotion, etc.
    barcode VARCHAR(100) UNIQUE,
    size_label VARCHAR(100),
    ingredients_raw TEXT,
    description TEXT,
    image_url TEXT,
    base_score INTEGER CHECK (base_score BETWEEN 0 AND 100),
    base_score_color score_color,
    sustainability_score INTEGER CHECK (sustainability_score BETWEEN 0 AND 100),
    source VARCHAR(100),                  -- user_scan, admin, external_api
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name
    ON products(name);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_brand_id
    ON products(brand_id);

-- =========================
-- INGREDIENTS
-- =========================

CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inci_name VARCHAR(255) NOT NULL UNIQUE,
    common_name VARCHAR(255),
    risk_level risk_level NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    description TEXT,
    evidence_summary TEXT,
    concern_tags TEXT[] DEFAULT ARRAY[]::TEXT[],   -- e.g. irritation, allergen
    category VARCHAR(100),                         -- preservative, fragrance, etc.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_risk_level
    ON ingredients(risk_level);

CREATE TABLE IF NOT EXISTS ingredient_aliases (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    UNIQUE(ingredient_id, alias_name),
    UNIQUE(alias_name)
);

CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    ingredient_order INTEGER,
    concentration_note VARCHAR(100),
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient_id
    ON product_ingredients(ingredient_id);

-- =========================
-- PRODUCT FLAGS / ALTERNATIVES
-- =========================

CREATE TABLE IF NOT EXISTS product_flags (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    flag_type VARCHAR(100) NOT NULL,      -- fragrance, allergen, endocrine_concern
    flag_label VARCHAR(255) NOT NULL,
    severity risk_level NOT NULL,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_flags_product_id
    ON product_flags(product_id);

CREATE TABLE IF NOT EXISTS product_alternatives (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, alternative_product_id),
    CONSTRAINT product_alternatives_not_same_chk
        CHECK (product_id <> alternative_product_id)
);

-- =========================
-- SCANS / RESULTS
-- =========================

CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    uploaded_image_url TEXT,
    extracted_text TEXT,
    scan_source VARCHAR(50) NOT NULL,     -- ocr, barcode, search
    base_score INTEGER CHECK (base_score BETWEEN 0 AND 100),
    personalized_score INTEGER CHECK (personalized_score BETWEEN 0 AND 100),
    result_color score_color,
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id
    ON scans(user_id);

CREATE INDEX IF NOT EXISTS idx_scans_product_id
    ON scans(product_id);

CREATE TABLE IF NOT EXISTS scan_flagged_ingredients (
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    reason TEXT,
    PRIMARY KEY (scan_id, ingredient_id)
);

-- =========================
-- SAVED PRODUCTS / HISTORY
-- =========================

CREATE TABLE IF NOT EXISTS saved_products (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_a_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_b_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    comparison_summary TEXT,
    recommended_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_comparisons_not_same_chk
        CHECK (product_a_id <> product_b_id)
);

-- =========================
-- ALERTS / SUBSCRIPTIONS
-- =========================

CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,     -- ingredient, product, category
    target_value VARCHAR(255) NOT NULL,   -- fragrance, parabens, etc.
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan plan_type NOT NULL DEFAULT 'free',
    provider VARCHAR(50),                 -- stripe, app_store, etc.
    provider_customer_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- ASYNC JOBS / AI PIPELINE
-- =========================

CREATE TABLE IF NOT EXISTS async_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    job_type job_type NOT NULL,
    status job_status NOT NULL DEFAULT 'queued',
    input_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    output_payload JSONB,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_async_jobs_status
    ON async_jobs(status);

CREATE INDEX IF NOT EXISTS idx_async_jobs_job_type
    ON async_jobs(job_type);

CREATE TABLE IF NOT EXISTS ingredient_data_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) NOT NULL,    -- admin, external_feed, ai_pipeline
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    proposed_changes JSONB NOT NULL,
    review_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- UPDATED_AT TRIGGER
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ingredients_updated_at ON ingredients;
CREATE TRIGGER trg_ingredients_updated_at
BEFORE UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

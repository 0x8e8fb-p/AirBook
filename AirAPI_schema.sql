-- Airports Table
CREATE TABLE IF NOT EXISTS airports (
    airport_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    iata VARCHAR(3) UNIQUE,
    icao VARCHAR(4),
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    altitude INT,
    timezone VARCHAR(50),
    dst VARCHAR(1),
    tz_database_time_zone VARCHAR(255),
    type VARCHAR(50),
    source VARCHAR(50),
    info_url TEXT
);

-- Airlines Table
CREATE TABLE IF NOT EXISTS airlines (
    airline_id INT PRIMARY KEY,
    name VARCHAR(255),
    alias VARCHAR(255),
    iata VARCHAR(3) UNIQUE,
    icao VARCHAR(4),
    callsign VARCHAR(255),
    country VARCHAR(255),
    active VARCHAR(1)
);

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
    route_id SERIAL PRIMARY KEY,
    airline VARCHAR(3),
    airline_id INT REFERENCES airlines(airline_id) ON DELETE SET NULL,
    source_airport VARCHAR(3),
    source_airport_id INT REFERENCES airports(airport_id) ON DELETE CASCADE,
    destination_airport VARCHAR(3),
    destination_airport_id INT REFERENCES airports(airport_id) ON DELETE CASCADE,
    codeshare VARCHAR(1),
    stops INT,
    equipment VARCHAR(255)
);

-- Flight Prices Table
CREATE TABLE IF NOT EXISTS flight_prices (
    price_id SERIAL PRIMARY KEY,
    source_airport VARCHAR(3) REFERENCES airports(iata) ON DELETE CASCADE,
    destination_airport VARCHAR(3) REFERENCES airports(iata) ON DELETE CASCADE,
    airline VARCHAR(3) REFERENCES airlines(iata) ON DELETE CASCADE,
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    departure_date DATE,
    return_date DATE,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    source_api VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata);
CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata);
CREATE INDEX IF NOT EXISTS idx_routes_source_dest ON routes(source_airport, destination_airport);
CREATE INDEX IF NOT EXISTS idx_flight_prices_search ON flight_prices(source_airport, destination_airport, departure_date);

-- Live Flights Table (from OpenSky/ADS-B)
CREATE TABLE IF NOT EXISTS live_flights (
    id BIGSERIAL PRIMARY KEY,
    icao24 VARCHAR(20) NOT NULL,  -- Aircraft identifier
    callsign VARCHAR(20),
    origin_country VARCHAR(255),
    time_position BIGINT,
    last_contact BIGINT,
    longitude DECIMAL(11, 6),
    latitude DECIMAL(10, 6),
    baro_altitude REAL,
    on_ground BOOLEAN,
    velocity REAL,
    true_track REAL,
    vertical_rate REAL,
    sensors TEXT,
    geo_altitude REAL,
    squawk VARCHAR(20),
    spi BOOLEAN,
    position_source INT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_flights_icao ON live_flights(icao24);

-- Coupons & Deals Table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20), -- 'PERCENTAGE', 'FIXED', 'BOGO'
    discount_value DECIMAL(10, 2),
    max_discount DECIMAL(10, 2),
    
    -- Restrictions
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    min_spend DECIMAL(10, 2),
    applicable_airlines TEXT[],
    applicable_routes TEXT[],
    user_segment VARCHAR(50),  -- 'NEW', 'RETURNING', 'ALL'
    
    -- Indian Market / Partner Extensions
    bank_name VARCHAR(100),
    card_type VARCHAR(50),
    ota_name VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Source Tracking
    source_site VARCHAR(100),
    source_url TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    uses_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2),  -- Percentage of successful redemptions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_valid ON coupons(valid_from, valid_until);
-- GIN Indexes for efficient searching within text arrays
CREATE INDEX IF NOT EXISTS idx_coupons_airlines ON coupons USING GIN (applicable_airlines);
CREATE INDEX IF NOT EXISTS idx_coupons_routes ON coupons USING GIN (applicable_routes);

-- ============================================================================
-- AirAPI Platform: API key auth, usage tracking
-- ============================================================================

-- API Keys: clients authenticate with X-Client-Id + X-Api-Key (hashed).
CREATE TABLE IF NOT EXISTS api_keys (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id      TEXT UNIQUE NOT NULL,
    api_key_hash   TEXT NOT NULL,
    tier           TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','enterprise')),
    monthly_quota  INTEGER NOT NULL DEFAULT 10000,
    name           TEXT,
    email          TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(client_id) WHERE is_active = true;

-- Daily usage rollup (populated by nightly cron from Redis counters).
CREATE TABLE IF NOT EXISTS usage_logs (
    id           BIGSERIAL PRIMARY KEY,
    client_id    TEXT NOT NULL,
    day          DATE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    error_count  INTEGER NOT NULL DEFAULT 0,
    UNIQUE (client_id, day)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_day ON usage_logs(day);
CREATE INDEX IF NOT EXISTS idx_usage_logs_client ON usage_logs(client_id, day DESC);

-- Unique constraint for idempotent fare inserts (prevents duplicate scraper rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_flight_prices_unique
    ON flight_prices (source_airport, destination_airport, airline, departure_date, source_api);

-- Scraper health: per-source latest status, filled by scrapers via upsert.
CREATE TABLE IF NOT EXISTS sources_health (
    source      TEXT PRIMARY KEY,
    last_ok     TIMESTAMPTZ,
    last_error  TIMESTAMPTZ,
    last_error_msg TEXT,
    fail_streak INTEGER NOT NULL DEFAULT 0,
    circuit_open BOOLEAN NOT NULL DEFAULT false,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

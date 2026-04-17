-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    affiliate_code VARCHAR(10) UNIQUE NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('upi', 'bank')),
    payment_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    terms_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create affiliate_visits table
CREATE TABLE IF NOT EXISTS affiliate_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
    visitor_ip VARCHAR(45) NOT NULL,
    user_id UUID REFERENCES users(id),
    first_visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255)
);

-- Create affiliate_sales table
CREATE TABLE IF NOT EXISTS affiliate_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    commission_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_affiliate_id ON affiliate_visits(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate_id ON affiliate_sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_code ON affiliates(affiliate_code);

-- Disable RLS since we're using service role for all operations
ALTER TABLE affiliates DISABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_sales DISABLE ROW LEVEL SECURITY; 
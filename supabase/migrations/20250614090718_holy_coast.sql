-- Enable Row Level Security
-- ALTER DATABASE postgres SET "app.jwt_secret" TO '<your-jwt-secret-here>';
-- Set the JWT secret manually in your deployment environment, not in version control.

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  algorand_address TEXT NOT NULL,
  encrypted_seed TEXT NOT NULL,
  total_sent DECIMAL(20,6) DEFAULT 0,
  total_received DECIMAL(20,6) DEFAULT 0,
  is_pro BOOLEAN DEFAULT FALSE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL UNIQUE,
  amount_micro_algos BIGINT NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  recipient_address TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('send', 'receive')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for transactions table
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_algorand_address ON users(algorand_address);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create functions for seed encryption/decryption (placeholder - implement with Supabase Vault)
CREATE OR REPLACE FUNCTION encrypt_seed(seed TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use Supabase Vault for encryption
  -- This is a placeholder implementation
  RETURN seed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_seed(encrypted_seed TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use Supabase Vault for decryption
  -- This is a placeholder implementation
  RETURN encrypted_seed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT EXECUTE ON FUNCTION encrypt_seed(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_seed(TEXT) TO authenticated;
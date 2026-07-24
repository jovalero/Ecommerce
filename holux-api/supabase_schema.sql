-- ==========================================
-- HOLUX DATABASE SCHEMA FOR SUPABASE (UPDATED)
-- Run this script inside the Supabase SQL Editor
-- ==========================================

-- 1. CLEANUP (Optional / Development)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

-- 2. CREATE TABLES

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    installments INT NOT NULL DEFAULT 1 CHECK (installments >= 1),
    icon TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles Table (Extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for guest checkouts
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity >= 1),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);

-- Addresses Table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g. "Casa", "Trabajo"
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 4. CONFIGURE RLS POLICIES

-- Categories: Public read access
CREATE POLICY "Allow public select for categories" 
ON categories FOR SELECT 
TO anon, authenticated 
USING (true);

-- Products: Public read access
CREATE POLICY "Allow public select for products" 
ON products FOR SELECT 
TO anon, authenticated 
USING (true);

-- Profiles Policies
CREATE POLICY "Allow users to select their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Addresses Policies
CREATE POLICY "Allow users to manage their own addresses" 
ON addresses FOR ALL 
TO authenticated 
USING (auth.uid() = customer_id);

-- Reviews Policies
CREATE POLICY "Allow public select for approved reviews" 
ON reviews FOR SELECT 
TO anon, authenticated 
USING (approved = true);

CREATE POLICY "Allow users to insert their own reviews" 
ON reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Allow users to update their own reviews" 
ON reviews FOR UPDATE 
TO authenticated 
USING (auth.uid() = customer_id);

CREATE POLICY "Allow users to delete their own reviews" 
ON reviews FOR DELETE 
TO authenticated 
USING (auth.uid() = customer_id);

-- Orders Policies
CREATE POLICY "Allow users to select their own orders" 
ON orders FOR SELECT 
TO authenticated 
USING (auth.uid() = customer_id);

-- Order Items Policies
CREATE POLICY "Allow users to select their own order items" 
ON order_items FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.customer_id = auth.uid()
    )
);

-- Note: No write/insert/update policies are needed for orders and order_items 
-- because these actions are executed via Laravel backend using the `service_role` key,
-- which automatically bypasses RLS in Supabase.

-- 5. AUTOMATIC PROFILE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Cliente HOLUX'),
    new.raw_user_meta_data->>'phone',
    'customer',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SEED DATA

-- Insert Categories
INSERT INTO categories (id, name, slug) VALUES
('c1a2f3b4-1234-5678-90ab-cdef11111111', 'Trekking', 'trekking'),
('c2b3f4c5-1234-5678-90ab-cdef22222222', 'Camping', 'camping'),
('c3c4f5d6-1234-5678-90ab-cdef33333333', 'Calzado', 'calzado'),
('c4d5f6e7-1234-5678-90ab-cdef44444444', 'Accesorios', 'accesorios');

-- Insert Products
INSERT INTO products (name, brand, category_id, price, installments, icon, stock) VALUES
('Campera Cortavientos Fitz Roy', 'Holux Gear', 'c1a2f3b4-1234-5678-90ab-cdef11111111', 89000.00, 6, 'Wind', 15),
('Pantalón Técnico Lanín', 'Holux Gear', 'c1a2f3b4-1234-5678-90ab-cdef11111111', 62000.00, 6, 'Layers', 20),
('Carpa Domo Refugio 2P', 'Holux Gear', 'c2b3f4c5-1234-5678-90ab-cdef22222222', 145000.00, 6, 'Tent', 8),
('Bolsa de Dormir Alpamayo -10°C', 'Holux Gear', 'c2b3f4c5-1234-5678-90ab-cdef22222222', 78000.00, 6, 'Flame', 12),
('Botas de Trekking Tronador', 'Holux Footwear', 'c3c4f5d6-1234-5678-90ab-cdef33333333', 110000.00, 6, 'Footprints', 14),
('Mochila Cordillera 65L', 'Holux Gear', 'c4d5f6e7-1234-5678-90ab-cdef44444444', 95000.00, 6, 'Backpack', 10),
('Bastones de Trekking Trail', 'Holux Gear', 'c4d5f6e7-1234-5678-90ab-cdef44444444', 28000.00, 3, 'ChevronsUp', 25),
('Termo Acero Inox 1L', 'Holux Gear', 'c4d5f6e7-1234-5678-90ab-cdef44444444', 34000.00, 3, 'CupSoda', 30);

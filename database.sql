-- ================================================
-- SCRIPT SQL PARA SUPABASE - UX KIT EXPRESS
-- ================================================
-- Ejecuta este script en el SQL Editor de Supabase

-- Habilitar extensión UUID (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLA: users
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  current_plan TEXT DEFAULT 'free' CHECK (current_plan IN ('free', 'basic', 'advance', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_current_plan ON users(current_plan);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TABLA: transactions
-- ================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'advance', 'pro', 'enterprise')),
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ================================================
-- TABLA: products (recursos UX/UI)
-- ================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('component', 'template', 'icon', 'illustration', 'tool')),
  subcategory TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  file_url TEXT,
  tags TEXT[], -- Array de tags para búsqueda
  required_plan TEXT DEFAULT 'free' CHECK (required_plan IN ('free', 'basic', 'advance', 'pro', 'enterprise')),
  downloads_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_required_plan ON products(required_plan);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TABLA: downloads (historial de descargas)
-- ================================================
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_product_id ON downloads(product_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at DESC);

-- Constraint para evitar duplicados en el mismo día
-- NOTA: Este índice causa error "functions must be marked IMMUTABLE" con TIMESTAMP WITH TIME ZONE
-- Si necesitas evitar descargas duplicadas por día, impleméntalo a nivel de aplicación
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_downloads_unique_user_product_date 
-- ON downloads(user_id, product_id, (downloaded_at::date));

-- ================================================
-- TABLA: favorites (favoritos de usuarios)
-- ================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- ================================================
-- TABLA: reviews (reseñas de productos)
-- ================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TABLA: contact_messages (mensajes de contacto)
-- ================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- ================================================
-- FUNCIÓN: Actualizar rating promedio del producto
-- ================================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar rating
DROP TRIGGER IF EXISTS update_product_rating_on_review ON reviews;
CREATE TRIGGER update_product_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ================================================
-- FUNCIÓN: Incrementar contador de descargas
-- ================================================
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET downloads_count = downloads_count + 1
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar descargas
DROP TRIGGER IF EXISTS increment_download_count_on_download ON downloads;
CREATE TRIGGER increment_download_count_on_download
AFTER INSERT ON downloads
FOR EACH ROW EXECUTE FUNCTION increment_download_count();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para users (los usuarios solo pueden ver/editar su propio perfil)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para transactions (los usuarios solo ven sus transacciones)
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para products (todos pueden ver productos activos)
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = TRUE);

-- Políticas para downloads (usuarios ven sus descargas)
CREATE POLICY "Users can view own downloads" ON downloads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para favorites
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reviews
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ================================================

-- Insertar algunos productos de ejemplo
INSERT INTO products (name, description, category, subcategory, tags, required_plan, is_featured, thumbnail_url)
VALUES
  ('Button Component Pack', 'Colección de 50+ botones modernos listos para usar', 'component', 'buttons', ARRAY['buttons', 'ui', 'components'], 'free', TRUE, '/images/components/buttons.jpg'),
  ('Dashboard Template Pro', 'Template completo de dashboard con gráficos y tablas', 'template', 'dashboard', ARRAY['dashboard', 'admin', 'template'], 'pro', TRUE, '/images/templates/dashboard.jpg'),
  ('Icon Set 500+', 'Set de 500 iconos vectoriales en múltiples estilos', 'icon', 'general', ARRAY['icons', 'svg', 'vectors'], 'basic', FALSE, '/images/icons/icon-set.jpg'),
  ('Login Page Templates', '10 templates de páginas de login modernas', 'template', 'auth', ARRAY['login', 'auth', 'forms'], 'basic', TRUE, '/images/templates/login.jpg'),
  ('Illustration Pack Nature', 'Pack de 30 ilustraciones de naturaleza', 'illustration', 'nature', ARRAY['illustrations', 'nature', 'svg'], 'advance', FALSE, '/images/illustrations/nature.jpg')
ON CONFLICT DO NOTHING;

-- ================================================
-- VISTAS ÚTILES
-- ================================================

-- Vista: Productos más descargados
CREATE OR REPLACE VIEW popular_products AS
SELECT 
  p.*,
  COUNT(d.id) as total_downloads
FROM products p
LEFT JOIN downloads d ON p.id = d.product_id
WHERE p.is_active = TRUE
GROUP BY p.id
ORDER BY total_downloads DESC, p.created_at DESC;

-- Vista: Estadísticas de usuarios
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.current_plan,
  COUNT(DISTINCT d.id) as total_downloads,
  COUNT(DISTINCT f.id) as total_favorites,
  COUNT(DISTINCT r.id) as total_reviews
FROM users u
LEFT JOIN downloads d ON u.id = d.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN reviews r ON u.id = r.user_id
GROUP BY u.id;

-- ================================================
-- FIN DEL SCRIPT
-- ================================================

-- Verificar que todo se creó correctamente
SELECT 
  'Tables created:' as info,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
COMMENT ON TABLE transactions IS 'Historial de transacciones y pagos';
COMMENT ON TABLE products IS 'Catálogo de productos/recursos UX/UI';
COMMENT ON TABLE downloads IS 'Registro de descargas de productos';
COMMENT ON TABLE favorites IS 'Productos favoritos de los usuarios';
COMMENT ON TABLE reviews IS 'Reseñas y calificaciones de productos';

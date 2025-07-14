-- AgriDistriConnect Database Schema
-- PostgreSQL Implementation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =======================
-- CORE TABLES
-- =======================

-- Organizations/Structures
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Agents, Supervisors, Administrators)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(100),
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geographic Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('country', 'region', 'department', 'commune', 'village')),
    parent_id UUID REFERENCES locations(id),
    code VARCHAR(50),
    coordinates GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distribution Sites
CREATE TABLE distribution_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    location_id UUID REFERENCES locations(id),
    address TEXT,
    coordinates GEOMETRY(POINT, 4326),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agricultural Inputs
CREATE TABLE agricultural_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL, -- seeds, fertilizers, pesticides, equipment
    subcategory VARCHAR(100),
    unit VARCHAR(20) NOT NULL, -- kg, liters, pieces, bags
    unit_price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beneficiaries
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    card_number VARCHAR(50) UNIQUE NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    age INTEGER,
    location_id UUID REFERENCES locations(id),
    address TEXT,
    coordinates GEOMETRY(POINT, 4326),
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(12,2),
    target_beneficiaries INTEGER,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Inputs (What inputs are available in each campaign)
CREATE TABLE campaign_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    input_id UUID REFERENCES agricultural_inputs(id) ON DELETE CASCADE,
    max_quantity_per_beneficiary DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    subsidy_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, input_id)
);

-- Beneficiary Entitlements
CREATE TABLE beneficiary_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    input_id UUID REFERENCES agricultural_inputs(id) ON DELETE CASCADE,
    entitled_quantity DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,2) DEFAULT 0,
    remaining_quantity DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(beneficiary_id, campaign_id, input_id)
);

-- Inventory/Stock Management
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES distribution_sites(id) ON DELETE CASCADE,
    input_id UUID REFERENCES agricultural_inputs(id) ON DELETE CASCADE,
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_threshold DECIMAL(10,2) DEFAULT 0,
    maximum_capacity DECIMAL(10,2),
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, input_id)
);

-- Stock Movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'adjustment', 'transfer')),
    quantity DECIMAL(10,2) NOT NULL,
    previous_stock DECIMAL(10,2) NOT NULL,
    new_stock DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50), -- 'distribution', 'restock', 'adjustment', 'transfer'
    reference_id UUID,
    notes TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributions
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_number VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    site_id UUID REFERENCES distribution_sites(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id),
    distribution_date TIMESTAMP NOT NULL,
    coordinates GEOMETRY(POINT, 4326),
    is_representative BOOLEAN DEFAULT false,
    representative_document_url VARCHAR(500),
    payment_method VARCHAR(50) DEFAULT 'free' CHECK (payment_method IN ('free', 'cash', 'mobile_money', 'subsidized')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_reference VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    receipt_url VARCHAR(500),
    notes TEXT,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distribution Items
CREATE TABLE distribution_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID REFERENCES distributions(id) ON DELETE CASCADE,
    input_id UUID REFERENCES agricultural_inputs(id) ON DELETE CASCADE,
    planned_quantity DECIMAL(10,2) NOT NULL,
    distributed_quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    subsidy_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages/Communications
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'info' CHECK (message_type IN ('info', 'alert', 'warning', 'campaign')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'agents', 'beneficiaries', 'specific')),
    location_filter UUID REFERENCES locations(id),
    gender_filter VARCHAR(10) CHECK (gender_filter IN ('male', 'female', 'other')),
    is_active BOOLEAN DEFAULT true,
    scheduled_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supervision Reports
CREATE TABLE supervision_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supervisor_id UUID REFERENCES users(id),
    site_id UUID REFERENCES distribution_sites(id),
    report_date DATE NOT NULL,
    observations TEXT,
    issues_found TEXT,
    recommendations TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital Library
CREATE TABLE digital_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'restricted', 'private')),
    tags TEXT[],
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions (for tracking and security)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

-- Users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_email ON users(email);

-- Beneficiaries
CREATE INDEX idx_beneficiaries_organization_id ON beneficiaries(organization_id);
CREATE INDEX idx_beneficiaries_card_number ON beneficiaries(card_number);
CREATE INDEX idx_beneficiaries_qr_code ON beneficiaries(qr_code);
CREATE INDEX idx_beneficiaries_location_id ON beneficiaries(location_id);

-- Distributions
CREATE INDEX idx_distributions_beneficiary_id ON distributions(beneficiary_id);
CREATE INDEX idx_distributions_campaign_id ON distributions(campaign_id);
CREATE INDEX idx_distributions_site_id ON distributions(site_id);
CREATE INDEX idx_distributions_agent_id ON distributions(agent_id);
CREATE INDEX idx_distributions_date ON distributions(distribution_date);
CREATE INDEX idx_distributions_sync_status ON distributions(sync_status);

-- Distribution Items
CREATE INDEX idx_distribution_items_distribution_id ON distribution_items(distribution_id);
CREATE INDEX idx_distribution_items_input_id ON distribution_items(input_id);

-- Inventory
CREATE INDEX idx_inventory_site_id ON inventory(site_id);
CREATE INDEX idx_inventory_input_id ON inventory(input_id);

-- Stock Movements
CREATE INDEX idx_stock_movements_inventory_id ON stock_movements(inventory_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Spatial indexes
CREATE INDEX idx_locations_coordinates ON locations USING GIST(coordinates);
CREATE INDEX idx_distribution_sites_coordinates ON distribution_sites USING GIST(coordinates);
CREATE INDEX idx_beneficiaries_coordinates ON beneficiaries USING GIST(coordinates);
CREATE INDEX idx_distributions_coordinates ON distributions USING GIST(coordinates);

-- =======================
-- TRIGGERS AND FUNCTIONS
-- =======================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distribution_sites_updated_at BEFORE UPDATE ON distribution_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agricultural_inputs_updated_at BEFORE UPDATE ON agricultural_inputs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON beneficiaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beneficiary_entitlements_updated_at BEFORE UPDATE ON beneficiary_entitlements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update remaining quantity in entitlements
CREATE OR REPLACE FUNCTION update_remaining_quantity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_quantity = NEW.entitled_quantity - NEW.received_quantity;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entitlements_remaining_quantity 
    BEFORE INSERT OR UPDATE ON beneficiary_entitlements 
    FOR EACH ROW EXECUTE FUNCTION update_remaining_quantity();

-- =======================
-- SAMPLE DATA INSERTS
-- =======================

-- Insert default roles
INSERT INTO roles (id, name, description, permissions) VALUES 
    (uuid_generate_v4(), 'admin', 'System Administrator', '{"all": true}'),
    (uuid_generate_v4(), 'supervisor', 'Field Supervisor', '{"view": true, "create": true, "update": true, "supervise": true}'),
    (uuid_generate_v4(), 'agent', 'Distribution Agent', '{"view": true, "create": true, "update": false, "distribute": true}'),
    (uuid_generate_v4(), 'operator', 'Data Operator', '{"view": true, "create": true, "update": true, "distribute": false}');

-- Insert sample organization
INSERT INTO organizations (id, name, code, phone, email, status) VALUES 
    (uuid_generate_v4(), 'AgriDistriConnect Demo', 'ADC_DEMO', '+225 01 02 03 04 05', 'admin@agridistri.com', 'active');

-- Insert sample locations
INSERT INTO locations (id, name, type, code) VALUES 
    (uuid_generate_v4(), 'Côte d''Ivoire', 'country', 'CI'),
    (uuid_generate_v4(), 'Centre', 'region', 'CE'),
    (uuid_generate_v4(), 'Yamoussoukro', 'department', 'YAM'),
    (uuid_generate_v4(), 'Attiégouakro', 'commune', 'ATT'),
    (uuid_generate_v4(), 'Kokrenou', 'village', 'KOK');

-- Insert sample agricultural inputs
INSERT INTO agricultural_inputs (id, name, code, category, subcategory, unit, unit_price, description) VALUES 
    (uuid_generate_v4(), 'Semence de Maïs', 'SEED_MAIZE', 'seeds', 'cereals', 'kg', 2500.00, 'Semence de maïs hybride haute performance'),
    (uuid_generate_v4(), 'Engrais NPK', 'FERT_NPK', 'fertilizers', 'compound', 'kg', 1200.00, 'Engrais NPK 15-15-15 pour céréales'),
    (uuid_generate_v4(), 'Insecticide Lambda', 'PEST_LAMBDA', 'pesticides', 'insecticide', 'L', 8500.00, 'Insecticide à base de lambda-cyhalothrine');

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS public.contributions CASCADE;
DROP TABLE IF EXISTS public.gift_items CASCADE;
DROP TABLE IF EXISTS public.registries CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;

-- Create registries table
CREATE TABLE public.registries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    occasion TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT false,
    show_contributor_names BOOLEAN DEFAULT true,
    show_contribution_amounts BOOLEAN DEFAULT true,
    allow_partial_contributions BOOLEAN DEFAULT true,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active'
);

-- Create gift_items table
CREATE TABLE public.gift_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_id UUID REFERENCES public.registries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    url TEXT,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    notes TEXT
);

-- Create contributions table
CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_item_id UUID REFERENCES public.gift_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,
    payment_status TEXT
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    gift_item_id UUID REFERENCES public.gift_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, gift_item_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_registries_user_id ON public.registries(user_id);
CREATE INDEX idx_gift_items_registry_id ON public.gift_items(registry_id);
CREATE INDEX idx_contributions_gift_item_id ON public.contributions(gift_item_id);
CREATE INDEX idx_contributions_user_id ON public.contributions(user_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_gift_item_id ON public.favorites(gift_item_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Registry policies
CREATE POLICY "Public registries are viewable by everyone" ON public.registries
    FOR SELECT USING (NOT is_private OR auth.uid() = user_id);

CREATE POLICY "Users can create their own registries" ON public.registries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registries" ON public.registries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registries" ON public.registries
    FOR DELETE USING (auth.uid() = user_id);

-- Gift items policies
CREATE POLICY "Gift items are viewable by everyone if registry is public" ON public.gift_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.registries
            WHERE registries.id = gift_items.registry_id
            AND (NOT registries.is_private OR registries.user_id = auth.uid())
        )
    );

CREATE POLICY "Registry owners can manage gift items" ON public.gift_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.registries
            WHERE registries.id = gift_items.registry_id
            AND registries.user_id = auth.uid()
        )
    );

-- Contributions policies
CREATE POLICY "Contributions are viewable by registry owner and contributor" ON public.contributions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.gift_items
            JOIN public.registries ON gift_items.registry_id = registries.id
            WHERE gift_items.id = contributions.gift_item_id
            AND registries.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create contributions" ON public.contributions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own contributions" ON public.contributions
    FOR UPDATE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can manage their own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.registries TO authenticated;
GRANT ALL ON public.gift_items TO authenticated;
GRANT ALL ON public.contributions TO authenticated;
GRANT ALL ON public.favorites TO authenticated; 
-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.contributions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.gift_items CASCADE;
DROP TABLE IF EXISTS public.registries CASCADE;

-- Create registries table
CREATE TABLE public.registries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    occasion TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE,
    is_private BOOLEAN DEFAULT false,
    password TEXT,
    show_contributor_names BOOLEAN DEFAULT true,
    allow_anonymous_contributions BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create gift_items table
CREATE TABLE public.gift_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_id UUID REFERENCES public.registries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    link TEXT,
    is_purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contributions table
CREATE TABLE public.contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_item_id UUID REFERENCES public.gift_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create comments table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_id UUID REFERENCES public.registries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    gift_item_id UUID REFERENCES public.gift_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, gift_item_id)
);

-- Create indexes for better performance
CREATE INDEX registries_user_id_idx ON public.registries(user_id);
CREATE INDEX registries_profile_id_idx ON public.registries(profile_id);
CREATE INDEX gift_items_registry_id_idx ON public.gift_items(registry_id);
CREATE INDEX contributions_gift_item_id_idx ON public.contributions(gift_item_id);
CREATE INDEX contributions_user_id_idx ON public.contributions(user_id);
CREATE INDEX contributions_profile_id_idx ON public.contributions(profile_id);
CREATE INDEX comments_registry_id_idx ON public.comments(registry_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);
CREATE INDEX comments_profile_id_idx ON public.comments(profile_id);
CREATE INDEX favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX favorites_profile_id_idx ON public.favorites(profile_id);
CREATE INDEX favorites_gift_item_id_idx ON public.favorites(gift_item_id);

-- Enable RLS on all tables
ALTER TABLE public.registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public registries" ON public.registries;
DROP POLICY IF EXISTS "Users can view their own registries" ON public.registries;
DROP POLICY IF EXISTS "Users can create registries" ON public.registries;
DROP POLICY IF EXISTS "Users can update their own registries" ON public.registries;
DROP POLICY IF EXISTS "Users can delete their own registries" ON public.registries;
DROP POLICY IF EXISTS "Users can view gift items for public registries" ON public.gift_items;
DROP POLICY IF EXISTS "Users can create gift items for their registries" ON public.gift_items;
DROP POLICY IF EXISTS "Users can update gift items in their registries" ON public.gift_items;
DROP POLICY IF EXISTS "Users can delete gift items from their registries" ON public.gift_items;
DROP POLICY IF EXISTS "Users can view contributions for public registries" ON public.contributions;
DROP POLICY IF EXISTS "Users can create contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can view comments for public registries" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

-- Create RLS policies for registries
CREATE POLICY "Users can view public registries"
ON public.registries FOR SELECT
USING (NOT is_private OR user_id = auth.uid());

CREATE POLICY "Users can view their own registries"
ON public.registries FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create registries"
ON public.registries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registries"
ON public.registries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registries"
ON public.registries FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for gift_items
CREATE POLICY "Users can view gift items for public registries"
ON public.gift_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.registries
        WHERE registries.id = gift_items.registry_id
        AND (NOT registries.is_private OR registries.user_id = auth.uid())
    )
);

CREATE POLICY "Users can create gift items for their registries"
ON public.gift_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.registries
        WHERE registries.id = gift_items.registry_id
        AND registries.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update gift items in their registries"
ON public.gift_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.registries
        WHERE registries.id = gift_items.registry_id
        AND registries.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete gift items from their registries"
ON public.gift_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.registries
        WHERE registries.id = gift_items.registry_id
        AND registries.user_id = auth.uid()
    )
);

-- Create RLS policies for contributions
CREATE POLICY "Users can view contributions for public registries"
ON public.contributions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gift_items
        JOIN public.registries ON registries.id = gift_items.registry_id
        WHERE gift_items.id = contributions.gift_item_id
        AND (NOT registries.is_private OR registries.user_id = auth.uid())
    )
);

CREATE POLICY "Users can create contributions"
ON public.contributions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.gift_items
        JOIN public.registries ON registries.id = gift_items.registry_id
        WHERE gift_items.id = contributions.gift_item_id
        AND (NOT registries.is_private OR registries.user_id = auth.uid())
    )
);

-- Create RLS policies for comments
CREATE POLICY "Users can view comments for public registries"
ON public.comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.registries
        WHERE registries.id = comments.registry_id
        AND (NOT registries.is_private OR registries.user_id = auth.uid())
    )
);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.registries
        WHERE registries.id = comments.registry_id
        AND (NOT registries.is_private OR registries.user_id = auth.uid())
    )
);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id); 
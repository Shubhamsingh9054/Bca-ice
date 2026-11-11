-- ==============================================================================
-- BCA ICE CREAM WALA - SUPABASE STORAGE BUCKET CONFIGURATION
-- Run this in Supabase SQL Editor if you want to host custom product images in Supabase Storage.
-- ==============================================================================

-- 1. Create a public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- 3. Allow authenticated & admin users to upload images
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-images');

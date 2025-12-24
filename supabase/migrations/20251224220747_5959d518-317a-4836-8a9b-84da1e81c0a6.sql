
-- Create table for remembering sales matching pairs
CREATE TABLE public.sales_matching_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  csv_name TEXT NOT NULL,
  csv_price NUMERIC NOT NULL,
  inventory_item_id TEXT NOT NULL,
  inventory_item_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate mappings
CREATE UNIQUE INDEX idx_unique_csv_mapping ON public.sales_matching_mappings (csv_name, csv_price);

-- Enable Row Level Security (public access since no auth)
ALTER TABLE public.sales_matching_mappings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth in this app)
CREATE POLICY "Allow all access to sales_matching_mappings" 
ON public.sales_matching_mappings 
FOR ALL 
USING (true)
WITH CHECK (true);

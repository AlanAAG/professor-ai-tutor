-- Fix missing RLS policies for messages table
CREATE POLICY "Users can update messages in their conversations" 
ON public.messages 
FOR UPDATE 
USING (is_conversation_owner(conversation_id, auth.uid()));

CREATE POLICY "Users can delete messages in their conversations" 
ON public.messages 
FOR DELETE 
USING (is_conversation_owner(conversation_id, auth.uid()));

-- Fix missing RLS policies for feedback table
CREATE POLICY "Users can update their own feedback" 
ON public.feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" 
ON public.feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix visitor_stats to only allow authenticated admins (or service role)
-- Remove the public policy and restrict access
DROP POLICY IF EXISTS "Anyone can view visitor stats" ON public.visitor_stats;

-- Create a more restrictive policy - only authenticated users can view
CREATE POLICY "Authenticated users can view visitor stats" 
ON public.visitor_stats 
FOR SELECT 
USING (auth.role() = 'authenticated');
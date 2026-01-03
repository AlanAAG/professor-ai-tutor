-- Add columns for chat management to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on pinned and archived conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_pinned ON public.conversations(is_pinned);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON public.conversations(is_archived);

-- Allow users to delete their own conversations
CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add message_id column to message_feedback table if not already exists with proper foreign key
-- First, let's update the message_feedback table to use UUID for message_id
-- The current schema already has message_id as UUID with foreign key to messages table

-- Create index on message_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON public.message_feedback(message_id);
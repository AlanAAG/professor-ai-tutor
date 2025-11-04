-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  class_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check conversation ownership
CREATE OR REPLACE FUNCTION public.is_conversation_owner(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (public.is_conversation_owner(conversation_id, auth.uid()));

CREATE POLICY "Users can create messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (public.is_conversation_owner(conversation_id, auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id, updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();
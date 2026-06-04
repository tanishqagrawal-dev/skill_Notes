-- Run this in your Supabase SQL Editor

-- 1. Ensure the required counting columns exist on approved_notes
ALTER TABLE public.approved_notes 
ADD COLUMN IF NOT EXISTS upvotes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- 2. Ensure the note_votes tracking table exists
CREATE TABLE IF NOT EXISTS public.note_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES public.approved_notes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote_type INT NOT NULL, -- 1 for upvote, -1 for downvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(note_id, user_id)
);

-- 3. Replace the vote_note RPC to correctly adjust the upvotes/downvotes
CREATE OR REPLACE FUNCTION public.vote_note(
    p_note_id UUID,
    p_user_id TEXT,
    p_vote_type INT
)
RETURNS VOID AS $$
DECLARE
    v_existing_vote INT;
BEGIN
    -- Check if vote already exists for this user and note
    SELECT vote_type INTO v_existing_vote 
    FROM public.note_votes 
    WHERE note_id = p_note_id AND user_id = p_user_id;

    IF FOUND THEN
        IF v_existing_vote = p_vote_type THEN
            -- User clicked the same vote button, so remove the vote (toggle off)
            DELETE FROM public.note_votes 
            WHERE note_id = p_note_id AND user_id = p_user_id;
            
            -- Decrement the appropriate counter
            IF p_vote_type = 1 THEN
                UPDATE public.approved_notes SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = p_note_id;
            ELSIF p_vote_type = -1 THEN
                UPDATE public.approved_notes SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = p_note_id;
            END IF;
        ELSE
            -- User changed their vote
            UPDATE public.note_votes 
            SET vote_type = p_vote_type, created_at = NOW()
            WHERE note_id = p_note_id AND user_id = p_user_id;
            
            -- Adjust both counters
            IF p_vote_type = 1 THEN
                UPDATE public.approved_notes 
                SET upvotes = upvotes + 1, downvotes = GREATEST(downvotes - 1, 0) 
                WHERE id = p_note_id;
            ELSIF p_vote_type = -1 THEN
                UPDATE public.approved_notes 
                SET downvotes = downvotes + 1, upvotes = GREATEST(upvotes - 1, 0) 
                WHERE id = p_note_id;
            END IF;
        END IF;
    ELSE
        -- No existing vote, insert a new one
        INSERT INTO public.note_votes (note_id, user_id, vote_type)
        VALUES (p_note_id, p_user_id, p_vote_type);
        
        -- Increment the appropriate counter
        IF p_vote_type = 1 THEN
            UPDATE public.approved_notes SET upvotes = upvotes + 1 WHERE id = p_note_id;
        ELSIF p_vote_type = -1 THEN
            UPDATE public.approved_notes SET downvotes = downvotes + 1 WHERE id = p_note_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Replace the increment_note_view RPC to correctly increment views
CREATE OR REPLACE FUNCTION public.increment_note_view(p_note_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.approved_notes
    SET views = COALESCE(views, 0) + 1
    WHERE id = p_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

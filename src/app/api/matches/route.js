import { supabase } from '@/lib/supabase';

// GET /api/matches — list matches with optional filters
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const subreddit = searchParams.get('subreddit');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    if (status === 'active') {
      // Show new + drafted (not sent/archived/deleted)
      query = query.in('status', ['new', 'drafted']);
    } else {
      query = query.eq('status', status);
    }
  } else {
    // Default: exclude deleted
    query = query.neq('status', 'deleted');
  }

  if (subreddit && subreddit !== 'all') {
    query = query.eq('subreddit', subreddit);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ matches: data });
}

// PATCH /api/matches — update a match (status, draft_response)
export async function PATCH(request) {
  const body = await request.json();
  const { id, status, draft_response } = body;

  if (!id) {
    return Response.json({ error: 'Missing match id' }, { status: 400 });
  }

  const updates = {};
  if (status) {
    updates.status = status;
    if (status === 'sent') {
      updates.responded_at = new Date().toISOString();
    }
  }
  if (draft_response !== undefined) {
    updates.draft_response = draft_response;
    if (!updates.status) {
      updates.status = 'drafted';
    }
  }

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ match: data });
}

// DELETE /api/matches — soft delete (set status to 'deleted')
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing match id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('matches')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

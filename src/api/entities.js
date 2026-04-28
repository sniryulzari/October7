import { supabase } from './supabaseClient';

const parseOrderBy = (orderBy) => {
  if (!orderBy) return { column: 'created_date', ascending: false };
  const ascending = !orderBy.startsWith('-');
  const column = orderBy.replace(/^-/, '');
  return { column, ascending };
};

export const Location = {
  async list(orderBy) {
    const { column, ascending } = parseOrderBy(orderBy);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order(column, { ascending });
    if (error) throw error;
    return data;
  },

  async filter(query) {
    let q = supabase.from('locations').select('*');
    Object.entries(query).forEach(([key, value]) => {
      q = q.eq(key, value);
    });
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async get(id) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(locationData) {
    const { data, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async incrementViewCount(id) {
    const { error } = await supabase.rpc('increment_view_count', { location_id: id });
    if (error) throw error;
  },

  async updateAudioStats(id, listeningTime, audioDuration) {
    const { error } = await supabase.rpc('update_audio_stats', {
      location_id: id,
      listening_time: listeningTime,
      audio_duration: audioDuration,
    });
    if (error) throw error;
  },

  async incrementField(id, fieldName) {
    const { error } = await supabase.rpc('increment_field', {
      location_id: id,
      field_name: fieldName,
    });
    if (error) throw error;
  },

  async incrementNavigationClicks(id) {
    return this.incrementField(id, 'navigation_clicks');
  },

  async incrementShareCount(id) {
    return this.incrementField(id, 'share_count');
  },

  async incrementVideoPlays(id) {
    return this.incrementField(id, 'video_plays');
  },

  async incrementLanguageView(id, lang) {
    return this.incrementField(id, lang === 'en' ? 'views_en' : 'views_he');
  },

  async updateLastViewedAt(id) {
    const { error } = await supabase
      .from('locations')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getByContributor(userId) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .contains('allowed_contributors', [userId])
      .order('created_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async manageContributor(locationId, contributorId, action) {
    const { error } = await supabase.rpc('manage_location_contributor', {
      p_location_id: locationId,
      p_contributor_id: contributorId,
      p_action: action,
    });
    if (error) throw error;
  },
};

export const User = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('Not authenticated');

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role: user.app_metadata?.role || 'user',
    };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async list() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listContributors() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'contributor');
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { role, ...profileUpdates } = updates;
    if (role !== undefined) {
      const { error } = await supabase.rpc('set_user_role', {
        target_user_id: id,
        new_role: role,
      });
      if (error) throw error;
    }
    if (Object.keys(profileUpdates).length === 0) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async invite(email, fullName, role) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'invite', email, full_name: fullName, role }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to invite user');
    return data;
  },

  async deleteUser(userId) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'delete', userId }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
  },

  async sendPasswordReset(email) {
    const redirectTo = `${window.location.origin}/resetpassword`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },
};

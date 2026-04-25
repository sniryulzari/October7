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

  async update(id, updates) {
    if (updates.role !== undefined) {
      const { error } = await supabase.rpc('set_user_role', {
        target_user_id: id,
        new_role: updates.role,
      });
      if (error) throw error;
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },
};

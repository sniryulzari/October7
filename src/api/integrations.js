import { supabase } from './supabaseClient';

export async function SendEmail({ subject, body, reply_to }) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ subject, body, reply_to }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('הבקשה נכשלה — אנא נסה שוב')
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

export async function UploadFile(file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('media')
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { file_url: data.publicUrl };
}

import { supabase } from './supabaseClient';

export async function SendEmail({ to, subject, body }) {
  console.warn('SendEmail not yet implemented');
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

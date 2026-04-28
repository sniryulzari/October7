import { supabase } from './supabaseClient';

export async function SendEmail({ subject, body, reply_to }) {
  const { error } = await supabase.functions.invoke('send-contact-email', {
    body: { subject, body, reply_to },
  })
  if (error) throw error
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

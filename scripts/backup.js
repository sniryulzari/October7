import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', 'backups');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listStorageFiles(bucket, prefix = '') {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];

  const files = [];
  for (const item of data) {
    if (item.id) {
      files.push({ path: prefix ? `${prefix}/${item.name}` : item.name, ...item });
    } else {
      const nested = await listStorageFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      files.push(...nested);
    }
  }
  return files;
}

async function backup() {
  console.log('Starting backup...');
  mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString();

  // Backup locations table
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('*')
    .order('created_at');

  if (locationsError) throw new Error(`locations fetch failed: ${locationsError.message}`);

  writeFileSync(
    join(BACKUP_DIR, 'locations.json'),
    JSON.stringify({ timestamp, count: locations.length, data: locations }, null, 2)
  );
  console.log(`Backed up ${locations.length} locations.`);

  // Backup media file inventory (filenames + metadata, not the actual files)
  const mediaFiles = await listStorageFiles('media');
  writeFileSync(
    join(BACKUP_DIR, 'media-inventory.json'),
    JSON.stringify({ timestamp, count: mediaFiles.length, files: mediaFiles }, null, 2)
  );
  console.log(`Backed up inventory of ${mediaFiles.length} media files.`);

  // Write a summary file
  writeFileSync(
    join(BACKUP_DIR, 'last-backup.json'),
    JSON.stringify({ timestamp, locations: locations.length, mediaFiles: mediaFiles.length }, null, 2)
  );

  console.log('Backup complete.');
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});

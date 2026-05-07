import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', 'backups');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchLocations() {
  console.log('Querying locations via REST...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
    },
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`locations fetch failed (HTTP ${res.status}): ${body}`);
  }

  return JSON.parse(body);
}

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
  console.log('URL:', SUPABASE_URL);
  console.log('Key prefix:', SUPABASE_KEY?.substring(0, 12) + '...');
  mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString();

  const locations = await fetchLocations();
  writeFileSync(
    join(BACKUP_DIR, 'locations.json'),
    JSON.stringify({ timestamp, count: locations.length, data: locations }, null, 2)
  );
  console.log(`Backed up ${locations.length} locations.`);

  const mediaFiles = await listStorageFiles('media');
  writeFileSync(
    join(BACKUP_DIR, 'media-inventory.json'),
    JSON.stringify({ timestamp, count: mediaFiles.length, files: mediaFiles }, null, 2)
  );
  console.log(`Backed up inventory of ${mediaFiles.length} media files.`);

  writeFileSync(
    join(BACKUP_DIR, 'last-backup.json'),
    JSON.stringify({ timestamp, locations: locations.length, mediaFiles: mediaFiles.length }, null, 2)
  );

  console.log('Backup complete.');
}

backup().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { getSupabaseClients } = require('./storage-config');

async function fixUndefinedUrls() {
    const clients = getSupabaseClients();
    const r2Url = process.env.R2_PUBLIC_URL_PREFIX || process.env.R2_PUBLIC_URL || "https://pub-8f57414e1231409487040617b0db54b4.r2.dev";

    for (const { id, client } of clients) {
        console.log(`Checking ${id}...`);
        for (const table of ['approved_notes', 'pending_notes']) {
            const { data, error } = await client.from(table).select('id, file_url').like('file_url', 'undefined%');
            if (error) {
                console.error(`Error querying ${table} in ${id}:`, error.message);
                continue;
            }

            if (data && data.length > 0) {
                console.log(`Found ${data.length} corrupted URLs in ${table} (${id}). Fixing...`);
                for (const note of data) {
                    const newUrl = note.file_url.replace(/^undefined\//, `${r2Url}/`);
                    const { error: updateError } = await client.from(table).update({ file_url: newUrl }).eq('id', note.id);
                    if (updateError) {
                        console.error(`Failed to update note ${note.id}:`, updateError.message);
                    } else {
                        console.log(`Fixed note ${note.id}: ${newUrl}`);
                    }
                }
            } else {
                console.log(`No corrupted URLs found in ${table} (${id}).`);
            }
        }
    }
    console.log('Fix script complete.');
}

fixUndefinedUrls();

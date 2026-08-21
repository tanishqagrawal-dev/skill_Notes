const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createClient } = require('@supabase/supabase-js');

// Dynamically parses all Supabase keys from environment
// Expects: SUPABASE_URL_1, SUPABASE_ANON_KEY_1, SUPABASE_URL_2, etc.
// SUPABASE_URL and SUPABASE_ANON_KEY (no suffix) are treated as index 1
function getSupabaseClients() {
    const clients = [];

    // First try the default keys (Primary)
    const defaultUrl = process.env.SUPABASE_URL;
    const defaultKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (defaultUrl && defaultKey) {
        clients.push({
            id: 'supabase_primary',
            url: defaultUrl,
            anonKey: process.env.SUPABASE_ANON_KEY || defaultKey,
            client: createClient(defaultUrl, defaultKey)
        });
    }

    // Now look for numbered keys: SUPABASE_URL_2, SUPABASE_URL_3, etc.
    let index = 2;
    while (true) {
        const url = process.env[`SUPABASE_URL_${index}`];
        const key = process.env[`SUPABASE_SERVICE_ROLE_KEY_${index}`] ||
            process.env[`SUPABASE_SERVICE_KEY_${index}`] ||
            process.env[`SUPABASE_ANON_KEY_${index}`] ||
            process.env[`SUPABASE_KEY_${index}`];

        if (!url || !key) break;

        clients.push({
            id: `supabase_${index}`,
            url: url,
            anonKey: process.env[`SUPABASE_ANON_KEY_${index}`] || key,
            client: createClient(url, key)
        });
        index++;
    }

    return clients;
}

// Dynamically parses R2 configuration
function getR2Config() {
    // We only need one R2 config for now, but could be made array in future
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlPrefix = process.env.R2_PUBLIC_URL_PREFIX || process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        return null;
    }

    const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return {
        id: 'r2_primary',
        client: s3Client,
        bucketName,
        publicUrlPrefix
    };
}

async function generateR2UploadUrl(filename, contentType = 'application/pdf') {
    const r2 = getR2Config();
    if (!r2) throw new Error("R2 is not configured");

    const command = new PutObjectCommand({
        Bucket: r2.bucketName,
        Key: filename,
        ContentType: contentType
    });

    // URL expires in 15 minutes
    const uploadUrl = await getSignedUrl(r2.client, command, { expiresIn: 900 });
    const publicUrl = `${r2.publicUrlPrefix}/${filename}`;

    return { uploadUrl, publicUrl };
}

module.exports = {
    getSupabaseClients,
    getR2Config,
    generateR2UploadUrl
};

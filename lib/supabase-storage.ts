import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use service role key if available for admin operations (bypassing RLS), otherwise fallback to anon key
// For server-side storage operations, service role is preferred to ensure we can upload/delete regardless of RLS
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn("Supabase credentials missing. Storage operations may fail.")
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export const BUCKET_NAME = 'resumes'

export async function getPresignedUploadUrl(path: string) {
  // Ensure bucket exists (optional, or assume it exists)
  // createSignedUploadUrl returns a URL we can PUT to
  const { data, error } = await supabaseAdmin
    .storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path)

  if (error) {
    console.error("Error creating signed upload URL:", error)
    throw error
  }

  return data
}

export function getPublicUrl(path: string) {
  const { data } = supabaseAdmin
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export async function deleteFile(path: string) {
  const { error } = await supabaseAdmin
    .storage
    .from(BUCKET_NAME)
    .remove([path])
    
  if (error) {
    throw error
  }
}

export async function createPresignedDownloadUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)
    
  if (error) {
    console.error("Error creating signed download URL:", error)
    return null
  }
  
  return data.signedUrl
}

export function generateFileKey(candidateId: string, fileName: string) {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `candidates/${candidateId}/${timestamp}-${sanitizedFileName}`;
}

import { supabase } from './supabase';
import { Document, DocumentType, Category } from '../types/document';

const getNexaStoredUser = (): any | null => {
  try {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('docwallet_nexa_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const isUuid = (value?: string | null): boolean => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

export const uploadDocument = async (
  userId: string,
  file: File,
  name: string,
  type: DocumentType,
  category: Category
): Promise<Document> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      name,
      type,
      category,
      file_url: publicUrl,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();

  if (docError) throw docError;

  return {
    id: docData.id,
    name: docData.name,
    type: docData.type,
    category: docData.category,
    fileData: publicUrl,
    fileType: file.type as any,
    createdAt: docData.created_at,
    filePath: docData.file_path,
  };
};

export const fetchDocuments = async (userId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((doc: any) => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    category: doc.category,
    fileData: doc.file_url,
    fileType: doc.file_type,
    createdAt: doc.created_at,
    filePath: doc.file_path,
  }));
};

export const deleteDocument = async (docId: string, filePath: string): Promise<void> => {
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (storageError) console.error('Storage delete error:', storageError);

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', docId);

  if (dbError) throw dbError;
};

export const generateShareLink = async (docId: string): Promise<string> => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let supabaseUserId: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    supabaseUserId = user?.id ?? null;
  } catch {
    supabaseUserId = null;
  }

  const nexaUser = getNexaStoredUser();
  const createdByCandidate = supabaseUserId ?? nexaUser?.id ?? null;

  const payload: Record<string, any> = {
    document_id: docId,
    expires_at: expiresAt,
  };

  // created_by is optional and only sent when it matches Supabase UUID format.
  // This keeps compatibility with old Supabase schemas and avoids breaking Nexa ID users.
  if (isUuid(createdByCandidate)) {
    payload.created_by = createdByCandidate;
  }

  let { data, error } = await supabase
    .from('shared_documents')
    .insert(payload)
    .select()
    .single();

  // Backward compatibility: older schemas may not have created_by yet.
  if (error && payload.created_by && error.message?.toLowerCase().includes('created_by')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.created_by;

    const retry = await supabase
      .from('shared_documents')
      .insert(fallbackPayload)
      .select()
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message || 'Não foi possível criar o link seguro de compartilhamento.');
  }

  return `${window.location.origin}/share/${data.id}`;
};

export const getSharedDocument = async (shareId: string) => {
  const { data, error } = await supabase
    .rpc('get_shared_document_safe', { p_share_id: shareId });

  if (!error && data) {
    return Array.isArray(data) ? data[0] : data;
  }

  // Fallback for projects that have not applied the secure RPC migration yet.
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('shared_documents')
    .select(`
      *,
      documents (*)
    `)
    .eq('id', shareId)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  if (!fallbackData) throw new Error('Link não encontrado.');

  if (new Date(fallbackData.expires_at) < new Date() || fallbackData.is_revoked) {
    throw new Error('Link inválido, expirado ou revogado.');
  }

  return fallbackData.documents;
};

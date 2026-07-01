import { supabase } from './supabase';
import { Document, DocumentType, Category } from '../types/document';
import { sha256File } from './hash';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const createReadableUrl = async (filePath: string, fallbackUrl?: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

  if (!error && data?.signedUrl) {
    return data.signedUrl;
  }

  return fallbackUrl || '';
};

const toDocument = async (doc: any): Promise<Document> => {
  const fileUrl = await createReadableUrl(doc.file_path, doc.file_url);

  return {
    id: doc.id,
    name: doc.name,
    type: doc.type,
    category: doc.category,
    fileData: fileUrl,
    fileType: doc.file_type,
    createdAt: doc.created_at,
    filePath: doc.file_path,
    fileSize: doc.file_size,
    fileHash: doc.file_hash,
    isNotarized: Boolean(doc.is_notarized),
    certificateId: doc.certificate_id,
  };
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
  const fileHash = await sha256File(file);

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

  const payload = {
    user_id: userId,
    name,
    type,
    category,
    file_url: publicUrl,
    file_path: filePath,
    file_type: file.type,
    file_size: file.size,
    file_hash: fileHash,
  };

  let { data: docData, error: docError } = await supabase
    .from('documents')
    .insert(payload)
    .select()
    .single();

  // Backward compatibility for projects that have not run the new SQL migration yet.
  if (docError && docError.message?.toLowerCase().includes('file_hash')) {
    const legacyPayload = {
      user_id: userId,
      name,
      type,
      category,
      file_url: publicUrl,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    };

    const retry = await supabase
      .from('documents')
      .insert(legacyPayload)
      .select()
      .single();

    docData = retry.data;
    docError = retry.error;
  }

  if (docError) throw docError;

  return toDocument({ ...docData, file_hash: docData.file_hash || fileHash });
};

export const fetchDocuments = async (userId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return Promise.all((data ?? []).map(toDocument));
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

export const markDocumentAsNotarized = async (
  docId: string,
  certificateId: string
): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .update({
      is_notarized: true,
      certificate_id: certificateId,
      notarized_at: new Date().toISOString(),
    })
    .eq('id', docId);

  if (error) throw error;
};

export const generateShareLink = async (docId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('shared_documents')
    .insert({
      document_id: docId,
      created_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return `${window.location.origin}/share/${data.id}`;
};

export const getSharedDocument = async (shareId: string) => {
  const { data, error } = await supabase
    .rpc('get_shared_document_safe', { p_share_id: shareId });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('shared_documents')
      .select(`
        *,
        documents (*)
      `)
      .eq('id', shareId)
      .single();

    if (fallbackError) throw fallbackError;

    if (new Date(fallbackData.expires_at) < new Date() || fallbackData.is_revoked) {
      throw new Error('Link inválido, expirado ou revogado');
    }

    const sharedDoc = fallbackData.documents;
    return {
      ...sharedDoc,
      file_url: await createReadableUrl(sharedDoc.file_path, sharedDoc.file_url),
    };
  }

  return Array.isArray(data) ? data[0] : data;
};

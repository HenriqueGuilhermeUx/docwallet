import { supabase } from './supabase';
import { Document, DocumentType, Category } from '../types/document';

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

  const { data: uploadData, error: uploadError } = await supabase.storage
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
    filePath: doc.file_path, // incluir para deleção correta
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
  // Obter usuário logado para incluir created_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('shared_documents')
    .insert({
      document_id: docId,
      created_by: user.id, // Campo obrigatório no novo schema
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return `${window.location.origin}/share/${data.id}`;
};

export const getSharedDocument = async (shareId: string) => {
  // Usar função segura que valida expiração e revogação
  const { data, error } = await supabase
    .rpc('get_shared_document_safe', { p_share_id: shareId });

  if (error) {
    // Se a função não existir, fallback para lógica original
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

    return fallbackData.documents;
  }

  return data;
};
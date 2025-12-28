import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper to fetch profiles and merge into documents
async function mergeProfilesIntoDocuments(supabase: any, documents: any[]) {
  if (!documents || documents.length === 0) return documents;

  const userIds = documents
    .map((d: any) => d?.employee?.user_id)
    .filter(Boolean);

  if (userIds.length === 0) return documents;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email, phone, avatar_url')
    .in('user_id', userIds);

  if (profilesError) throw profilesError;

  const profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return documents.map((d: any) => {
    const userId = d?.employee?.user_id;
    return {
      ...d,
      employee: d.employee
        ? { ...d.employee, profile: userId ? profilesMap[userId] || null : null }
        : null,
    };
  });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const subPath = pathParts.slice(1);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    // GET / - List documents
    if (req.method === 'GET' && subPath.length === 0) {
      const employeeId = url.searchParams.get('employee_id');
      const isCompanyDoc = url.searchParams.get('is_company_document');
      const folderPath = url.searchParams.get('folder_path');
      const category = url.searchParams.get('document_category');

      let query = supabase
        .from('documents')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .order('created_at', { ascending: false });

      if (employeeId) query = query.eq('employee_id', employeeId);
      if (isCompanyDoc !== null) query = query.eq('is_company_document', isCompanyDoc === 'true');
      if (folderPath) query = query.eq('folder_path', folderPath);
      if (category) query = query.eq('document_category', category);

      const { data, error } = await query;
      if (error) throw error;

      const result = await mergeProfilesIntoDocuments(supabase, data || []);
      return jsonResponse(result);
    }

    // GET /my - Get current user's documents
    if (req.method === 'GET' && subPath[0] === 'my') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (employee) {
        query = query.or(`employee_id.eq.${employee.id},is_company_document.eq.true`);
      } else {
        query = query.eq('is_company_document', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /folders - Get unique folder paths
    if (req.method === 'GET' && subPath[0] === 'folders') {
      const { data, error } = await supabase
        .from('documents')
        .select('folder_path')
        .not('folder_path', 'is', null);

      if (error) throw error;
      
      const uniqueFolders = [...new Set(data?.map(d => d.folder_path).filter(Boolean) || [])];
      return jsonResponse(uniqueFolders);
    }

    // GET /category/:category - Get documents by category
    if (req.method === 'GET' && subPath[0] === 'category' && subPath.length === 2) {
      const category = subPath[1];
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .eq('document_category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const result = await mergeProfilesIntoDocuments(supabase, data || []);
      return jsonResponse(result);
    }

    // GET /:id - Get single document
    if (req.method === 'GET' && subPath.length === 1 && subPath[0] !== 'my' && subPath[0] !== 'folders') {
      const id = subPath[0];
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const result = await mergeProfilesIntoDocuments(supabase, [data]);
      return jsonResponse(result[0]);
    }

    // GET /:id/download - Get download URL
    if (req.method === 'GET' && subPath.length === 2 && subPath[1] === 'download') {
      const id = subPath[0];
      const { data: doc, error } = await supabase
        .from('documents')
        .select('file_url, name')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!doc?.file_url) {
        return errorResponse('File not found', 404);
      }

      // If file is in Supabase storage, generate signed URL
      if (doc.file_url.startsWith('documents/')) {
        const { data: signedUrl, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_url.replace('documents/', ''), 3600);

        if (signError) throw signError;
        return jsonResponse({ url: signedUrl?.signedUrl, name: doc.name });
      }

      return jsonResponse({ url: doc.file_url, name: doc.name });
    }

    // POST / - Create document record (upload happens separately to storage)
    if (req.method === 'POST' && subPath.length === 0) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...body,
          uploaded_by: auth.userId
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // POST /upload - Handle file upload to storage
    if (req.method === 'POST' && subPath[0] === 'upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const employeeId = formData.get('employee_id') as string;
      const folderPath = formData.get('folder_path') as string;
      const documentCategory = formData.get('document_category') as string;
      const isCompanyDocument = formData.get('is_company_document') === 'true';

      if (!file) {
        return errorResponse('No file provided', 400);
      }

      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          type: file.type,
          file_url: `documents/${uploadData.path}`,
          file_size: file.size,
          employee_id: employeeId || null,
          folder_path: folderPath || null,
          document_category: documentCategory || 'employee_doc',
          is_company_document: isCompanyDocument,
          uploaded_by: auth.userId
        })
        .select()
        .single();

      if (docError) throw docError;
      return jsonResponse(doc, 201);
    }

    // PUT /:id - Update document
    if (req.method === 'PUT' && subPath.length === 1) {
      const id = subPath[0];
      const body = await req.json();
      const { data, error } = await supabase
        .from('documents')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete document
    if (req.method === 'DELETE' && subPath.length === 1) {
      const id = subPath[0];
      
      // Get document to delete file from storage
      const { data: doc } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', id)
        .single();

      if (doc?.file_url?.startsWith('documents/')) {
        await supabase.storage
          .from('documents')
          .remove([doc.file_url.replace('documents/', '')]);
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Documents API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  getSupabaseClient, 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken,
  authenticateRequest,
  getUserInfo,
  getRequestCompanyId,
  withCompanyId,
  DEFAULT_COMPANY_ID
} from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-auth', '');
  const method = req.method;

  console.log(`[api-auth] ${method} ${path}`);

  try {
    // GET / or /health - Health check endpoint
    if (method === 'GET' && (path === '' || path === '/' || path === '/health')) {
      return jsonResponse({
        status: 'healthy',
        service: 'api-auth',
        timestamp: new Date().toISOString(),
      });
    }

    const supabase = getSupabaseClient();

    // POST /login
    if (method === 'POST' && path === '/login') {
      const { email, password } = await req.json();
      
      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        console.log('[api-auth] User not found:', email);
        return errorResponse('Invalid email or password', 401);
      }

      if (!user.is_active) {
        return errorResponse('Account is deactivated', 401);
      }

      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        console.log('[api-auth] Invalid password for:', email);
        return errorResponse('Invalid email or password', 401);
      }

      // Get role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = roleData?.role || 'employee';

      // Check if user is a super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isSuperAdmin = !!superAdmin;

      // Get employee with company info
      const { data: employee } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, phone, avatar_url, company_id')
        .eq('user_id', user.id)
        .single();

      // Get company info
      const companyId = user.company_id || employee?.company_id || DEFAULT_COMPANY_ID;
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, code, logo_url, favicon_url, settings')
        .eq('id', companyId)
        .single();

      // Generate tokens
      const accessToken = await generateAccessToken(user.id, user.email, role);
      const refreshToken = await generateRefreshToken(user.id);

      // Store refresh token with company_id
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('refresh_tokens').insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
        company_id: companyId,
      });

      // Update last sign in
      await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', user.id);

      console.log('[api-auth] Login successful for:', email, 'isSuperAdmin:', isSuperAdmin);

      return jsonResponse({
        user: {
          id: user.id,
          email: user.email,
          role,
          companyId,
          isSuperAdmin,
          profile: employee ? {
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            avatar_url: employee.avatar_url,
          } : null,
          employeeId: employee?.id,
        },
        company,
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    }

    // POST /register
    if (method === 'POST' && path === '/register') {
      const auth = await authenticateRequest(req);
      if (!auth || !['admin', 'hr'].includes(auth.role)) {
        return errorResponse('Admin or HR access required', 403);
      }

      const companyId = getRequestCompanyId(url, auth);
      const { email, password, firstName, lastName, phone, role = 'employee' } = await req.json();

      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      // Check if user exists in this company
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('company_id', companyId)
        .single();

      if (existing) {
        return errorResponse('User already exists', 409);
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user with company_id
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          is_active: true,
          email_confirmed_at: new Date().toISOString(),
          company_id: companyId,
        })
        .select()
        .single();

      if (userError) {
        console.error('[api-auth] Error creating user:', userError);
        return errorResponse('Failed to create user', 500);
      }

      // Create role with company_id
      await supabase.from('user_roles').insert({
        user_id: newUser.id,
        role,
        company_id: companyId,
      });

      console.log('[api-auth] User registered:', email);

      return jsonResponse({ id: newUser.id, email: newUser.email, role, companyId }, 201);
    }

    // GET /me
    if (method === 'GET' && path === '/me') {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return errorResponse('Unauthorized', 401);
      }

      const userInfo = await getUserInfo(auth.userId);
      if (!userInfo) {
        return errorResponse('User not found', 404);
      }

      return jsonResponse({
        user: {
          id: userInfo.user.id,
          email: userInfo.user.email,
          role: userInfo.role,
          companyId: userInfo.user.company_id || userInfo.employee?.company_id || DEFAULT_COMPANY_ID,
          isSuperAdmin: userInfo.isSuperAdmin,
        },
        profile: userInfo.employee ? {
          first_name: userInfo.employee.first_name,
          last_name: userInfo.employee.last_name,
          email: userInfo.employee.email,
          phone: userInfo.employee.phone,
          avatar_url: userInfo.employee.avatar_url,
        } : null,
        employee: userInfo.employee,
        company: userInfo.company,
      });
    }

    // POST /refresh
    if (method === 'POST' && path === '/refresh') {
      const { refresh_token } = await req.json();
      
      if (!refresh_token) {
        return errorResponse('Refresh token required', 400);
      }

      const payload = await verifyToken(refresh_token);
      if (!payload || payload.type !== 'refresh') {
        return errorResponse('Invalid refresh token', 401);
      }

      const { data: storedToken } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token', refresh_token)
        .single();

      if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
        if (storedToken) {
          await supabase.from('refresh_tokens').delete().eq('id', storedToken.id);
        }
        return errorResponse('Refresh token expired', 401);
      }

      const userInfo = await getUserInfo(payload.userId as string);
      if (!userInfo) {
        return errorResponse('User not found', 404);
      }

      const accessToken = await generateAccessToken(
        userInfo.user.id,
        userInfo.user.email,
        userInfo.role
      );

      return jsonResponse({ access_token: accessToken });
    }

    // POST /logout
    if (method === 'POST' && path === '/logout') {
      const auth = await authenticateRequest(req);
      if (auth) {
        await supabase.from('refresh_tokens').delete().eq('user_id', auth.userId);
      }
      return jsonResponse({ message: 'Logged out successfully' });
    }

    // POST /forgot-password
    if (method === 'POST' && path === '/forgot-password') {
      const { email } = await req.json();
      
      const resetToken = crypto.randomUUID();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires,
        })
        .eq('email', email.toLowerCase());

      console.log('[api-auth] Password reset requested for:', email);

      return jsonResponse({ message: 'If the email exists, a reset link has been sent' });
    }

    // POST /reset-password
    if (method === 'POST' && path === '/reset-password') {
      const { token, password } = await req.json();

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('reset_token', token)
        .single();

      if (!user || new Date(user.reset_token_expires) < new Date()) {
        return errorResponse('Invalid or expired reset token', 400);
      }

      const passwordHash = await hashPassword(password);

      await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
        })
        .eq('id', user.id);

      return jsonResponse({ message: 'Password reset successful' });
    }

    // POST /change-password
    if (method === 'POST' && path === '/change-password') {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return errorResponse('Unauthorized', 401);
      }

      const { currentPassword, newPassword } = await req.json();

      if (!currentPassword || !newPassword) {
        return errorResponse('Current password and new password are required', 400);
      }

      if (newPassword.length < 8) {
        return errorResponse('New password must be at least 8 characters', 400);
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, password_hash')
        .eq('id', auth.userId)
        .single();

      if (userError || !user) {
        return errorResponse('User not found', 404);
      }

      const isValid = await comparePassword(currentPassword, user.password_hash);
      if (!isValid) {
        return errorResponse('Current password is incorrect', 401);
      }

      const newPasswordHash = await hashPassword(newPassword);

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', user.id);

      if (updateError) {
        return errorResponse('Failed to update password', 500);
      }

      console.log('[api-auth] Password changed for user:', auth.userId);
      return jsonResponse({ message: 'Password changed successfully' });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-auth] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

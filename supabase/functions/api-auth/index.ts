import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  getSupabaseClient, 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken,
  authenticateRequest,
  getUserInfo 
} from '../_shared/auth.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-auth', '');
  const method = req.method;

  console.log(`[api-auth] ${method} ${path}`);

  try {
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

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get employee if exists
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Generate tokens
      const accessToken = await generateAccessToken(user.id, user.email, role);
      const refreshToken = await generateRefreshToken(user.id);

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('refresh_tokens').insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
      });

      // Update last sign in
      await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', user.id);

      console.log('[api-auth] Login successful for:', email);

      return jsonResponse({
        user: {
          id: user.id,
          email: user.email,
          role,
          profile,
          employeeId: employee?.id,
        },
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

      const { email, password, firstName, lastName, role = 'employee' } = await req.json();

      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return errorResponse('User already exists', 409);
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          is_active: true,
          email_confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error('[api-auth] Error creating user:', userError);
        return errorResponse('Failed to create user', 500);
      }

      // Create profile
      await supabase.from('profiles').insert({
        user_id: newUser.id,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
      });

      // Create role
      await supabase.from('user_roles').insert({
        user_id: newUser.id,
        role,
      });

      console.log('[api-auth] User registered:', email);

      return jsonResponse({ id: newUser.id, email: newUser.email, role }, 201);
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
        },
        profile: userInfo.profile,
        employee: userInfo.employee,
      });
    }

    // POST /refresh
    if (method === 'POST' && path === '/refresh') {
      const { refresh_token } = await req.json();
      
      if (!refresh_token) {
        return errorResponse('Refresh token required', 400);
      }

      // Verify refresh token
      const payload = await verifyToken(refresh_token);
      if (!payload || payload.type !== 'refresh') {
        return errorResponse('Invalid refresh token', 401);
      }

      // Check if token exists in database
      const { data: storedToken } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token', refresh_token)
        .single();

      if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
        // Delete expired token
        if (storedToken) {
          await supabase.from('refresh_tokens').delete().eq('id', storedToken.id);
        }
        return errorResponse('Refresh token expired', 401);
      }

      // Get user info
      const userInfo = await getUserInfo(payload.userId as string);
      if (!userInfo) {
        return errorResponse('User not found', 404);
      }

      // Generate new access token
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
        // Delete all refresh tokens for user
        await supabase.from('refresh_tokens').delete().eq('user_id', auth.userId);
      }
      return jsonResponse({ message: 'Logged out successfully' });
    }

    // POST /forgot-password
    if (method === 'POST' && path === '/forgot-password') {
      const { email } = await req.json();
      
      // Generate reset token
      const resetToken = crypto.randomUUID();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires,
        })
        .eq('email', email.toLowerCase());

      // In production, send email here
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

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-auth] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

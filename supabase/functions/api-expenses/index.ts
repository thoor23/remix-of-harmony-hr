import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase, user } = await authenticateRequest(req);
    const url = new URL(req.url);
    const path = url.pathname.replace("/api-expenses", "");

    // Helper to get employee ID for current user
    async function getEmployeeId(): Promise<string | null> {
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data?.id || null;
    }

    // Helper to check if user is admin/hr
    async function isAdminOrHr(): Promise<boolean> {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      return data?.role === "admin" || data?.role === "hr";
    }

    // ============== CATEGORIES ==============
    if (path === "/categories" || path === "/categories/") {
      if (req.method === "GET") {
        console.log("Fetching expense categories");
        const { data, error } = await supabase
          .from("expense_categories")
          .select("*")
          .order("name");
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        console.log("Creating expense category:", body);
        const { data, error } = await supabase
          .from("expense_categories")
          .insert(body)
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Category by ID
    const categoryMatch = path.match(/^\/categories\/([^\/]+)$/);
    if (categoryMatch) {
      const categoryId = categoryMatch[1];

      if (req.method === "PUT") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        console.log("Updating expense category:", categoryId, body);
        const { data, error } = await supabase
          .from("expense_categories")
          .update(body)
          .eq("id", categoryId)
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Deleting expense category:", categoryId);
        const { error } = await supabase
          .from("expense_categories")
          .delete()
          .eq("id", categoryId);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ============== POLICIES ==============
    if (path === "/policies" || path === "/policies/") {
      if (req.method === "GET") {
        console.log("Fetching expense policies");
        const { data, error } = await supabase
          .from("expense_policies")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        console.log("Creating expense policy:", body);
        const { data, error } = await supabase
          .from("expense_policies")
          .insert(body)
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Policy by ID
    const policyMatch = path.match(/^\/policies\/([^\/]+)$/);
    if (policyMatch) {
      const policyId = policyMatch[1];

      if (req.method === "PUT") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        console.log("Updating expense policy:", policyId, body);
        const { data, error } = await supabase
          .from("expense_policies")
          .update(body)
          .eq("id", policyId)
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Deleting expense policy:", policyId);
        const { error } = await supabase
          .from("expense_policies")
          .delete()
          .eq("id", policyId);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ============== EXPENSE CLAIMS ==============
    // Get current user's expenses
    if (path === "/my" || path === "/my/") {
      if (req.method === "GET") {
        const employeeId = await getEmployeeId();
        if (!employeeId) {
          return new Response(JSON.stringify({ error: "Employee not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Fetching expenses for employee:", employeeId);
        const { data, error } = await supabase
          .from("expense_claims")
          .select(`
            *,
            category:expense_categories(id, name, code, max_amount, requires_receipt),
            employee:employees(id, first_name, last_name, employee_id, avatar_url, department:departments(id, name))
          `)
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get stats for admin
    if (path === "/stats" || path === "/stats/") {
      if (req.method === "GET") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Fetching expense stats");
        const { data: claims, error } = await supabase
          .from("expense_claims")
          .select("id, amount, status");
        
        if (error) throw error;

        const stats = {
          total: claims?.length || 0,
          pending: claims?.filter(c => c.status === "pending").length || 0,
          approved: claims?.filter(c => c.status === "approved").length || 0,
          rejected: claims?.filter(c => c.status === "rejected").length || 0,
          reimbursed: claims?.filter(c => c.status === "reimbursed").length || 0,
          totalAmount: claims?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0,
          approvedAmount: claims?.filter(c => c.status === "approved" || c.status === "reimbursed")
            .reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0,
          pendingAmount: claims?.filter(c => c.status === "pending")
            .reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0,
        };

        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get all expenses (admin only)
    if (path === "/" || path === "") {
      if (req.method === "GET") {
        const isAdmin = await isAdminOrHr();
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Fetching all expense claims");
        const { data, error } = await supabase
          .from("expense_claims")
          .select(`
            *,
            category:expense_categories(id, name, code, max_amount, requires_receipt),
            employee:employees(id, first_name, last_name, employee_id, avatar_url, department:departments(id, name)),
            reviewer:employees!expense_claims_reviewed_by_fkey(id, first_name, last_name)
          `)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const employeeId = await getEmployeeId();
        if (!employeeId) {
          return new Response(JSON.stringify({ error: "Employee not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        console.log("Creating expense claim:", body);
        
        const { data, error } = await supabase
          .from("expense_claims")
          .insert({
            ...body,
            employee_id: employeeId,
            status: "pending",
          })
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Expense by ID
    const expenseMatch = path.match(/^\/([^\/]+)$/);
    if (expenseMatch && !["categories", "policies", "my", "stats"].includes(expenseMatch[1])) {
      const expenseId = expenseMatch[1];

      if (req.method === "GET") {
        console.log("Fetching expense:", expenseId);
        const { data, error } = await supabase
          .from("expense_claims")
          .select(`
            *,
            category:expense_categories(id, name, code, max_amount, requires_receipt),
            employee:employees(id, first_name, last_name, employee_id, avatar_url, department:departments(id, name)),
            reviewer:employees!expense_claims_reviewed_by_fkey(id, first_name, last_name)
          `)
          .eq("id", expenseId)
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PATCH" || req.method === "PUT") {
        const body = await req.json();
        const isAdmin = await isAdminOrHr();
        const employeeId = await getEmployeeId();

        // Check if user is updating status (admin action)
        if (body.status && ["approved", "rejected", "reimbursed"].includes(body.status)) {
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const updateData: any = {
            status: body.status,
            reviewed_by: employeeId,
            reviewed_at: new Date().toISOString(),
          };

          if (body.review_comments) {
            updateData.review_comments = body.review_comments;
          }

          if (body.status === "reimbursed") {
            updateData.reimbursed_at = new Date().toISOString();
          }

          console.log("Updating expense status:", expenseId, updateData);
          const { data, error } = await supabase
            .from("expense_claims")
            .update(updateData)
            .eq("id", expenseId)
            .select()
            .single();
          
          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Regular update (employee can update their own pending claims)
        console.log("Updating expense claim:", expenseId, body);
        const { data, error } = await supabase
          .from("expense_claims")
          .update(body)
          .eq("id", expenseId)
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        console.log("Deleting expense claim:", expenseId);
        const { error } = await supabase
          .from("expense_claims")
          .delete()
          .eq("id", expenseId);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in api-expenses:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

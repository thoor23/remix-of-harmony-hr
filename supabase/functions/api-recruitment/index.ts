import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticateRequest, getRequestCompanyId, withCompanyId } from "../_shared/auth.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let currentCompanyId: string;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    currentCompanyId = getRequestCompanyId(url, auth);
    const supabase = getSupabase();
    const pathParts = url.pathname.split("/").filter(Boolean);
    const basePath = pathParts[1] || "";
    const resourceId = pathParts[2] || "";
    const action = pathParts[3] || "";

    console.log(`[api-recruitment] ${req.method} basePath=${basePath} resourceId=${resourceId} action=${action}`);

    // === STATS ENDPOINTS ===
    if (basePath === "stats" && req.method === "GET") {
      return await getRecruitmentStats();
    }

    if (basePath === "pipeline" && req.method === "GET") {
      return await getPipelineStats();
    }

    // === JOB OPENINGS ===
    if (basePath === "jobs") {
      if (!resourceId) {
        if (req.method === "GET") return await getJobOpenings(url);
        if (req.method === "POST") return await createJobOpening(req);
      } else if (isValidUUID(resourceId)) {
        if (req.method === "GET") return await getJobOpening(resourceId);
        if (req.method === "PUT") return await updateJobOpening(resourceId, req);
        if (req.method === "DELETE") return await deleteJobOpening(resourceId);
        if (req.method === "PATCH" && action === "status") return await updateJobStatus(resourceId, req);
      }
    }

    // === APPLICATIONS ===
    if (basePath === "applications") {
      if (!resourceId) {
        if (req.method === "GET") return await getApplications(url);
        if (req.method === "POST") return await createApplication(req);
      } else if (isValidUUID(resourceId)) {
        if (req.method === "GET") return await getApplication(resourceId);
        if (req.method === "PUT") return await updateApplication(resourceId, req);
        if (req.method === "PATCH" && action === "stage") return await updateApplicationStage(resourceId, req, auth.userId);
        if (req.method === "PATCH" && action === "reject") return await rejectApplication(resourceId, req, auth.userId);
        if (req.method === "POST" && action === "convert") return await convertToEmployee(resourceId, req);
      }
    }

    // === INTERVIEWS ===
    if (basePath === "interviews") {
      if (resourceId === "my" && req.method === "GET") return await getMyInterviews(auth.userId);
      if (!resourceId) {
        if (req.method === "GET") return await getInterviews(url);
        if (req.method === "POST") return await scheduleInterview(req);
      } else if (isValidUUID(resourceId)) {
        if (req.method === "GET") return await getInterview(resourceId);
        if (req.method === "PUT") return await updateInterview(resourceId, req);
        if (req.method === "DELETE") return await deleteInterview(resourceId);
        if (req.method === "PATCH" && action === "feedback") return await submitInterviewFeedback(resourceId, req, auth.userId);
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[api-recruitment] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// === STATS ===
async function getRecruitmentStats() {
  const supabase = getSupabase();
  const [openJobsRes, applicationsRes, interviewsRes, offersRes] = await Promise.all([
    supabase.from("job_openings").select("id", { count: "exact" }).eq("company_id", currentCompanyId).eq("status", "open"),
    supabase.from("job_applications").select("id", { count: "exact" }).eq("company_id", currentCompanyId).eq("status", "active"),
    supabase.from("interview_schedules").select("id", { count: "exact" }).eq("company_id", currentCompanyId).eq("status", "scheduled").gte("scheduled_at", new Date().toISOString().split("T")[0]),
    supabase.from("job_applications").select("id", { count: "exact" }).eq("company_id", currentCompanyId).eq("current_stage", "offer").eq("status", "active"),
  ]);

  return new Response(JSON.stringify({
    open_positions: openJobsRes.count || 0,
    total_applications: applicationsRes.count || 0,
    interviews_today: interviewsRes.count || 0,
    pending_offers: offersRes.count || 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getPipelineStats() {
  const supabase = getSupabase();
  const stages = ["screening", "phone-interview", "technical", "hr-interview", "offer", "hired"];
  const counts: Record<string, number> = {};

  for (const stage of stages) {
    const { count } = await supabase.from("job_applications").select("id", { count: "exact" }).eq("company_id", currentCompanyId).eq("current_stage", stage).eq("status", "active");
    counts[stage] = count || 0;
  }

  return new Response(JSON.stringify(counts), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// === JOB OPENINGS ===
async function getJobOpenings(url: URL) {
  const supabase = getSupabase();
  const status = url.searchParams.get("status");
  const department = url.searchParams.get("department_id");

  let query = supabase.from("job_openings").select(`
    *,
    department:departments(id, name),
    designation:designations(id, name),
    created_by_employee:employees!job_openings_created_by_fkey(id, first_name, last_name),
    applications:job_applications(count)
  `).eq("company_id", currentCompanyId).order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (department) query = query.eq("department_id", department);

  const { data, error } = await query;
  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getJobOpening(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("job_openings").select(`
    *,
    department:departments(id, name),
    designation:designations(id, name),
    created_by_employee:employees!job_openings_created_by_fkey(id, first_name, last_name),
    applications:job_applications(*)
  `).eq("id", id).eq("company_id", currentCompanyId).single();

  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createJobOpening(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from("job_openings").insert(withCompanyId(body, currentCompanyId)).select().single();
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateJobOpening(id: string, req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from("job_openings").update(body).eq("id", id).eq("company_id", currentCompanyId).select().single();
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function deleteJobOpening(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("job_openings").delete().eq("id", id).eq("company_id", currentCompanyId);
  if (error) throw error;
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateJobStatus(id: string, req: Request) {
  const supabase = getSupabase();
  const { status } = await req.json();
  const updateData: Record<string, unknown> = { status };
  if (status === "open") updateData.posted_date = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase.from("job_openings").update(updateData).eq("id", id).eq("company_id", currentCompanyId).select().single();
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// === APPLICATIONS ===
async function getApplications(url: URL) {
  const supabase = getSupabase();
  const jobId = url.searchParams.get("job_id");
  const stage = url.searchParams.get("stage");
  const status = url.searchParams.get("status");

  let query = supabase.from("job_applications").select(`
    *,
    job:job_openings(id, title, department_id),
    referred_by_employee:employees!job_applications_referred_by_fkey(id, first_name, last_name)
  `).eq("company_id", currentCompanyId).order("applied_at", { ascending: false });

  if (jobId) query = query.eq("job_opening_id", jobId);
  if (stage) query = query.eq("current_stage", stage);
  if (status) query = query.eq("status", status || "active");

  const { data, error } = await query;
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getApplication(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("job_applications").select(`
    *,
    job:job_openings(*),
    referred_by_employee:employees!job_applications_referred_by_fkey(id, first_name, last_name),
    stage_history:application_stage_history(*, updated_by_employee:employees(id, first_name, last_name)),
    interviews:interview_schedules(*, interviewer:employees(id, first_name, last_name))
  `).eq("id", id).eq("company_id", currentCompanyId).single();

  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createApplication(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from("job_applications").insert(withCompanyId(body, currentCompanyId)).select().single();
  if (error) throw error;

  // Record initial stage
  await supabase.from("application_stage_history").insert(withCompanyId({
    application_id: data.id,
    from_stage: null,
    to_stage: "screening",
    notes: "Application received",
  }, currentCompanyId));

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateApplication(id: string, req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from("job_applications").update(body).eq("id", id).eq("company_id", currentCompanyId).select().single();
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateApplicationStage(id: string, req: Request, userId: string) {
  const supabase = getSupabase();
  const { stage, notes } = await req.json();
  const { data: app } = await supabase.from("job_applications").select("current_stage").eq("id", id).single();
  const { data: emp } = await supabase.from("employees").select("id").eq("user_id", userId).single();
  const { data, error } = await supabase.from("job_applications").update({
    current_stage: stage,
    status: stage === "hired" ? "hired" : "active",
  }).eq("id", id).select().single();
  if (error) throw error;
  await supabase.from("application_stage_history").insert(withCompanyId({
    application_id: id,
    from_stage: app?.current_stage,
    to_stage: stage,
    notes,
    updated_by: emp?.id,
  }, currentCompanyId));
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function rejectApplication(id: string, req: Request, userId: string) {
  const supabase = getSupabase();
  const { reason, notes } = await req.json();
  const { data: app } = await supabase.from("job_applications").select("current_stage").eq("id", id).single();
  const { data: emp } = await supabase.from("employees").select("id").eq("user_id", userId).single();
  const { data, error } = await supabase.from("job_applications").update({
    status: "rejected",
    rejection_reason: reason,
  }).eq("id", id).select().single();
  if (error) throw error;
  await supabase.from("application_stage_history").insert(withCompanyId({
    application_id: id,
    from_stage: app?.current_stage,
    to_stage: "rejected",
    notes: notes || reason,
    updated_by: emp?.id,
  }, currentCompanyId));
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function convertToEmployee(id: string, req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data: app, error: appError } = await supabase.from("job_applications").select("*, job:job_openings(department_id, designation_id, company_id)").eq("id", id).single();
  if (appError) throw appError;
  const { data: employee, error: empError } = await supabase.from("employees").insert(withCompanyId({
    employee_id: body.employee_id,
    first_name: app.candidate_name.split(" ")[0],
    last_name: app.candidate_name.split(" ").slice(1).join(" "),
    email: app.candidate_email,
    phone: app.candidate_phone,
    department_id: app.job.department_id,
    designation_id: app.job.designation_id,
    date_of_joining: body.date_of_joining || new Date().toISOString().split("T")[0],
    employment_type: body.employment_type || "full-time",
    status: "active",
  }, currentCompanyId)).select().single();
  if (empError) throw empError;
  await supabase.from("job_applications").update({ status: "hired", current_stage: "hired" }).eq("id", id);
  return new Response(JSON.stringify(employee), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// === INTERVIEWS ===
async function getInterviews(url: URL) {
  const supabase = getSupabase();
  const applicationId = url.searchParams.get("application_id");
  const interviewerId = url.searchParams.get("interviewer_id");
  const date = url.searchParams.get("date");
  let query = supabase.from("interview_schedules").select(`
    *,
    application:job_applications(id, candidate_name, candidate_email, job:job_openings(title)),
    interviewer:employees(id, first_name, last_name)
  `).eq("company_id", currentCompanyId).order("scheduled_at", { ascending: true });
  if (applicationId) query = query.eq("application_id", applicationId);
  if (interviewerId) query = query.eq("interviewer_id", interviewerId);
  if (date) {
    query = query.gte("scheduled_at", `${date}T00:00:00`).lte("scheduled_at", `${date}T23:59:59`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getMyInterviews(userId: string) {
  const supabase = getSupabase();
  const { data: emp } = await supabase.from("employees").select("id").eq("user_id", userId).single();
  if (!emp) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data, error } = await supabase.from("interview_schedules").select(`*, application:job_applications(id, candidate_name, candidate_email, job:job_openings(title)), interviewer:employees(id, first_name, last_name)`).eq("interviewer_id", emp.id).eq("company_id", currentCompanyId).order("scheduled_at", { ascending: true });
  if (error) throw error;
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function getInterview(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("interview_schedules").select(`*, application:job_applications(*, job:job_openings(*)), interviewer:employees(id, first_name, last_name), feedback:interview_feedback(*, interviewer:employees(id, first_name, last_name))`).eq("id", id).eq("company_id", currentCompanyId).single();
  if (error) throw error;
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function scheduleInterview(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from("interview_schedules").insert(withCompanyId(body, currentCompanyId)).select().single();
  if (error) throw error;
  return new Response(JSON.stringify(data), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function updateInterview(id: string, req: Request) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from("interview_schedules").update(body).eq("id", id).eq("company_id", currentCompanyId).select().single();
  if (error) throw error;
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function deleteInterview(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("interview_schedules").delete().eq("id", id).eq("company_id", currentCompanyId);
  if (error) throw error;
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function submitInterviewFeedback(id: string, req: Request, userId: string) {
  const supabase = getSupabase();
  const { feedback, rating, recommendation, detailed_feedback } = await req.json();
  const { data: emp } = await supabase.from("employees").select("id").eq("user_id", userId).single();
  const { data, error } = await supabase.from("interview_schedules").update({ feedback, rating, recommendation, status: "completed" }).eq("id", id).select().single();
  if (error) throw error;
  if (detailed_feedback && emp) {
    for (const item of detailed_feedback) {
      await supabase.from("interview_feedback").insert(withCompanyId({ interview_id: id, interviewer_id: emp.id, criteria: item.criteria, rating: item.rating, comments: item.comments }, currentCompanyId));
    }
  }
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

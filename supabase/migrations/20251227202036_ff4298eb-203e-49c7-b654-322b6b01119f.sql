-- Create payslip_templates table
CREATE TABLE public.payslip_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  layout_config JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  company_name TEXT,
  company_address TEXT,
  company_logo_url TEXT,
  footer_text TEXT DEFAULT 'This is a computer-generated document and does not require a signature.',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payslip_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin and HR can manage payslip templates"
ON public.payslip_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active payslip templates"
ON public.payslip_templates
FOR SELECT
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payslip_templates_updated_at
BEFORE UPDATE ON public.payslip_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default template
INSERT INTO public.payslip_templates (name, content, is_default, company_name, company_address, footer_text)
VALUES (
  'Standard Payslip',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <!-- Company Header -->
  <div style="text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #333;">{{company_name}}</h1>
    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">{{company_address}}</p>
  </div>
  
  <!-- Payslip Title -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0; font-size: 20px; color: #333; text-transform: uppercase;">Payslip</h2>
    <p style="margin: 5px 0 0; color: #666;">Pay Period: {{pay_period}}</p>
  </div>
  
  <!-- Employee Details -->
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666; width: 25%;">Employee Name:</td>
        <td style="padding: 8px 0; font-weight: bold; width: 25%;">{{employee_name}}</td>
        <td style="padding: 8px 0; color: #666; width: 25%;">Employee ID:</td>
        <td style="padding: 8px 0; font-weight: bold; width: 25%;">{{employee_id}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Department:</td>
        <td style="padding: 8px 0; font-weight: bold;">{{department}}</td>
        <td style="padding: 8px 0; color: #666;">Designation:</td>
        <td style="padding: 8px 0; font-weight: bold;">{{designation}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Pay Date:</td>
        <td style="padding: 8px 0; font-weight: bold;">{{pay_date}}</td>
        <td style="padding: 8px 0; color: #666;"></td>
        <td style="padding: 8px 0;"></td>
      </tr>
    </table>
  </div>
  
  <!-- Earnings & Deductions -->
  <div style="display: flex; gap: 30px; margin-bottom: 30px;">
    <!-- Earnings -->
    <div style="flex: 1;">
      <h3 style="margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #22c55e; color: #22c55e;">Earnings</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Basic Salary</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{basic_salary}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">HRA</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{hra}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Transport Allowance</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{transport_allowance}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Medical Allowance</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{medical_allowance}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Other Allowances</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{other_allowances}}</td></tr>
        <tr style="font-weight: bold; background: #f0fdf4;"><td style="padding: 12px 0;">Gross Earnings</td><td style="text-align: right; padding: 12px 0;">{{gross_earnings}}</td></tr>
      </table>
    </div>
    
    <!-- Deductions -->
    <div style="flex: 1;">
      <h3 style="margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #ef4444; color: #ef4444;">Deductions</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">PF Deduction</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{pf_deduction}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Tax Deduction</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{tax_deduction}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Other Deductions</td><td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">{{other_deductions}}</td></tr>
        <tr style="font-weight: bold; background: #fef2f2;"><td style="padding: 12px 0;">Total Deductions</td><td style="text-align: right; padding: 12px 0;">{{total_deductions}}</td></tr>
      </table>
    </div>
  </div>
  
  <!-- Net Pay -->
  <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
    <p style="margin: 0 0 5px; font-size: 14px; opacity: 0.9;">NET PAY</p>
    <p style="margin: 0; font-size: 32px; font-weight: bold;">{{net_pay}}</p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
    <p style="margin: 0;">{{footer_text}}</p>
    <p style="margin: 5px 0 0;">Generated on: {{current_date}}</p>
  </div>
</div>',
  true,
  'Company Name Inc.',
  '123 Business Street, City, State 12345',
  'This is a computer-generated document and does not require a signature.'
);
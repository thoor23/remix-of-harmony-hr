-- Allow employees to insert their own attendance records (clock in)
CREATE POLICY "Employees can clock in"
ON public.attendance_records
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Allow employees to update their own attendance records (clock out)
CREATE POLICY "Employees can clock out"
ON public.attendance_records
FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);
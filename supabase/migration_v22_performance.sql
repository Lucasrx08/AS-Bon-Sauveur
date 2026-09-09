-- V22 performance: indexes used by role-scoped screens and targeted CRUD
create index if not exists idx_v20_events_specialty_date on public.v20_events (specialty, date);
create index if not exists idx_v20_documents_specialty_date on public.v20_documents (specialty, date);
create index if not exists idx_v20_convocations_specialty_date_status on public.v20_convocations (specialty, date, status);
create index if not exists idx_v20_students_specialty on public.v20_students (specialty);
create index if not exists idx_v20_licenses_section_option on public.v20_licenses (section_option);
create index if not exists idx_v20_licenses_student_id on public.v20_licenses (student_id);
create index if not exists idx_v20_appreciations_student_id on public.v20_appreciations (student_id);
create index if not exists idx_v20_appreciations_educator_id on public.v20_appreciations (educator_id);
create index if not exists idx_v20_convocation_students_student_id on public.v20_convocation_students (student_id);
create index if not exists idx_v20_orders_created_at on public.v20_orders (created_at desc);
create index if not exists idx_v20_reports_date on public.v20_reports (date desc);

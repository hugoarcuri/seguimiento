-- Add completed_at column to track when a disciple finishes a task
alter table tareas add column if not exists completed_at timestamptz;

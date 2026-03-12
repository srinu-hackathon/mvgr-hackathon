-- Study Sphere: Supabase Schema Definition
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Domains Table
create table public.domains (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Subjects Table
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  name text not null,
  icon text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Topics Table
create table public.topics (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  name text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Resources Table
create table public.resources (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references public.topics(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('pdf', 'video', 'oer', 'notes', 'ppt')),
  author text not null,
  url text not null,
  youtube_id text,
  rating numeric default 0,
  upvotes integer default 0,
  source text,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Initial Seed Data for Global Domains Strategy
insert into public.domains (id, name, description, icon) values 
  ('11111111-1111-1111-1111-111111111111', 'Medical Sciences', 'Anatomy, Physiology, and Clinical Studies', 'Stethoscope'),
  ('22222222-2222-2222-2222-222222222222', 'Engineering & Tech', 'Computer Science, Electrical, and Mechanical', 'Cpu'),
  ('33333333-3333-3333-3333-333333333333', 'Commerce & Business', 'Accounting, Finance, and Management', 'Briefcase'),
  ('44444444-4444-4444-4444-444444444444', 'Competitive Exams', 'Preparation for universal standardized tests', 'Target');

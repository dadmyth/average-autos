-- Migration: Add expiry_date to documents table
-- Run this migration to add the expiry_date column to existing documents

ALTER TABLE documents ADD COLUMN expiry_date DATE;

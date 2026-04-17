-- Fix year_of_study column to allow longer values like "Intermediate 1st Year"
ALTER TABLE users 
ALTER COLUMN year_of_study TYPE VARCHAR(50);



















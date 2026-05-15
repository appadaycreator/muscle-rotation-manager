/**
 * supabaseConfigValidator.js - localStorage移行版
 * Supabaseを除去したため、このモジュールはno-opです。
 */

export class SupabaseConfigValidation {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
    this.suggestions = ['Supabase removed: using localStorage only'];
  }
}

export function validateSupabaseConfig() {
  console.log('Supabase removed: using localStorage only');
  return new SupabaseConfigValidation();
}

export function displayValidationResults(_validation) {
  console.log('Supabase removed: using localStorage only');
}

export function displayConfigInfo() {
  console.log('Supabase removed: using localStorage only');
}

export function validateAndDisplay() {
  const validation = validateSupabaseConfig();
  displayValidationResults(validation);
  return validation;
}

if (typeof window !== 'undefined') {
  window.validateSupabaseConfig = validateAndDisplay;
}

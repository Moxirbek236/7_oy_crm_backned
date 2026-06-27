import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

let supabaseClient: SupabaseClient | null = null;

export async function uploadToSupabase(filename: string): Promise<string> {
  // Always keep file locally per user request, bypassing Supabase
  return filename;
}

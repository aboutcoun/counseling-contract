import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ContractRow = {
  id: string;
  branch: "안양점" | "수원점";
  counselor_name: string;
  counselor_level: "1급" | "2급";
  counselor_signature: string;
  client_name: string;
  client_email: string;
  status: "sent" | "completed";
  contact1_phone: string | null;
  contact1_relation: string | null;
  contact2_phone: string | null;
  contact2_relation: string | null;
  contact3_phone: string | null;
  contact3_relation: string | null;
  pledge_signature: string | null;
  client_signature: string | null;
  submitted_at: string | null;
  created_at: string;
};

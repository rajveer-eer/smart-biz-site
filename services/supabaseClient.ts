import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxnlhzyakuzbojvsetnv.supabase.co';
const supabaseKey = 'sb_publishable_z8hdwC4Odlw3nKWudXI0qA_IZY9ePH5';

export const supabase = createClient(supabaseUrl, supabaseKey);
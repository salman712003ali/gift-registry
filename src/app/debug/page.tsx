import { createClient } from "@/utils/supabase/server";

export default async function DebugPage() {
  const supabase = createClient();
  const { data: version } = await supabase.from('_prisma_migrations').select('*').limit(1);
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Environment</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL is {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set'}</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY is {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set'}</p>
        
        <h2 className="text-xl font-semibold mt-4 mb-2">Database Connection</h2>
        <p>Database connection: {version ? 'successful' : 'failed'}</p>
        
        <h2 className="text-xl font-semibold mt-4 mb-2">System Info</h2>
        <p>Next.js version: {process.env.NEXT_PUBLIC_VERSION || 'unknown'}</p>
        <p>Node Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
} 
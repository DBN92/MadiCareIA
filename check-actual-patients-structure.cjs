const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientsTableStructure() {
  try {
    console.log('🔍 Checking patients table structure...');
    
    // First, try to get table structure via information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'patients' });
    
    if (columnsError) {
      console.log('❌ Could not get columns via RPC:', columnsError.message);
      
      // Alternative: Try to fetch one record to see available columns
      console.log('🔄 Trying alternative approach - fetching sample data...');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Error fetching sample data:', sampleError.message);
        
        // Try to get just the count to see if table exists
        const { count, error: countError } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.log('❌ Table might not exist:', countError.message);
        } else {
          console.log('✅ Table exists with', count, 'records');
        }
      } else {
        console.log('✅ Sample data retrieved successfully');
        console.log('📋 Available columns:', Object.keys(sampleData[0] || {}));
        console.log('📄 Sample record:', sampleData[0]);
      }
    } else {
      console.log('✅ Table structure retrieved via RPC');
      console.log('📋 Columns:', columns);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

checkPatientsTableStructure();
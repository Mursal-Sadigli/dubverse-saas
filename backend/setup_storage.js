const { createClient } = require('@supabase/supabase-js');

const url = 'https://wphpctpwbufzrqdibuvn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHBjdHB3YnVmenJxZGlidXZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU4MTM5NSwiZXhwIjoyMDg5MTU3Mzk1fQ.VvMBum0hBmVf2W2-bLzntU2b9cFR8Dvl59ptPzcGwsU';

const supabase = createClient(url, key);

async function setupStorage() {
  try {
    console.log("Creating 'dubverse-videos' bucket...");
    const { data, error } = await supabase.storage.createBucket('dubverse-videos', {
      public: true, // Make it public if the app expects public URLs
      fileSizeLimit: 524288000, // 500MB
    });

    if (error) {
       if (error.message.includes("already exists")) {
            console.log("Bucket already exists! Skipping.");
       } else {
           console.error("Error creating bucket:", error.message);
       }
    } else {
      console.log("Bucket created successfully:", data);
    }
    
    // Set bucket policies allowing anon/authenticated read and authenticated write
    // NOTE: Policies are best set in the SQL editor, but we'll try here or instruct the user.
  } catch (err) {
    console.error(err);
  }
}

setupStorage();

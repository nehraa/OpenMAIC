// Script to manually insert a test asset with mock slides into the database
// This tests the library UI without needing OpenMAIC to be running

import('pg').then(({ Pool }) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/openmaic',
  });

  async function createTestAsset() {
    const client = await pool.connect();
    try {
      // Find a teacher
      const teachers = await client.query('SELECT id, tenant_id FROM users WHERE role = $1 LIMIT 1', ['teacher']);
      if (teachers.rows.length === 0) {
        console.log('No teacher found');
        return;
      }

      const teacher = teachers.rows[0];
      console.log('Creating test asset for teacher:', teacher.id);

      const mockSlides = [
        { id: 's1', title: 'Introduction to Photosynthesis', content: 'Photosynthesis is the process by which plants convert light energy into chemical energy.', bullets: ['Light energy absorption', 'Water and CO2 conversion', 'Glucose production'] },
        { id: 's2', title: 'The Chlorophyll Connection', content: 'Chlorophyll is the green pigment that captures light energy for photosynthesis.', bullets: ['Located in chloroplasts', 'Reflects green light', 'Essential for energy capture'] },
        { id: 's3', title: 'Key Stages of Photosynthesis', content: 'Photosynthesis occurs in two main stages: light-dependent and light-independent reactions.', bullets: ['Light reactions: H2O -> O2 + ATP', 'Calvin cycle: CO2 -> Glucose', 'Requires sunlight directly'] },
        { id: 's4', title: 'Why Photosynthesis Matters', content: 'Photosynthesis is fundamental to life on Earth as it produces oxygen and food.', bullets: ['Produces atmospheric oxygen', 'Forms base of food chains', 'Removes CO2 from atmosphere'] },
        { id: 's5', title: 'Summary and Review', content: 'Let\'s recap the key concepts about photosynthesis.', bullets: ['Plants make their own food', 'Light energy is converted', 'Oxygen is a byproduct'] }
      ];

      const payload = JSON.stringify({ slides: mockSlides, mockGenerated: false });

      const result = await client.query(`
        INSERT INTO content_assets (tenant_id, owner_teacher_id, type, title, subject_tag, source_kind, source_ref, payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, source_ref, created_at
      `, [teacher.tenant_id, teacher.id, 'slide_deck', 'Photosynthesis for 5th Graders', 'Science', 'ai_generated', 'demo-classroom-456', payload]);

      console.log('Created asset:', result.rows[0]);
      console.log('OpenMAIC URL would be: http://localhost:3002/classroom/demo-classroom-456');

    } finally {
      client.release();
      await pool.end();
    }
  }

  createTestAsset().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
});
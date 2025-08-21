#!/usr/bin/env tsx

/**
 * Script to import exported localStorage data into SQLite database
 * Usage: npm run import-data <path-to-json-file>
 */

import { importFromFile } from '../src/lib/database/import.js';

const main = async () => {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌ Please provide a path to the JSON file to import');
    console.error(
      'Usage: npx tsx scripts/import-data-simple.ts <path-to-json-file>',
    );
    process.exit(1);
  }

  console.log(`📥 Starting import from: ${filePath}`);
  console.log('⏳ This may take a few moments...\n');

  try {
    // Import data
    const result = await importFromFile(filePath);

    if (!result.success) {
      console.error('❌ Import failed!');
      result.errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Show results
    console.log('\n✅ Import completed successfully!');
    console.log(`📁 Categories imported: ${result.categoriesImported}`);
    console.log(`🖼️ Wallpapers imported: ${result.wallpapersImported}`);
    console.log(`📊 Sync metadata imported: ${result.syncMetaImported}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️ ${result.errors.length} warnings:`);
      result.errors.forEach((error) => console.warn(`  - ${error}`));
    }

    console.log(
      '\n🎉 Data import complete! You can now start the backend server.',
    );
  } catch (error) {
    console.error('❌ Import failed with error:', error);
    process.exit(1);
  }
};

main().catch(console.error);

import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const OUTPUT_FILE = path.resolve('c:/ipos5/dump_all_mongodb.sql');

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function formatSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (val instanceof ObjectId || (val && val._bsontype === 'ObjectID')) return `'${val.toString()}'`;
  if (typeof val === 'object') return escapeSqlString(JSON.stringify(val));
  return escapeSqlString(val);
}

function inferSqlType(sampleValues, colName) {
  if (colName === '_id') return 'VARCHAR(64) PRIMARY KEY';
  
  let hasString = false;
  let hasLongString = false;
  let hasFloat = false;
  let hasInt = false;
  let hasDate = false;
  let hasBool = false;
  let hasObject = false;

  for (const val of sampleValues) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'boolean') hasBool = true;
    else if (typeof val === 'number') {
      if (Number.isInteger(val)) hasInt = true;
      else hasFloat = true;
    }
    else if (val instanceof Date) hasDate = true;
    else if (val instanceof ObjectId) hasString = true;
    else if (typeof val === 'object') hasObject = true;
    else if (typeof val === 'string') {
      if (val.length > 255) hasLongString = true;
      else hasString = true;
    }
  }

  if (hasObject) return 'LONGTEXT';
  if (hasLongString) return 'TEXT';
  if (hasString) return 'VARCHAR(255)';
  if (hasFloat) return 'DOUBLE';
  if (hasInt) return 'BIGINT';
  if (hasDate) return 'DATETIME';
  if (hasBool) return 'BOOLEAN';
  return 'TEXT';
}

async function main() {
  console.log('Connecting to MongoDB at', MONGO_URI);
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const adminDb = client.db().admin();
  const dbListResult = await adminDb.listDatabases();
  const databases = dbListResult.databases.map(d => d.name);

  console.log('Found databases:', databases);

  const stream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

  stream.write(`-- ========================================================\n`);
  stream.write(`-- FULL MONGODB TO SQL DUMP\n`);
  stream.write(`-- Generated At: ${new Date().toISOString()}\n`);
  stream.write(`-- Source Server: ${MONGO_URI}\n`);
  stream.write(`-- Exported Databases: ${databases.join(', ')}\n`);
  stream.write(`-- ========================================================\n\n`);
  stream.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

  for (const dbName of databases) {
    console.log(`\n--- Exporting Database: ${dbName} ---`);
    stream.write(`-- --------------------------------------------------------\n`);
    stream.write(`-- DATABASE: \`${dbName}\`\n`);
    stream.write(`-- --------------------------------------------------------\n`);
    stream.write(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;\n`);
    stream.write(`USE \`${dbName}\`;\n\n`);

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith('system.')) {
        console.log(`Skipping system collection: ${collName}`);
        continue;
      }

      console.log(`  Exporting collection: ${collName}`);
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();

      if (docs.length === 0) {
        stream.write(`-- Collection \`${collName}\` is empty\n\n`);
        continue;
      }

      // Collect all field names across all documents
      const fieldsMap = new Map(); // fieldName -> Set of sample values
      for (const doc of docs) {
        for (const key of Object.keys(doc)) {
          if (!fieldsMap.has(key)) {
            fieldsMap.set(key, []);
          }
          if (fieldsMap.get(key).length < 100) {
            fieldsMap.get(key).push(doc[key]);
          }
        }
      }

      const allFields = Array.from(fieldsMap.keys());
      // Reorder so _id is first if present
      if (allFields.includes('_id')) {
        const idx = allFields.indexOf('_id');
        allFields.splice(idx, 1);
        allFields.unshift('_id');
      }

      // Generate CREATE TABLE statement
      stream.write(`DROP TABLE IF EXISTS \`${collName}\`;\n`);
      stream.write(`CREATE TABLE \`${collName}\` (\n`);

      const columnDefs = allFields.map(field => {
        const sqlType = inferSqlType(fieldsMap.get(field), field);
        const safeFieldName = field.replace(/`/g, '``');
        return `  \`${safeFieldName}\` ${sqlType}`;
      });

      stream.write(columnDefs.join(',\n'));
      stream.write(`\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`);

      // Generate INSERT INTO statements
      const safeFieldsHeader = allFields.map(f => `\`${f.replace(/`/g, '``')}\``).join(', ');
      
      // Batch inserts in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        stream.write(`INSERT INTO \`${collName}\` (${safeFieldsHeader}) VALUES\n`);

        const valueRows = chunk.map(doc => {
          const rowVals = allFields.map(field => formatSqlValue(doc[field]));
          return `  (${rowVals.join(', ')})`;
        });

        stream.write(valueRows.join(',\n') + `;\n`);
      }
      stream.write(`\n`);
    }
  }

  stream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  stream.end();

  console.log(`\nExport completed successfully! Output saved to: ${OUTPUT_FILE}`);
  await client.close();
}

main().catch(err => {
  console.error('Error during MongoDB to SQL export:', err);
  process.exit(1);
});

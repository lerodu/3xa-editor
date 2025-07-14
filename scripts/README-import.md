# Data.json Import Script

This script allows you to import a `data.json` file (exported from a Webstudio project) into your local Webstudio instance as a new project.

## Prerequisites

1. **Webstudio instance running locally** on `http://localhost:3000`
2. **Database connection** properly configured
3. **Authentication** - you need to be logged in or provide a user ID
4. **data.json file** from an exported Webstudio project

## Usage

### Basic Import

```bash
pnpm import-data-json --dataJsonPath ./path/to/data.json --projectTitle "My Imported Project"
```

### Import with Specific User

```bash
pnpm import-data-json --dataJsonPath ./path/to/data.json --projectTitle "My Imported Project" --userId "user-uuid-here"
```

### Import with Output File

```bash
pnpm import-data-json --dataJsonPath ./path/to/data.json --projectTitle "My Imported Project" --outputFile ./import-result.json
```

## Arguments

| Argument         | Required | Description                                                          |
| ---------------- | -------- | -------------------------------------------------------------------- |
| `--dataJsonPath` | ✅       | Path to the data.json file to import                                 |
| `--projectTitle` | ✅       | Title for the new project                                            |
| `--userId`       | ❌       | Specific user ID to assign the project to (defaults to current user) |
| `--outputFile`   | ❌       | Path to save import results (optional)                               |

## What Gets Imported

✅ **Fully Imported:**

- All component instances
- All properties and styles
- Page structure and navigation
- Data sources and resources
- Breakpoints and responsive design
- Style sources and selections

⚠️ **Partially Imported:**

- **Assets**: Only metadata is imported. You'll need to manually upload the actual files.

❌ **Not Imported:**

- Deployment settings
- Marketplace product information
- User permissions and sharing settings

## Example Output

```
🚀 Starting data.json import...
📝 Project Title: My Imported Project
👤 User ID: Current authenticated user
📁 Reading data.json from: ./path/to/data.json
🔍 Validating data.json structure...
✅ Data validation successful
📊 Found 45 instances
📊 Found 123 props
📊 Found 8 assets
📊 Found 3 pages
🏗️  Creating new project...
✅ Project created with ID: abc123-def456-ghi789
🔨 Creating build with imported data...
✅ Build created with ID: xyz789-abc123-def456
⚠️  Note: 8 assets found in data.json
   You'll need to manually upload the actual asset files
   The asset metadata has been imported, but files are missing

🎉 Import completed successfully!
📋 Project ID: abc123-def456-ghi789
🔨 Build ID: xyz789-abc123-def456
📊 Assets to upload: 8

🔗 You can now access your project at:
   http://localhost:3000/builder/abc123-def456-ghi789
```

## Troubleshooting

### Common Issues

1. **"Failed to create build"**

   - Check your database connection
   - Ensure you have proper permissions
   - Verify the data.json structure is valid

2. **"User not found"**

   - Make sure you're logged in to Webstudio
   - Or provide a valid `--userId`

3. **"Data validation failed"**
   - The data.json file might be corrupted or from an incompatible version
   - Check the file structure matches Webstudio's expected format

### Asset Handling

After import, you'll need to manually upload any assets referenced in the project:

1. **Identify missing assets** from the import output
2. **Upload files** through the Webstudio interface
3. **Verify asset references** are working correctly

## Security Notes

- This script creates a mock request context
- It bypasses normal authentication flows
- Use with caution in production environments
- Consider adding proper authentication middleware

## Development

The script is located at `scripts/import-data-json.ts` and can be modified to:

- Add more validation
- Handle asset file uploads
- Support different data formats
- Add rollback functionality

## Database Impact

The script will:

1. Create a new project record
2. Create a new build record with all imported data
3. Link assets (metadata only)

No existing data is modified or deleted.

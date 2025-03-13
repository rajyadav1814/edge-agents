# File Search Assets

This directory contains sample files that can be used to test the file search functionality implemented in `file-search.ts`.

## Available Files

- `example.pdf`: A sample PDF document that can be used to test the file search capabilities.

## Usage with File Search

You can use these files to test the file search functionality with the following steps:

1. Create a vector store:
   ```bash
   deno task file-search create-store my-test-store
   ```

2. Upload a file:
   ```bash
   deno task file-search upload-file ./assets/example.pdf
   ```

3. Add the file to the vector store (replace with your actual IDs):
   ```bash
   deno task file-search add-file vector_store_id file_id
   ```

4. Check the file processing status:
   ```bash
   deno task file-search check-status vector_store_id
   ```

5. Search for information in the file:
   ```bash
   deno task file-search search vector_store_id "your search query"
   ```

6. Process all files in the assets directory at once:
   ```bash
   deno task file-search process-directory ./assets vector_store_id
   ```

## Adding More Files

You can add more files to this directory to expand your testing capabilities. The file search functionality supports various file formats including:

- PDF documents (.pdf)
- Text files (.txt)
- Markdown files (.md)
- Microsoft Word documents (.doc, .docx)
- Microsoft PowerPoint presentations (.pptx)
- Source code files (.js, .ts, .py, .java, etc.)
- HTML files (.html)
- CSS files (.css)
- JSON files (.json)

For a complete list of supported file formats, refer to the documentation in `../docs/plans/file-search.md`.

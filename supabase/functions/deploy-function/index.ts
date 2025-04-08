// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

console.log("Deploy function starting...")

serve(async (req) => {
  console.log(`Received ${req.method} request with content-type: ${req.headers.get('content-type')}`)
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let file: File
    let metadata: any

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (file upload)
      console.log('Processing multipart form data upload')
      const formData = await req.formData()
      const uploadedFile = formData.get('file')
      console.log('Received file:', uploadedFile instanceof File ? uploadedFile.name : 'No file')
      const metadataStr = formData.get('metadata')

      if (!uploadedFile || !(uploadedFile instanceof File)) {
        throw new Error('No file provided in form data')
      }
      if (!metadataStr || typeof metadataStr !== 'string') {
        throw new Error('No metadata provided in form data')
      }

      file = uploadedFile
      metadata = JSON.parse(metadataStr)
    } else if (contentType.includes('application/json')) {
      // Handle direct code submission
      console.log('Processing direct code submission')
      const body = await req.json()
      const { code, name, entrypoint_path } = body
      console.log('Received code submission with name:', name)

      if (!code || typeof code !== 'string') {
        throw new Error('No code provided in request body')
      }
      if (!name || typeof name !== 'string') {
        throw new Error('No name provided in request body')
      }

      // Create a File object from the code string
      const blob = new Blob([code], { type: 'application/typescript' })
      file = new File([blob], name, { type: 'application/typescript' })
      
      metadata = {
        entrypoint_path: entrypoint_path || 'index.ts',
        name: name
      }
    } else {
      throw new Error('Unsupported content type')
    }

    // Read file content
    const fileContent = await file.text()
    console.log(`Successfully processed file ${file.name} (${file.size} bytes)`)

    // Return success response with file info
    return new Response(
      JSON.stringify({
        success: true,
        filename: file.name,
        size: file.size,
        type: file.type,
        metadata: metadata,
        content_preview: fileContent.substring(0, 100) + '...'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
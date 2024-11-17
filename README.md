# MSDF Atlas Generator Server

This server provides an API endpoint to generate MSDF (Multi-channel Signed Distance Field) atlas fonts using the msdf-atlas-gen tool. It accepts font files and configuration parameters, processes them, and returns the generated atlas files.

## Prerequisites

- Node.js (v14 or higher)
- msdf-atlas-gen binary in the server root directory
- Write permissions for the `uploads` and `output` directories

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create required directories:
   ```bash
   mkdir uploads
   mkdir output
   ```

3. Ensure the msdf-atlas-gen binary has execution permissions:
   ```bash
   chmod +x msdf-atlas-gen
   ```

## API Endpoints

### POST /api/generate

Generates an MSDF atlas from a provided font file.

#### Request
- Method: `POST`
- Content-Type: `multipart/form-data`

#### Parameters

| Field | Type | Description |
|-------|------|-------------|
| file | File (.ttf/.otf) | The font file to process |
| glyphsOption | string | 'allGlyphs' or 'selectedGlyphs' |
| selectedGlyphs | string | (Optional) Specific glyphs to include |
| size | number | Font size in pixels |
| pxRange | number | Distance field range in pixels |
| ... | ... | Other msdf-atlas-gen parameters |

#### Response

```json
{
  "success": true,
  "message": "Atlas generated successfully",
  "output": {
    "font": "http://localhost:9090/output/font-name-atlas.arfont",
    "image": "http://localhost:9090/output/font-name-atlas.png",
    "json": "http://localhost:9090/output/font-name-atlas.json"
  }
}
```

## Directory Structure

```
server/
├── index.mjs          # Main server file
├── msdf-atlas-gen     # Binary executable
├── uploads/           # Temporary storage for uploaded fonts
├── output/           # Generated atlas files
└── README.md         # This file
```

## Error Handling

The server includes error handling for:
- Invalid file types
- Missing required parameters
- msdf-atlas-gen execution errors
- File system operations

## Development

Start the server in development mode:

```bash
npm run dev
```

The server will run on port 9090 by default.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 9090 | Server port number |

## Notes

- Uploaded files are stored temporarily in the `uploads` directory
- Generated files are served statically from the `output` directory
- The server automatically handles CORS for localhost development

## MSDF Atlas Gen Parameters

The server supports all standard msdf-atlas-gen parameters. Here are the most common ones:

| Parameter | Description | Default |
|-----------|-------------|---------|
| size | Font size in pixels | 32 |
| pxRange | Distance field range in pixels | 2 |
| format | Output format (png) | png |
| type | Atlas type (msdf, sdf, psdf) | msdf |

For a complete list of parameters, refer to the msdf-atlas-gen documentation.

## Security Considerations

- The server only accepts .ttf and .otf files
- File size limits are enforced through multer configuration
- Output directory is protected from directory traversal attacks
- CORS is configured for local development only

## Error Responses

```json
{
  "error": "Error message description"
}
```

Common error status codes:
- 400: Bad Request (invalid parameters or file type)
- 500: Internal Server Error (processing failed)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- msdf-atlas-gen tool creators
- Express.js framework
- Multer file upload middleware
import express from "express";
import cors from "cors";
import multer from "multer";
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only ttf and otf files
    if (file.mimetype === 'font/ttf' || file.mimetype === 'font/otf' || 
        file.originalname.match(/\.(ttf|otf)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only TTF and OTF files are allowed.'));
    }
  }
});

// Add this middleware before other routes to ensure HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(cors({
  origin: 'https://msdf.kansei.graphics',
  credentials: true
}));

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct binary based on platform
const MSDF_BINARY = path.join(__dirname, process.platform === 'darwin' 
  ? 'msdf-atlas-gen-macos'
  : 'msdf-atlas-gen-linux');

app.use('/output', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'https://msdf.kansei.graphics');
  next();
}, express.static(path.join(__dirname, 'output')));

app.post("/api/generate", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No font file uploaded' });
    }

    const fontFile = req.file;
    const { glyphsOption, selectedGlyphs, ...config } = req.body;

    // Prepare output paths
    const outputDir = path.join(__dirname, 'output');
    const outputName = `${path.parse(fontFile.originalname).name}-atlas`;
    
    // Build command arguments
    let command = [
      `"${MSDF_BINARY}"`, // Use quotes in case of spaces in path
      `-font "${fontFile.path}"`,
      `-type mtsdf`,
      `-format png`,
      `-size ${config.size || 32}`,
      `-pxrange ${config.pxRange || 2}`,
    ];

    // Add glyph selection based on option
    switch (glyphsOption) {
        case 'allGlyphs':
            command.push("-allglyphs");
            break;
        case 'selectedGlyphs':
            command.push(`-chars "${selectedGlyphs}"`);
            break;
    }

    // Add output configuration
    command.push(`-arfont "${path.join(outputDir, outputName)}.arfont"`);
    command.push(`-imageout "${path.join(outputDir, outputName)}.png"`);
    command.push(`-json "${path.join(outputDir, outputName)}.json"`);

    const fullCommand = command.join(' ');
    console.log('Executing command:', fullCommand);

    // Make sure the binary is executable
    await exec(`chmod +x "${MSDF_BINARY}"`);

    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        return res.status(500).json({ error: error.message });
      }

      // Get the server's base URL, checking for X-Forwarded-Proto header
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const baseUrl = `${protocol}://${req.get('host')}`;
      
      res.json({ 
        success: true, 
        message: 'Atlas generated successfully',
        output: {
          font: `${baseUrl}/output/${outputName}.arfont`,
          // Optionally include other generated files
          image: `${baseUrl}/output/${outputName}.png`,
          json: `${baseUrl}/output/${outputName}.json`
        },
        config: req.body
      });
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ... rest of your server code ...

const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
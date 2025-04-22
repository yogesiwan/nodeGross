const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Define resume directory path
const RESUME_DIR = path.join(__dirname, '../utils/resume');

// Ensure resume directory exists
if (!fs.existsSync(RESUME_DIR)) {
  fs.mkdirSync(RESUME_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, RESUME_DIR);
  },
  filename: function(req, file, cb) {
    // Use a standardized name for the resume + timestamp to prevent caching issues
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    cb(null, `resume_${timestamp}${fileExt}`);
  }
});

// Validate file type
const fileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

/**
 * Get a list of all resumes in the resume directory
 * @returns {Promise<Array>} List of resume files
 */
async function listResumes() {
  return new Promise((resolve, reject) => {
    fs.readdir(RESUME_DIR, (err, files) => {
      if (err) {
        console.error('Error reading resume directory:', err);
        return reject(err);
      }
      
      // Filter to only include PDF files
      const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
      
      // Map files to include details
      const fileDetails = pdfFiles.map(file => {
        const filePath = path.join(RESUME_DIR, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: stats.size,
          uploadedAt: stats.mtime
        };
      });
      
      resolve(fileDetails);
    });
  });
}

/**
 * Delete all existing resume files
 * @returns {Promise<number>} Number of files deleted
 */
async function deleteExistingResumes() {
  return new Promise((resolve, reject) => {
    fs.readdir(RESUME_DIR, (err, files) => {
      if (err) {
        console.error('Error reading resume directory:', err);
        return reject(err);
      }
      
      // Filter to only include PDF files
      const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
      
      let deletedCount = 0;
      
      // No files to delete
      if (pdfFiles.length === 0) {
        return resolve(0);
      }
      
      // Delete each file
      pdfFiles.forEach((file, index) => {
        const filePath = path.join(RESUME_DIR, file);
        
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting file ${file}:`, unlinkErr);
          } else {
            deletedCount++;
          }
          
          // Resolve when all files have been processed
          if (index === pdfFiles.length - 1) {
            resolve(deletedCount);
          }
        });
      });
    });
  });
}

/**
 * Get the currently active resume
 * @returns {Promise<Object|null>} Resume details or null if not found
 */
async function getActiveResume() {
  const resumes = await listResumes();
  
  if (resumes.length === 0) {
    return null;
  }
  
  // Sort by date (newest first) and return the first one
  return resumes.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
}

module.exports = {
  upload,
  listResumes,
  deleteExistingResumes,
  getActiveResume,
  RESUME_DIR
}; 
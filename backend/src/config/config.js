const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGO_URI
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expire: process.env.JWT_EXPIRE || '7d'
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'video/mp4',
      'video/mpeg',
      'audio/mpeg',
      'audio/wav',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },

  ai: {
    useOpenAI: process.env.USE_OPENAI === 'true',
    openAIKey: process.env.OPENAI_API_KEY,
    useLocalAI: process.env.USE_LOCAL_AI === 'true'
  },

  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET
  },

  categories: [
    'Documents',
    'Images',
    'Videos',
    'Audio',
    'Archives',
    'Code',
    'Spreadsheets',
    'Presentations',
    'Other'
  ]
};

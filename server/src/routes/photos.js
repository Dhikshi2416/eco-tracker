const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

const photosRouter = express.Router();
photosRouter.use(authMiddleware);

// POST /api/photos/upload
photosRouter.post('/upload', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/${req.file.filename}`;
    const photo = await prisma.photo.create({
      data: {
        userId: req.userId,
        filename: req.file.filename,
        url,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
    res.status(201).json(photo);
  } catch (e) {
    next(e);
  }
});

// GET /api/photos
photosRouter.get('/', async (req, res, next) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(photos);
  } catch (e) {
    next(e);
  }
});

module.exports = photosRouter;
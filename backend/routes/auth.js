const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Upload single image
router.post('/', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const file = req.files.image;
        const folder = req.body.folder || 'ethiopia_travel';

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: folder,
            resource_type: 'auto'
        });

        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload multiple images
router.post('/multiple', async (req, res) => {
    try {
        if (!req.files || !req.files.images) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        const folder = req.body.folder || 'ethiopia_travel';
        const uploadedImages = [];

        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.tempFilePath, {
                folder: folder,
                resource_type: 'auto'
            });
            uploadedImages.push({
                url: result.secure_url,
                public_id: result.public_id
            });
        }

        res.json({
            success: true,
            images: uploadedImages
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete image
router.delete('/:public_id', async (req, res) => {
    try {
        const result = await cloudinary.uploader.destroy(req.params.public_id);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
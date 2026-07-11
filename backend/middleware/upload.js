const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const uploadToCloudinary = async (file, folder = 'ethiopia_travel') => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: folder,
            resource_type: 'auto'
        });
        
        // Clean up temp file
        if (fs.existsSync(file.tempFilePath)) {
            fs.unlinkSync(file.tempFilePath);
        }
        
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        throw error;
    }
};

const uploadMultiple = async (files, folder = 'ethiopia_travel') => {
    const uploaded = [];
    for (const file of files) {
        const result = await uploadToCloudinary(file, folder);
        uploaded.push(result);
    }
    return uploaded;
};

module.exports = { uploadToCloudinary, uploadMultiple };
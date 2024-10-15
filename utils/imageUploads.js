const cloudinary = require('../config/config');
const sharp = require('sharp');

const handleMediaUpload = async (files, previousMedia = {}) => {
    let mediaData = {};

    const uploadToCloudinary = async (buffer, options) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(buffer);
        });
    };

    const deleteCloudinaryResource = async (publicId, resourceType) => {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            console.warn(`Warning: Could not delete Cloudinary resource ${publicId}:`, error.message);
        }
    };

    if (files.image) {
        try {
            const imageBuffer = await sharp(files.image[0].buffer)
                .resize(800)
                .jpeg({ quality: 80 })
                .toBuffer();

            if (previousMedia.image && previousMedia.image.publicId) {
                await deleteCloudinaryResource(previousMedia.image.publicId, 'image');
            }

            const imageResult = await uploadToCloudinary(imageBuffer, {
                resource_type: 'image'
            });

            mediaData.image = {
                url: imageResult.secure_url,
                publicId: imageResult.public_id,
                width: imageResult.width,
                height: imageResult.height,
                format: imageResult.format
            };
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    } else if (previousMedia.image) {
        mediaData.image = previousMedia.image;
    }

    if (files.video) {
        try {
            if (previousMedia.video && previousMedia.video.publicId) {
                await deleteCloudinaryResource(previousMedia.video.publicId, 'video');
            }

            const videoResult = await uploadToCloudinary(files.video[0].buffer, {
                resource_type: 'video'
            });

            mediaData.video = {
                url: videoResult.secure_url,
                publicId: videoResult.public_id,
                format: videoResult.format
            };
        } catch (error) {
            console.error('Error processing video:', error);
            throw error;
        }
    } else if (previousMedia.video) {
        mediaData.video = previousMedia.video;
    }

    return mediaData;
};

module.exports = { handleMediaUpload };
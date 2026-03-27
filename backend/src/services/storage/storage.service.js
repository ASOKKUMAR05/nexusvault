const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../../config/config');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Storage Service - Handle file system operations via AWS S3
 */
class StorageService {
    constructor() {
        this.s3Client = new S3Client({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey
            }
        });
        this.bucketName = config.aws.bucketName;
    }

    /**
     * Save file
     * Uploads the local file to S3
     */
    async saveFile(localFilePath, s3Key) {
        try {
            const fileStream = fsSync.createReadStream(localFilePath);
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
                Body: fileStream
            });
            await this.s3Client.send(command);
            return { success: true };
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw error;
        }
    }

    /**
     * Get S3 Object Stream for reading/downloading
     */
    async getFileStream(s3Key) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key
            });
            const response = await this.s3Client.send(command);
            return response.Body; // Readable node stream
        } catch (error) {
            console.error('Error reading file from S3:', error);
            throw error;
        }
    }

    /**
     * Delete file from S3
     */
    async deleteFile(s3Key) {
        try {
            // Also attempt to delete locally just in case it's a local file being passed (backward compatibility cleanup)
            if (fsSync.existsSync(s3Key)) {
                await fs.unlink(s3Key);
            }
            
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key
            });
            await this.s3Client.send(command);
            return { success: true };
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            throw error;
        }
    }

    /**
     * Copy file (for versioning) in S3
     */
    async copyFile(sourceKey, destinationKey) {
        try {
            const command = new CopyObjectCommand({
                Bucket: this.bucketName,
                CopySource: `${this.bucketName}/${sourceKey}`,
                Key: destinationKey
            });
            await this.s3Client.send(command);
            return { success: true };
        } catch (error) {
            console.error('Error copying file in S3:', error);
            throw error;
        }
    }

    /**
     * Check if file exists in S3
     */
    async fileExists(s3Key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key
            });
            await this.s3Client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'NotFound') return false;
            console.error('Error checking if file exists in S3:', error);
            throw error;
        }
    }

    /**
     * Get file stats from S3
     */
    async getFileStats(s3Key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key
            });
            const response = await this.s3Client.send(command);
            return {
                size: response.ContentLength,
                lastModified: response.LastModified,
                contentType: response.ContentType
            };
        } catch (error) {
            console.error('Error getting file stats from S3:', error);
            throw error;
        }
    }

    /**
     * Clean up orphaned files (Dummy method since S3 cleanup is managed differently)
     * To truly clean up orphaned files we'd list S3 objects and compare with DB.
     */
    async cleanupOrphanedFiles(userId, validS3Keys) {
        return { deleted: 0 };
    }
}

module.exports = new StorageService();

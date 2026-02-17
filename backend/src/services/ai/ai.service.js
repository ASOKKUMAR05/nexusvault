const config = require('../../config/config');
const { getCategoryFromMimeType, generateTagsFromFilename } = require('../../utils/helpers');

/**
 * AI Service - Core AI functionality with support for both OpenAI and Local models
 */
class AIService {
    constructor() {
        this.useOpenAI = config.ai.useOpenAI;
        this.useLocalAI = config.ai.useLocalAI;
    }

    /**
     * Auto-categorize file based on MIME type and filename
     */
    async categorizeFile(file) {
        try {
            // Basic categorization from MIME type
            const category = getCategoryFromMimeType(file.mimetype);

            // Generate tags from filename
            const tags = generateTagsFromFilename(file.originalname);

            // If using AI (OpenAI or Local), enhance categorization
            if (this.useOpenAI || this.useLocalAI) {
                // For now, we'll use rule-based approach
                // In production, integrate actual AI models here
                const enhancedTags = await this.enhanceTagsWithAI(file.originalname, category);
                return {
                    category,
                    tags: [...new Set([...tags, ...enhancedTags])].slice(0, 10)
                };
            }

            return { category, tags };
        } catch (error) {
            console.error('Error in categorizeFile:', error);
            return {
                category: 'Other',
                tags: generateTagsFromFilename(file.originalname)
            };
        }
    }

    /**
     * Enhance tags using AI (placeholder for actual AI integration)
     */
    async enhanceTagsWithAI(filename, category) {
        // This is a simplified version
        // In production, integrate with OpenAI or local model for better tag generation

        const categoryKeywords = {
            'Documents': ['document', 'report', 'contract', 'agreement', 'proposal'],
            'Images': ['photo', 'picture', 'screenshot', 'design', 'graphic'],
            'Videos': ['video', 'clip', 'movie', 'recording'],
            'Audio': ['audio', 'music', 'song', 'podcast', 'sound'],
            'Code': ['code', 'script', 'source', 'program'],
            'Spreadsheets': ['data', 'sheet', 'table', 'budget', 'report'],
            'Presentations': ['slides', 'presentation', 'deck']
        };

        const keywords = categoryKeywords[category] || [];
        const filenameLower = filename.toLowerCase();

        return keywords.filter(keyword => filenameLower.includes(keyword));
    }

    /**
     * Generate smart search suggestions
     */
    async generateSearchSuggestions(query, userFiles) {
        try {
            const suggestions = [];
            const queryLower = query.toLowerCase();

            // Find matching categories
            const categories = ['Documents', 'Images', 'Videos', 'Audio', 'Code', 'Spreadsheets'];
            categories.forEach(cat => {
                if (cat.toLowerCase().includes(queryLower)) {
                    suggestions.push({
                        type: 'category',
                        text: cat,
                        count: userFiles.filter(f => f.category === cat).length
                    });
                }
            });

            // Find matching tags
            const allTags = userFiles.flatMap(f => f.tags || []);
            const uniqueTags = [...new Set(allTags)];
            uniqueTags.forEach(tag => {
                if (tag.toLowerCase().includes(queryLower)) {
                    suggestions.push({
                        type: 'tag',
                        text: tag,
                        count: userFiles.filter(f => f.tags && f.tags.includes(tag)).length
                    });
                }
            });

            // Find matching filenames
            userFiles.forEach(file => {
                if (file.originalName.toLowerCase().includes(queryLower)) {
                    suggestions.push({
                        type: 'file',
                        text: file.originalName,
                        id: file._id
                    });
                }
            });

            return suggestions.slice(0, 10);
        } catch (error) {
            console.error('Error generating search suggestions:', error);
            return [];
        }
    }

    /**
     * Analyze file content (placeholder for future enhancement)
     */
    async analyzeFileContent(filePath, mimeType) {
        // This can be enhanced with actual content analysis
        // For images: OCR, object detection
        // For documents: text extraction, summary generation
        // For code: language detection, complexity analysis

        return {
            analyzed: false,
            message: 'Content analysis not yet implemented'
        };
    }
}

module.exports = new AIService();

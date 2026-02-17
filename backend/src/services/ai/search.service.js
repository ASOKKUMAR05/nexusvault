const File = require('../../models/File.model');
const aiService = require('./ai.service');

/**
 * Smart Search Service with AI enhancement
 */
class SearchService {
    /**
     * Perform smart search across user files
     */
    async smartSearch(userId, query, options = {}) {
        try {
            const {
                category = null,
                tags = [],
                dateFrom = null,
                dateTo = null,
                minSize = null,
                maxSize = null,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            // Build search query
            const searchQuery = {
                owner: userId
            };

            // Text search in filename and description
            if (query) {
                searchQuery.$or = [
                    { originalName: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ];
            }

            // Filter by category
            if (category) {
                searchQuery.category = category;
            }

            // Filter by tags
            if (tags.length > 0) {
                searchQuery.tags = { $in: tags };
            }

            // Filter by date range
            if (dateFrom || dateTo) {
                searchQuery.createdAt = {};
                if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
                if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
            }

            // Filter by size range
            if (minSize || maxSize) {
                searchQuery.size = {};
                if (minSize) searchQuery.size.$gte = parseInt(minSize);
                if (maxSize) searchQuery.size.$lte = parseInt(maxSize);
            }

            // Execute search
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const results = await File.find(searchQuery)
                .sort(sort)
                .populate('owner', 'name email')
                .lean();

            // Generate AI-powered suggestions
            const allUserFiles = await File.find({ owner: userId }).lean();
            const suggestions = await aiService.generateSearchSuggestions(query || '', allUserFiles);

            return {
                results,
                count: results.length,
                suggestions,
                query: {
                    text: query,
                    filters: {
                        category,
                        tags,
                        dateFrom,
                        dateTo,
                        minSize,
                        maxSize
                    }
                }
            };
        } catch (error) {
            console.error('Error in smart search:', error);
            throw error;
        }
    }

    /**
     * Get search suggestions based on partial query
     */
    async getSearchSuggestions(userId, partialQuery) {
        try {
            const userFiles = await File.find({ owner: userId }).lean();
            return await aiService.generateSearchSuggestions(partialQuery, userFiles);
        } catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    }

    /**
     * Get recently searched queries (can be stored in user preferences)
     */
    async getRecentSearches(userId) {
        // This would typically be stored in a separate collection or user preferences
        // For now, return empty array
        return [];
    }

    /**
     * Search by similar files
     */
    async findSimilarFiles(fileId, userId) {
        try {
            const file = await File.findOne({ _id: fileId, owner: userId });

            if (!file) {
                return [];
            }

            // Find files with same category and overlapping tags
            const similar = await File.find({
                owner: userId,
                _id: { $ne: fileId },
                $or: [
                    { category: file.category },
                    { tags: { $in: file.tags || [] } }
                ]
            })
                .limit(10)
                .lean();

            return similar;
        } catch (error) {
            console.error('Error finding similar files:', error);
            return [];
        }
    }
}

module.exports = new SearchService();

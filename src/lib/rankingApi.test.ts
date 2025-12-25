import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateRankingWithConfirmation } from './rankingApi';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock window.confirm (create window global for Node environment)
const mockConfirm = vi.fn();
(global as any).window = { confirm: mockConfirm };

describe('updateRankingWithConfirmation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockRankingId = 'test-ranking-123';
    const mockDataToSave = {
        topic: 'cuisines',
        rankedTiers: [['Italian', 'Japanese']],
        unrankedItems: ['Mexican'],
        otherBlobIds: [],
    };

    describe('when skipConfirmation is true', () => {
        it('should skip GET request and directly make PUT request', async () => {
            const mockPutResponse = new Response(JSON.stringify({ message: 'success' }), { status: 200 });
            mockFetch.mockResolvedValueOnce(mockPutResponse);

            const result = await updateRankingWithConfirmation(mockRankingId, mockDataToSave, { skipConfirmation: true });

            // Should only call fetch once (PUT), not twice (GET + PUT)
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(`/api/rankings/${mockRankingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockDataToSave),
            });
            expect(mockConfirm).not.toHaveBeenCalled();
            expect(result).toBe(mockPutResponse);
        });
    });

    describe('when existing ranking has no ranked items', () => {
        it('should proceed with PUT without showing confirmation', async () => {
            const existingRanking = {
                topic: 'cuisines',
                rankedTiers: [], // Empty - no ranked items
                unrankedItems: ['Italian', 'Japanese'],
                otherBlobIds: [],
            };
            const mockGetResponse = new Response(JSON.stringify(existingRanking), { status: 200 });
            const mockPutResponse = new Response(JSON.stringify({ message: 'success' }), { status: 200 });
            
            mockFetch
                .mockResolvedValueOnce(mockGetResponse)  // GET request
                .mockResolvedValueOnce(mockPutResponse); // PUT request

            const result = await updateRankingWithConfirmation(mockRankingId, mockDataToSave);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(mockConfirm).not.toHaveBeenCalled();
            expect(result).toBe(mockPutResponse);
        });
    });

    describe('when existing ranking has ranked items', () => {
        const existingRankingWithItems = {
            topic: 'cuisines',
            rankedTiers: [['Existing Item']], // Has ranked items
            unrankedItems: [],
            otherBlobIds: [],
        };

        it('should show confirmation dialog and proceed if user confirms', async () => {
            const mockGetResponse = new Response(JSON.stringify(existingRankingWithItems), { status: 200 });
            const mockPutResponse = new Response(JSON.stringify({ message: 'success' }), { status: 200 });
            
            mockFetch
                .mockResolvedValueOnce(mockGetResponse)
                .mockResolvedValueOnce(mockPutResponse);
            mockConfirm.mockReturnValueOnce(true); // User confirms

            const result = await updateRankingWithConfirmation(mockRankingId, mockDataToSave);

            expect(mockConfirm).toHaveBeenCalledWith(
                "This ranking already has ranked items. Are you sure you want to overwrite them?"
            );
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result).toBe(mockPutResponse);
        });

        it('should return null if user cancels the confirmation', async () => {
            const mockGetResponse = new Response(JSON.stringify(existingRankingWithItems), { status: 200 });
            
            mockFetch.mockResolvedValueOnce(mockGetResponse);
            mockConfirm.mockReturnValueOnce(false); // User cancels

            const result = await updateRankingWithConfirmation(mockRankingId, mockDataToSave);

            expect(mockConfirm).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledTimes(1); // Only GET, no PUT
            expect(result).toBeNull();
        });
    });

    describe('when GET request fails', () => {
        it('should proceed with PUT anyway on 404', async () => {
            const mockGetResponse = new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
            const mockPutResponse = new Response(JSON.stringify({ message: 'success' }), { status: 200 });
            
            mockFetch
                .mockResolvedValueOnce(mockGetResponse)
                .mockResolvedValueOnce(mockPutResponse);

            const result = await updateRankingWithConfirmation(mockRankingId, mockDataToSave);

            expect(mockConfirm).not.toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result).toBe(mockPutResponse);
        });

        it('should proceed with PUT anyway on network error', async () => {
            const mockPutResponse = new Response(JSON.stringify({ message: 'success' }), { status: 200 });
            
            mockFetch
                .mockRejectedValueOnce(new Error('Network error')) // GET fails
                .mockResolvedValueOnce(mockPutResponse);           // PUT succeeds

            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await updateRankingWithConfirmation(mockRankingId, mockDataToSave);

            expect(mockConfirm).not.toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result).toBe(mockPutResponse);

            consoleSpy.mockRestore();
        });
    });
});

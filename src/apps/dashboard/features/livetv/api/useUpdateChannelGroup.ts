import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { withAuthHeaders } from 'utils/sdk/withAuthHeaders';
import { queryClient } from 'utils/query/queryClient';

interface UpdateChannelGroupParams {
    itemId: string;
    channelGroup: string;
}

/**
 * Updates a channel's ChannelGroup via the existing item update endpoint.
 *
 * Reuses POST /Items/{itemId} with a BaseItemDto body containing
 * the new channelGroup value.
 */
export const useUpdateChannelGroup = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async ({ itemId, channelGroup }: UpdateChannelGroupParams) => {
            await api!.axiosInstance.post(
                `/Items/${itemId}`,
                { channelGroup },
                withAuthHeaders(api!, {
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['LiveTv', 'Channels']
            });
            void queryClient.invalidateQueries({
                queryKey: ['LiveTv', 'ChannelGroups']
            });
        }
    });
};
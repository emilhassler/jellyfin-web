import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { withAuthHeaders } from 'utils/sdk/withAuthHeaders';

/**
 * Fetches all live TV channels with their ChannelGroup property.
 *
 * Uses the raw axios instance because the SDK's generated response type
 * predates the ChannelGroup field on BaseItemDto.
 */
export const useAllChannels = () => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: ['LiveTv', 'Channels', 'All', user?.Id],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<BaseItemDtoQueryResult>(
                '/LiveTv/Channels',
                withAuthHeaders(api!, {
                    params: {
                        userId: user?.Id,
                        addCurrentProgram: false
                    },
                    signal
                })
            );

            return response.data;
        },
        enabled: !!api
    });
};
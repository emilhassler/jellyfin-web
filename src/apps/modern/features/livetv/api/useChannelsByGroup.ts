import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import type { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { withAuthHeaders } from 'utils/sdk/withAuthHeaders';

interface UseChannelsByGroupOptions {
    limit?: number;
    startIndex?: number;
}

/**
 * Fetches the live TV channels, optionally filtered by channel group.
 *
 * The "All" group maps to no filter, so the full channel list is returned.
 * The request is issued through the SDK's axios instance directly because
 * the generated SDK client predates the channelGroup query parameter.
 */
export const useChannelsByGroup = (
    channelGroup: string | null,
    options?: UseChannelsByGroupOptions
) => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: [
            'LiveTv',
            'Channels',
            'ByGroup',
            channelGroup,
            user?.Id,
            options?.startIndex,
            options?.limit
        ],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<BaseItemDtoQueryResult>(
                '/LiveTv/Channels',
                withAuthHeaders(api!, {
                    params: {
                        userId: user?.Id,
                        fields: ['PrimaryImageAspectRatio'] satisfies ItemFields[],
                        enableImageTypes: ['Primary'] satisfies ImageType[],
                        addCurrentProgram: true,
                        limit: options?.limit,
                        startIndex: options?.startIndex,
                        channelGroup:
                            channelGroup && channelGroup !== 'All'
                                ? channelGroup
                                : undefined
                    },
                    signal
                })
            );

            return response.data;
        },
        enabled: !!api
    });
};

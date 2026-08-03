import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { withAuthHeaders } from 'utils/sdk/withAuthHeaders';

/**
 * Fetches the distinct channel groups available on the server.
 *
 * The list always contains "All" as the first entry, followed by the
 * distinct M3U group-title values sorted alphabetically.
 */
export const useChannelGroups = () => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: ['LiveTv', 'ChannelGroups', user?.Id],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<string[]>(
                '/LiveTv/ChannelGroups',
                withAuthHeaders(api!, {
                    params: { userId: user?.Id },
                    signal
                })
            );

            return response.data;
        },
        enabled: !!api
    });
};

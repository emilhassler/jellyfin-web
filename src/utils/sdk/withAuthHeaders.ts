import type { Api } from '@jellyfin/sdk';
import type { AxiosRequestConfig } from 'axios';

/**
 * Merges the SDK configuration's auth headers (Authorization, Accept-Language)
 * into the given axios request config.
 *
 * Raw `api.axiosInstance` calls do NOT automatically include these headers —
 * they are only applied by the generated API wrappers via `api.configuration`.
 * Use this helper whenever issuing raw axios requests through the SDK.
 */
export const withAuthHeaders = <T extends AxiosRequestConfig>(
    api: Api,
    config: T
): T => {
    const headers = api.configuration.baseOptions?.headers;

    return {
        ...config,
        headers: {
            ...(headers ?? {}),
            ...(config.headers ?? {})
        }
    };
};
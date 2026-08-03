import React, { useCallback, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import SaveIcon from '@mui/icons-material/Save';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { type MRT_ColumnDef, MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import globalize from 'lib/globalize';

import { useAllChannels } from 'apps/dashboard/features/livetv/api/useAllChannels';
import { useChannelGroups } from 'apps/dashboard/features/livetv/api/useChannelGroups';
import { useUpdateChannelGroup } from 'apps/dashboard/features/livetv/api/useUpdateChannelGroup';

/**
 * A channel item with the ChannelGroup field that the SDK's generated
 * BaseItemDto type doesn't include yet.
 */
interface ChannelRow {
    Id: string;
    Number?: string | null;
    Name?: string | null;
    ChannelGroup?: string | null;
}

/**
 * Splits a pipe-separated group string into an array of group names.
 * Handles null/empty input.
 */
const parseGroups = (raw: string | null | undefined): string[] =>
    raw
        ? raw.split('|').filter((g) => g.trim().length > 0)
        : [];

/**
 * Dashboard page for viewing and editing live TV channel groups.
 *
 * Each channel's group column is a multi-select autocomplete
 * (freeSolo) so users can pick existing groups or create new ones.
 * On save, selected groups are joined with '|' and stored in the
 * ChannelGroup column.
 */
export const Component = () => {
    const { data: channelsResult, isPending: channelsLoading } = useAllChannels();
    const { data: groups, isPending: groupsLoading } = useChannelGroups();
    const updateChannelGroup = useUpdateChannelGroup();

    // Track pending edits: itemId -> selected group names array
    const [ draftGroups, setDraftGroups ] = useState<Record<string, string[]>>({});

    const channels: ChannelRow[] = useMemo(
        () => (channelsResult?.Items ?? []) as unknown as ChannelRow[],
        [channelsResult]
    );

    const isLoading = channelsLoading || groupsLoading;

    const handleGroupChange = useCallback(
        (itemId: string, values: string[]) => {
            setDraftGroups((prev) => ({ ...prev, [itemId]: values }));
        },
        []
    );

    const handleSave = useCallback(
        (itemId: string) => {
            const values = draftGroups[itemId];
            if (values === undefined) return;

            // Join selected groups with pipe separator
            const channelGroup = values.join('|');

            updateChannelGroup.mutate(
                { itemId, channelGroup },
                {
                    onSuccess: () => {
                        setDraftGroups((prev) => {
                            const next = { ...prev };
                            delete next[itemId];
                            return next;
                        });
                    }
                }
            );
        },
        [draftGroups, updateChannelGroup]
    );

    // Available groups to suggest (excluding "All" which is a display-only concept)
    const groupOptions = useMemo(() => {
        const base = groups ? groups.filter((g) => g !== 'All') : [];
        // Include any user-typed groups from drafts
        const draftValues = Object.values(draftGroups)
            .flat()
            .filter((v) => v && !base.includes(v));
        return [...new Set([...base, ...draftValues])];
    }, [groups, draftGroups]);

    const columns = useMemo<MRT_ColumnDef<ChannelRow>[]>(
        () => [
            {
                id: 'Number',
                accessorKey: 'Number',
                header: globalize.translate('LabelNumber'),
                size: 100
            },
            {
                id: 'Name',
                accessorKey: 'Name',
                header: globalize.translate('LabelName'),
                size: 300
            },
            {
                id: 'ChannelGroup',
                header: globalize.translate('LabelChannelGroup'),
                size: 350,
                Cell: ({ row }) => {
                    const itemId = row.original.Id;

                    // Use draft value if available, else parse stored value
                    const currentValue =
                        draftGroups[itemId] ??
                        parseGroups(row.original.ChannelGroup);

                    return (
                        <Autocomplete
                            multiple
                            freeSolo
                            disableCloseOnSelect
                            size='small'
                            options={groupOptions}
                            value={currentValue}
                            isOptionEqualToValue={(option, value) =>
                                option === value
                            }
                            limitTags={2}
                            onChange={(_e, newVal) =>
                                handleGroupChange(itemId, newVal)
                            }
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        variant='outlined'
                                        size='small'
                                        label={option}
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>
                                    <Checkbox
                                        checked={selected}
                                        sx={{ mr: 1 }}
                                    />
                                    {option}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant='outlined'
                                    placeholder='Add group...'
                                />
                            )}
                            sx={{
                                minWidth: 200,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'background.paper'
                                }
                            }}
                        />
                    );
                }
            }
        ],
        [draftGroups, groupOptions, handleGroupChange]
    );

    const table = useMaterialReactTable({
        columns,
        data: channels,
        enableSorting: true,
        enableFilters: true,
        enableColumnActions: false,
        enablePagination: false,
        enableBottomToolbar: false,
        enableRowVirtualization: true,
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: ''
            }
        },
        state: {
            isLoading
        },
        muiTableContainerProps: {
            sx: {
                maxHeight: 'calc(100vh - 14rem)'
            }
        },
        renderRowActions: ({ row }) => {
            const itemId = row.original.Id;
            const hasChanges = draftGroups[itemId] !== undefined;
            return (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip
                        disableInteractive
                        title={globalize.translate('Save')}
                    >
                        <span>
                            <IconButton
                                color='primary'
                                disabled={!hasChanges}
                                onClick={() => handleSave(itemId)}
                            >
                                <SaveIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        }
    });

    if (isLoading) {
        return <Loading />;
    }

    return (
        <Page
            id='liveTvChannelsPage'
            className='mainAnimatedPage type-interior'
            >
            <Box
                className='content-primary'
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}
            >
                <Stack spacing={2} sx={{ marginBottom: 1, flexShrink: 0 }}>
                    <Typography variant='h1'>
                        {globalize.translate('HeaderLiveTvChannels')}
                    </Typography>
                    <Typography>
                        {globalize.translate(
                            'LabelLiveTvChannelsDescription'
                        )}
                    </Typography>
                </Stack>
                <MaterialReactTable table={table} />
            </Box>
        </Page>
    );
};

Component.displayName = 'LiveTvChannelsPage';
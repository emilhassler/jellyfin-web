import React, { useState, type FC } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Loading from 'components/loading/LoadingComponent';
import { playbackManager } from 'components/playback/playbackmanager';
import { useApi } from 'hooks/useApi';

import { useChannelGroups } from '../api/useChannelGroups';
import { useChannelsByGroup } from '../api/useChannelsByGroup';

/**
 * Live TV channel category view.
 *
 * Displays a horizontal row of group chips at the top and a
 * responsive channel grid below. Clicking a chip filters the
 * grid to that group. Clicking a channel card starts live playback.
 */
const CategoryChannelsView: FC = () => {
    const { __legacyApiClient__ } = useApi();
    const { data: groups, isPending: groupsPending } = useChannelGroups();
    const [selectedGroup, setSelectedGroup] = useState<string>('All');
    const { data: channelsResult, isPending: channelsPending } =
        useChannelsByGroup(selectedGroup);

    const handleGroupClick = (group: string) => {
        setSelectedGroup(group);
    };

    const handleChannelPlay = (channelId: string) => {
        playbackManager.play({
            ids: [channelId],
            serverId: __legacyApiClient__?.serverId(),
            startIndex: 0
        });
    };

    if (groupsPending || channelsPending) return <Loading />;

    return (
        <Box sx={{ padding: 2 }}>
            {/* Group chip selector — horizontally scrollable */}
            <Stack
                direction='row'
                spacing={1}
                sx={{
                    overflowX: 'auto',
                    pb: 2,
                    '&::-webkit-scrollbar': { height: 6 },
                    '&::-webkit-scrollbar-thumb': { borderRadius: 3 }
                }}
            >
                {groups?.map((group) => (
                    <Chip
                        key={group}
                        label={group}
                        onClick={() => handleGroupClick(group)}
                        variant={
                            selectedGroup === group ? 'filled' : 'outlined'
                        }
                        color={
                            selectedGroup === group ? 'primary' : 'default'
                        }
                        sx={{
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontWeight:
                                selectedGroup === group ? 700 : 400
                        }}
                    />
                ))}
            </Stack>

            {/* Channel grid */}
            {channelsResult?.Items && channelsResult.Items.length > 0 ? (
                <Grid container spacing={2}>
                    {channelsResult.Items.map((channel) => (
                        <Grid
                            key={channel.Id}
                            item
                            xs={6}
                            sm={4}
                            md={3}
                            lg={2}
                        >
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: 'background.paper',
                                    transition:
                                        'transform 0.15s, box-shadow 0.15s',
                                    '&:hover': {
                                        transform: 'scale(1.03)',
                                        boxShadow: 4
                                    }
                                }}
                                onClick={() =>
                                    handleChannelPlay(channel.Id!)
                                }
                            >
                                <CardActionArea>
                                    {channel.ImageTags?.Primary && (
                                        <CardMedia
                                            component='img'
                                            sx={{
                                                objectFit: 'contain',
                                                height: 120,
                                                p: 1,
                                                bgcolor: 'action.hover'
                                            }}
                                            image={`${__legacyApiClient__?.getUrl(
                                                'Items/' +
                                                    channel.Id +
                                                    '/Images/Primary',
                                                {
                                                    tag: channel.ImageTags
                                                        .Primary
                                                }
                                            )}`}
                                            alt={channel.Name ?? ''}
                                        />
                                    )}
                                    <CardContent
                                        sx={{
                                            textAlign: 'center',
                                            py: 1
                                        }}
                                    >
                                        <Typography
                                            variant='body2'
                                            noWrap
                                            fontWeight={600}
                                        >
                                            {channel.Number &&
                                                `${channel.Number} `}
                                            {channel.Name}
                                        </Typography>
                                        {channel
                                            .CurrentProgram?.Name && (
                                            <Typography
                                                variant='caption'
                                                color='text.secondary'
                                                noWrap
                                            >
                                                {channel.CurrentProgram.Name}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography
                    variant='body1'
                    color='text.secondary'
                    textAlign='center'
                    sx={{ mt: 4 }}
                >
                    No channels in this category.
                </Typography>
            )}
        </Box>
    );
};

export default CategoryChannelsView;
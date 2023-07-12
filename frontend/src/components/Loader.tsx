import { Box, CircularProgress, Container } from '@mui/material';
import React from 'react';

const Loader = () => {
    return (
        <Container sx={{ height: '95vh' }}>
            <Box
                display='flex'
                alignItems='center'
                justifyContent='center'
                sx={{ height: '100%' }}
            >
                <CircularProgress />
            </Box>
        </Container>
    );
};

export default Loader;


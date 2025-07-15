import React from 'react'
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
} from '@mui/material'
import Router from 'next/router'

const handleClick = (id) => {
    Router.push(
        {
            pathname: `/category/${id}`,
            query: { name: name },
        },
        undefined,
        { shallow: true }
    )
}

const CategoryCard = ({ id, image, title, location }) => {
    return (
        <Card
            onClick={() => handleClick(id)}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: 3,
            }}
        >
            <CardMedia
                component="img"
                height="180"
                image={image}
                alt={title}
                sx={{ objectFit: 'cover' }}
            />
            <CardContent
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <Box textAlign="center">
                    <Typography
                        gutterBottom
                        variant="h6"
                        component="div"
                        fontWeight="bold"
                    >
                        {title}
                    </Typography>
                    {/*<Typography variant="body2" color="text.secondary">*/}
                    {/*    {location}*/}
                    {/*</Typography>*/}
                </Box>
                {/*<Box mt={2}>*/}
                {/*    <Button*/}
                {/*        variant="contained"*/}
                {/*        sx={{*/}
                {/*            backgroundColor: '#E20A7E',*/}
                {/*            color: 'white',*/}
                {/*            textTransform: 'none',*/}
                {/*            fontWeight: 600,*/}
                {/*            '&:hover': { backgroundColor: '#750943' },*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        Show*/}
                {/*    </Button>*/}
                {/*</Box>*/}
            </CardContent>
        </Card>
    )
}

export default CategoryCard

import React from 'react'
import { Box, Container, Grid } from '@mui/material'
import CategoryCard from './CategoryCard'
import { useQuery } from 'react-query'
import { CategoryApi } from '@/hooks/react-query/config/categoryApi'
import { onErrorResponse } from '@/components/ErrorResponse'
import CustomEmptyResult from '@/components/empty-view/CustomEmptyResult'

const CategoryList = () => {
    const { isLoading, data, refetch } = useQuery(
        ['category'],
        () => CategoryApi.categories(searchKey),
        {
            onError: onErrorResponse,
        }
    )

    return (
        <Container sx={{ py: 4 }}>
            <Grid container spacing={4}>
                {data?.data?.map((proj, index) => (
                    <Grid item key={index} xs={12} sm={6} md={3}>
                        <CategoryCard
                            id={proj?.id}
                            title={proj?.name}
                            image={proj?.image_full_url}
                            location={
                                proj?.location ??
                                'No C, 24, Prime Complex, Shop, Johnston Street, Kampala'
                            }
                        />
                    </Grid>
                ))}
                {data?.data?.length === 0 && (
                    <CustomEmptyResult label="No category found" />
                )}
            </Grid>
        </Container>
    )
}

export default CategoryList

import { Button, IconButton, styled } from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton'

export const CustomIconButton = styled(IconButton)(({ theme }) => ({
    borderRadius: '50%',
}))

export const CustomButtonWarning = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.error.main,
    '&:hover': {
        backgroundColor: theme.palette.error.dark,
    },
    width: '100%',
    [theme.breakpoints.up('xs')]: {
        width: '11.5rem',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '0.313rem',
    },
}))

export const CustomButtonCancel = styled(Button)(({ theme, width }) => ({
    backgroundColor: theme.palette.neutral[300],
    color: 'black',

    '&:hover': {
        backgroundColor: theme.palette.neutral[400],
    },
    width: '100%',
    [theme.breakpoints.up('xs')]: {
        width: width ? width : '11.5rem',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '0.313rem',
    },
}))

export const CustomButtonSuccess = styled(LoadingButton)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.neutral[100],
    width: '100%',
    [theme.breakpoints.up('xs')]: {
        width: '13.5rem',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '0.313rem',
    },
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
}))

export const CustomButtonPrimary = styled(Button)(
    ({
        theme,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        maxWidth,
    }) => ({
        backgroundColor: theme.palette.primary.main,
        color: `${theme.palette.whiteContainer.main} !important`,
        paddingLeft: paddingLeft ?? '0.313rem',
        paddingRight: paddingRight ?? '0.313rem',
        paddingTop: paddingTop ?? '16px',
        paddingBottom: paddingBottom ?? '16px',
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
        width: '100%',

        [theme.breakpoints.up('xs')]: {
            maxWidth: maxWidth ?? '150px',
        },
    })
)

// ##ziaul

export const SignInButton = styled(Button)(({ theme }) => ({
    color: '#fff',
    backgroundColor: theme.palette.primary.main,
    padding: '7px 20px',
}))

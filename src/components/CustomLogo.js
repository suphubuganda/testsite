import React from 'react'
import { Logo } from '@/styled-components/CustomStyles.style'
import { useRouter } from 'next/router'
import CustomImageContainer from '@/components/CustomImageContainer'

const CustomLogo = ({ logoImg, atlText, height, width }) => {
    const router = useRouter()
    let zoneid = undefined
    if (typeof window !== 'undefined') {
        zoneid = JSON.parse(localStorage.getItem('zoneid'))
    }
    let currentLocation = undefined
    if (typeof window !== 'undefined') {
        currentLocation = JSON.parse(localStorage.getItem('currentLatLng'))
    }

    const handleClick = () => {
        const shouldRedirectToHome =
            zoneid && currentLocation?.lat && currentLocation?.lng
        const newPath = shouldRedirectToHome ? '/home' : '/'

        router.push('/', undefined, { shallow: true }).then(() => {
            window.scrollTo(0, 0)
        })
    }

    return (
        <Logo height={height} width={width} onClick={handleClick}>
            <CustomImageContainer
                width={width}
                height={height}
                src={logoImg}
                alt={atlText}
            />
        </Logo>
    )
}

export default CustomLogo

import { baseUrl } from '@/api/MainApi'
import { GoogleApi } from '@/hooks/react-query/config/googleApi'
import { OrderApi } from '@/hooks/react-query/config/orderApi'
import { ProfileApi } from '@/hooks/react-query/config/profileApi'
import { RestaurantsApi } from '@/hooks/react-query/config/restaurantApi'
import {
    formatPhoneNumber,
    getAmount,
    getFinalTotalPrice,
    getProductDiscount,
    getTaxableTotalPrice,
    getVariation,
    handleDistance,
    isFoodAvailableBySchedule,
    maxCodAmount,
} from '@/utils/customFunctions'
import {
    Box,
    Checkbox,
    FormControlLabel,
    Grid,
    Stack,
    Typography,
    alpha,
} from '@mui/material'
import moment from 'moment'
import Router, { useRouter } from 'next/router'
import React, { useEffect, useReducer, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import { onErrorResponse, onSingleErrorResponse } from '../ErrorResponse'
import { DeliveryTitle, OrderSummary } from './CheckOut.style'
import DeliveryDetails from './DeliveryDetails'
import RestaurantScheduleTime from './RestaurantScheduleTime'
import { getDayNumber } from './const'
import OrderCalculation from './order-summary/OrderCalculation'
import OrderSummaryDetails from './order-summary/OrderSummaryDetails'
import PaymentOptions from './order-summary/PaymentOptions'

import useGetCashBackAmount from '@/hooks/react-query/cashback/useGetCashBackAmount'
import { useOfflinePayment } from '@/hooks/react-query/offline-payment/useOfflinePayment'
import { useGetOrderPlaceNotification } from '@/hooks/react-query/order-place/useGetOrderPlaceNotification'
import {
    setOfflineInfoStep,
    setOfflineWithPartials,
    setOrderDetailsModal,
} from '@/redux/slices/OfflinePayment'
import { setWalletAmount } from '@/redux/slices/cart'
import { setUser } from '@/redux/slices/customer'
import { setZoneData } from '@/redux/slices/global'
import {
    CustomPaperBigCard,
    CustomStackFullWidth,
} from '@/styled-components/CustomStyles.style'
import { useTheme } from '@emotion/react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import useGetVehicleCharge from '../../hooks/react-query/config/useGetVehicleCharge'
import useGetOfflinePaymentOptions from '../../hooks/react-query/offline-payment/useGetOfflinePaymentOptions'
import CustomImageContainer from '../CustomImageContainer'
import ItemSelectWithChip from '../ItemSelectWithChip'
import CustomModal from '../custom-modal/CustomModal'
import Cutlery from './Cutlery'
import DeliveryManTips from './DeliveryManTips'
import OfflinePaymentForm from './OfflinePaymentForm'
import PartialPayment from './PartialPayment'
import PartialPaymentModal from './PartialPaymentModal'
import thunderstorm from './assets/thunderstorm.svg'
import wallet from './assets/walletpayment.png'
import { deliveryInstructions, productUnavailableData } from './demo'
import { getGuestId, getToken } from './functions/getGuestUserId'
import { getSubscriptionOrderCount } from './functions/getSubscriptionOrderCount'
import { subscriptionReducer, subscriptionsInitialState } from './states'
import {
    additionalInformationInitialState,
    additionalInformationReducer,
} from './states/additionalInformationStates'
import useGetMostTrips from '@/hooks/react-query/useGetMostTrips'
import { setIsNeedLoad } from '@/redux/slices/utils'
import GuestUserInforForm from '@/components/checkout-page/guest-user/GuestUserInforForm'
import DineInPreferableTime from '@/components/checkout-page/DineInPreferableTime'

let currentDate = moment().format('YYYY/MM/DD HH:mm')
let nextday = moment(currentDate).add(1, 'days').format('YYYY/MM/DD')

let today = moment(currentDate).format('dddd')
let tomorrow = moment(nextday).format('dddd')

var CurrentDatee = moment().format()

let todayTime = moment(CurrentDatee).format('HH:mm')

export const handleValuesFromCartItems = (variationValues) => {
    let value = []
    if (variationValues?.length > 0) {
        variationValues?.forEach((item) => {
            if (item?.isSelected) {
                value.push(item?.label)
            }
        })
    } else {
        variationValues && value.push(variationValues[0]?.label)
    }
    return value
}
export const handleIdsFromCartItems = (variationValues) => {
    let value = []
    if (variationValues?.length > 0) {
        variationValues?.forEach((item) => {
            if (item?.isSelected) {
                value.push(item?.option_id)
            }
        })
    } else {
        variationValues && value.push(variationValues[0]?.option_id)
    }
    return value
}
const CheckoutPage = ({ isDineIn }) => {
    const router = useRouter()
    const dispatch = useDispatch()
    const theme = useTheme()
    const offlineFormRef = useRef()
    const { t } = useTranslation()
    const { global, couponInfo } = useSelector((state) => state.globalSettings)

    const {
        cartList,
        campFoodList,
        type,
        totalAmount,
        walletAmount,
        subscriptionSubTotal,
    } = useSelector((state) => state.cart)
    let currentLatLng = undefined
    const [address, setAddress] = useState(undefined)
    const [paymenMethod, setPaymenMethod] = useState('')
    const [numberOfDay, setDayNumber] = useState(getDayNumber(today))
    const [orderType, setOrderType] = useState('')
    const [couponDiscount, setCouponDiscount] = useState(null)
    const [scheduleAt, setScheduleAt] = useState('now')
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [taxAmount, setTaxAmount] = useState(0)
    const [cutlery, setCutlery] = useState(0)
    const [unavailable_item_note, setUnavailable_item_note] = useState(null)
    const [delivery_instruction, setDelivery_instruction] = useState(null)
    const [total_order_amount, setTotalOrderAmount] = useState(0)
    const [orderId, setOrderId] = useState(null)
    const [usePartialPayment, setUsePartialPayment] = useState(false)
    const [switchToWallet, setSwitchToWallet] = useState(false)
    const [openModal, setOpenModal] = useState(false)
    const [openPartialModel, setOpenPartialModel] = useState(false)
    const [deliveryTip, setDeliveryTip] = useState(0)
    const [selected, setSelected] = useState('')
    const [paymentMethodDetails, setPaymentMethodDetails] = useState({})
    const [cashbackAmount, setCashbackAmount] = useState(null)
    const [extraPackagingCharge, setExtraPackagingCharge] = useState(0)
    const { method } = router.query
    const { mutate: offlineMutate, isLoading: offlinePaymentLoading } =
        useOfflinePayment()
    const [offlineCheck, setOfflineCheck] = useState(false)
    const { offLineWithPartial, offlinePaymentInfo } = useSelector(
        (state) => state.offlinePayment
    )
    const { data: tripsData } = useGetMostTrips()

    const { data, refetch: refetchNotification } =
        useGetOrderPlaceNotification(orderId)

    useEffect(() => {
        if (data) {
            dispatch(setIsNeedLoad(data?.reload_home))
        }
    }, [data])
    const { data: offlinePaymentOptions, refetch: OfflinePaymentRefetch } =
        useGetOfflinePaymentOptions({})

    useEffect(() => {
        OfflinePaymentRefetch()
    }, [])
    const { token } = useSelector((state) => state.userToken)
    const { guestUserInfo } = useSelector((state) => state.guestUserInfo)
    const [subscriptionStates, subscriptionDispatch] = useReducer(
        subscriptionReducer,
        subscriptionsInitialState
    )

    //additional information
    const [additionalInformationStates, additionalInformationDispatch] =
        useReducer(
            additionalInformationReducer,
            additionalInformationInitialState
        )

    const text1 = t('You can not Order more then')
    const text2 = t('on COD order')
    const { page } = router.query
    let currencySymbol
    let currencySymbolDirection
    let digitAfterDecimalPoint

    if (global) {
        currencySymbol = global.currency_symbol
        currencySymbolDirection = global.currency_symbol_direction
        digitAfterDecimalPoint = global.digit_after_decimal_point
    }

    currentLatLng = JSON.parse(window.localStorage.getItem('currentLatLng'))
    const { data: zoneData } = useQuery(
        ['zoneId', location],
        async () => GoogleApi.getZoneId(currentLatLng),
        {
            retry: 1,
        }
    )
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (zoneData) {
                dispatch(setZoneData(zoneData?.data?.zone_data))
                localStorage.setItem('zoneid', zoneData?.data?.zone_id)
            }
        }
    }, [zoneData])
    const { data: restaurantData, refetch } = useQuery(
        [`restaurant-details`],
        () =>
            RestaurantsApi.restaurantDetails(
                page === 'campaign'
                    ? campFoodList?.[0]?.restaurant_id
                    : cartList[0].restaurant_id
            ),
        { enabled: false, onError: onErrorResponse }
    )

    const {
        data: distanceData,
        refetch: refetchDistance,
        isLoading: distanceLoading,
    } = useQuery(
        ['get-distance', restaurantData?.data, address],
        () => GoogleApi.distanceApi(restaurantData?.data, address),
        {
            onError: onErrorResponse,
        }
    )
    const tempDistance =
        distanceData?.data?.rows?.[0]?.elements[0]?.distance?.value / 1000

    const { data: extraCharge, refetch: extraChargeRefetch } =
        useGetVehicleCharge({ tempDistance })
    useEffect(() => {
        extraChargeRefetch()
    }, [distanceData])
    const handleChange = (event) => {
        setDayNumber(event.target.value)
    }
    const { mutate: orderMutation, isLoading: orderLoading } = useMutation(
        'order-place',
        OrderApi.placeOrder
    )
    const userOnSuccessHandler = (res) => {
        dispatch(setUser(res?.data))
        dispatch(setWalletAmount(res?.data?.wallet_balance))
    }
    const { isLoading: customerLoading, data: customerData } = useQuery(
        ['profile-info'],
        ProfileApi.profileInfo,
        {
            onSuccess: userOnSuccessHandler,
            onError: onSingleErrorResponse,
        }
    )
    useEffect(() => {
        orderId && refetchNotification()
    }, [orderId])

    useEffect(async () => {
        currentLatLng = JSON.parse(localStorage.getItem('currentLatLng'))
        const location = localStorage.getItem('location')
        setAddress({
            ...currentLatLng,
            latitude: currentLatLng?.lat,
            longitude: currentLatLng?.lng,
            address: location,
            address_type: 'Selected Address',
        })
        await refetch()
    }, [])

    useEffect(() => {
        restaurantData && address && refetchDistance()
    }, [restaurantData])
    useEffect(() => {
        if (
            isDineIn === 'dine_in' &&
            restaurantData?.data?.is_dine_in_active &&
            global?.dine_in_order_option
        ) {
            setOrderType('dine_in')
        } else if (
            restaurantData?.data?.delivery &&
            global?.home_delivery &&
            restaurantData?.data?.take_away &&
            global?.take_away
        ) {
            setOrderType('delivery')
        } else if (restaurantData?.data?.take_away && global?.take_away) {
            setOrderType('take_away')
        } else if (restaurantData?.data?.delivery && global?.home_delivery) {
            setOrderType('delivery')
        }
    }, [restaurantData, global])
    useEffect(() => {
        const taxAmount = getTaxableTotalPrice(
            cartList,
            couponDiscount,
            restaurantData?.data?.tax,
            restaurantData?.data
        )

        setTaxAmount(taxAmount)
    }, [cartList, couponDiscount, restaurantData])
    useEffect(() => {
        const total_order_amount = getFinalTotalPrice(
            cartList,
            couponDiscount,
            taxAmount,
            restaurantData
        )
        setTotalOrderAmount(total_order_amount)
    }, [cartList, couponDiscount, taxAmount])

    const handleOfflineOrder = () => {
        const offlinePaymentData = {
            ...offlinePaymentInfo,
            order_id: orderId,
        }
        dispatch(setOfflineInfoStep(3))
        dispatch(setOrderDetailsModal(true))
        offlineMutate(offlinePaymentData)
        // setOrderId(orderId)
    }

    //orderId
    //offlinePaymentInfo
    useEffect(() => {
        if (offlineCheck) {
            handleOfflineOrder()
        }
    }, [orderId])

    const handleProductList = (productList, totalQty) => {
        return productList?.map((cart) => {
            return {
                add_on_ids: cart?.selectedAddons?.map((add) => {
                    return add.id
                }),
                add_on_qtys: cart?.selectedAddons?.map((add) => {
                    totalQty = add.quantity
                    return totalQty
                }),
                add_ons: cart?.selectedAddons?.map((add) => {
                    return {
                        id: add.id,
                        name: add.name,
                        price: add.price,
                    }
                }),
                item_type: cart?.available_date_starts
                    ? 'AppModelsItemCampaign'
                    : 'AppModelsItem',
                item_id: cart?.id,
                item_campaign_id: cart?.available_date_starts ? cart?.id : null,

                price: cart?.price,
                quantity: cart?.quantity,
                variant: getVariation(cart?.variation),
                //new variation form needs to added here
                variations: cart?.variations?.map((variation) => {
                    return {
                        name: variation.name,
                        values: {
                            label: handleValuesFromCartItems(variation.values),
                        },
                    }
                }),
            }
        })
    }

    const handleOrderMutationObject = (carts, productList) => {
        const subscriptionOrderCount = getSubscriptionOrderCount(
            restaurantData?.data?.schedules,
            subscriptionStates.type,
            subscriptionStates.startDate,
            subscriptionStates.endDate,
            subscriptionStates.days
        )
        const isDigital =
            paymenMethod !== 'cash_on_delivery' &&
            paymenMethod !== 'wallet' &&
            paymenMethod !== 'offline_payment' &&
            paymenMethod !== ''
                ? 'digital_payment'
                : paymenMethod

        return {
            cart: carts,
            ...address,
            schedule_at: scheduleAt === 'now' ? null : scheduleAt,
            //additional address
            address_type: !getToken()
                ? guestUserInfo?.address_type
                : additionalInformationStates?.addressType,
            road: !getToken()
                ? guestUserInfo?.road
                : additionalInformationStates?.streetNumber,
            house: !getToken()
                ? guestUserInfo?.house
                : additionalInformationStates?.houseNumber,
            floor: !getToken()
                ? guestUserInfo?.floor
                : additionalInformationStates?.floor,
            order_note: additionalInformationStates?.note,
            partial_payment: usePartialPayment,
            payment_method: isDigital,
            order_type: orderType,
            restaurant_id: restaurantData?.data?.id,
            coupon_code: couponDiscount?.code,
            coupon_discount_amount: couponDiscount?.discount,
            coupon_discount_title: couponDiscount?.title,
            discount_amount: getProductDiscount(productList),
            distance: handleDistance(
                distanceData?.data?.rows?.[0]?.elements,
                restaurantData?.data,
                address
            ),
            order_amount: totalAmount,
            dm_tips: deliveryTip,
            subscription_order: subscriptionStates.order,
            subscription_type: subscriptionStates.type,
            subscription_days: JSON.stringify(subscriptionStates.days),
            subscription_start_at: subscriptionStates.startDate,
            subscription_end_at: subscriptionStates.endDate,
            subscription_quantity: subscriptionOrderCount,
            cutlery: cutlery,
            guest_id: getGuestId(),
            contact_person_name:
                additionalInformationStates?.dine_in_contact?.name ||
                guestUserInfo?.contact_person_name,
            contact_person_number: additionalInformationStates?.dine_in_contact
                ?.phone
                ? formatPhoneNumber(
                      additionalInformationStates?.dine_in_contact?.phone
                  )
                : formatPhoneNumber(guestUserInfo?.contact_person_number),
            is_guest: token ? 0 : 1,
            is_buy_now: page === 'campaign' ? 1 : 0,
            cart_id: page === 'campaign' ? cartList[0]?.cartItemId : null,
            unavailable_item_note,
            delivery_instruction,
            extra_packaging_amount: extraPackagingCharge,
            contact_person_email:
                additionalInformationStates?.dine_in_contact?.email,
        }
    }

    const orderPlaceMutation = (
        carts,
        handleSuccess,
        orderMutation,
        productList
    ) => {
        let order = handleOrderMutationObject(carts, productList)
        orderMutation(order, {
            onSuccess: handleSuccess,
            onError: (error) => {
                error?.response?.data?.errors?.forEach((item) =>
                    toast.error(item.message, {
                        position: 'bottom-right',
                    })
                )
            },
        })
    }

    const handlePlaceOrder = () => {
        let isAvailable =
            page === 'campaign'
                ? true
                : isFoodAvailableBySchedule(cartList, scheduleAt)
        if (isAvailable) {
            //const walletBalance = localStorage.getItem('wallet_amount')
            let productList = page === 'campaign' ? campFoodList : cartList
            if (paymenMethod === 'wallet') {
                if (Number(walletAmount) < Number(totalAmount)) {
                    toast.error(t('Wallet balance is below total amount.'), {
                        id: 'wallet',
                        position: 'bottom-right',
                    })
                } else {
                    let totalQty = 0
                    let carts = handleProductList(productList, totalQty)
                    const handleSuccessSecond = (response) => {
                        setOrderId(response?.data?.order_id)
                        if (response?.data) {
                            if (paymenMethod === 'digital_payment') {
                                toast.success(response?.data?.message)
                                const newBaseUrl = baseUrl.substring(0, 31)
                                const callBackUrl = `${window.location.origin}/order`
                                const url = `${
                                    window.location.origin
                                }/payment-mobile?order_id=${
                                    response?.data?.order_id
                                }&customer_id=${
                                    customerData?.data?.id
                                        ? customerData?.data?.id
                                        : getGuestId()
                                }&callback=${callBackUrl}`
                            } else if (paymenMethod === 'wallet') {
                                toast.success(response?.data?.message)
                                setOrderSuccess(true)
                            } else {
                                if (response.status === 203) {
                                    toast.error(response.data.errors[0].message)
                                }
                            }
                        }
                    }
                    if (carts?.length > 0) {
                        orderPlaceMutation(
                            carts,
                            handleSuccessSecond,
                            orderMutation,
                            productList
                        )
                    }
                }
            } else if (paymenMethod === 'cash_on_delivery') {
                const totalMaxCodAmount = maxCodAmount(
                    restaurantData,
                    global,
                    zoneData
                )

                const totalAmountOrSubTotalAmount =
                    subscriptionStates?.order === '1'
                        ? subscriptionSubTotal
                        : totalAmount

                if (
                    totalMaxCodAmount !== 0 &&
                    Number.parseInt(totalAmountOrSubTotalAmount) >
                        Number.parseInt(totalMaxCodAmount)
                ) {
                    toast.error(
                        `${text1} ${getAmount(
                            totalMaxCodAmount,
                            currencySymbolDirection,
                            currencySymbol,
                            digitAfterDecimalPoint
                        )}  ${text2}`
                    )
                } else {
                    const handleSuccessCod = (response) => {
                        setOrderId(response?.data?.order_id)
                        toast.success(response?.data?.message)
                        setOrderSuccess(true)
                    }
                    let totalQty = 0
                    let carts = handleProductList(productList, totalQty)
                    if (carts?.length > 0) {
                        orderPlaceMutation(
                            carts,
                            handleSuccessCod,
                            orderMutation,
                            productList
                        )
                    }
                }
            } else if (paymenMethod === 'offline_payment') {
                let totalQty = 0
                let carts = handleProductList(productList, totalQty)
                const handleSuccessOffline = (response) => {
                    if (response?.data) {
                        toast.success(response?.data?.message)
                        setOfflineCheck(true)
                        setOrderId(response?.data?.order_id)
                        setOrderSuccess(true)
                    }
                }
                if (carts?.length > 0) {
                    orderPlaceMutation(
                        carts,
                        handleSuccessOffline,
                        orderMutation,
                        productList
                    )
                }
            } else {
                let totalQty = 0
                let carts = handleProductList(productList, totalQty)
                const handleSuccess = (response) => {
                    const payment_platform = 'web'
                    const page = 'order'
                    setOrderId(response?.data?.order_id)
                    if (response?.data) {
                        if (paymenMethod !== 'cash_on_delivery') {
                            const callBackUrl = token
                                ? // ? `${window.location.origin}/order-history/${response?.data?.order_id}`
                                  `${window.location.origin}/info?page=${page}`
                                : `${window.location.origin}/order`
                            const url = `${baseUrl}/payment-mobile?order_id=${
                                response?.data?.order_id
                            }&customer_id=${
                                customerData?.data?.id
                                    ? customerData?.data?.id
                                    : getGuestId()
                            }&payment_platform=${payment_platform}&callback=${callBackUrl}&payment_method=${paymenMethod}`
                            Router.push(url)
                        } else {
                            toast.success(response?.data?.message)
                            setOrderSuccess(true)
                        }
                    }
                }
                if (carts?.length > 0) {
                    orderPlaceMutation(
                        carts,
                        handleSuccess,
                        orderMutation,
                        productList
                    )
                }
            }
        } else {
            toast.error(
                t(
                    'One or more item is not available for the chosen preferable schedule time.'
                )
            )
        }
    }
    const placeOrder = () => {
        localStorage.setItem('access', totalAmount)
        if (page !== 'campaign') {
            if (subscriptionStates.order === '1') {
                const subscriptionOrderCount = getSubscriptionOrderCount(
                    restaurantData?.data?.schedules,
                    subscriptionStates.type,
                    subscriptionStates.startDate,
                    subscriptionStates.endDate,
                    subscriptionStates.days
                )

                if (subscriptionStates.type === '') {
                    toast(t('You must choose a subscription type'), {
                        duration: 4000,
                        icon: '⚠️',
                        style: {
                            textTransform: 'none',
                        },
                    })
                } else {
                    if (subscriptionStates.type !== 'daily') {
                        let startDate = moment(
                            subscriptionStates.startDate
                        ).format('D')
                        let endDate = moment(subscriptionStates.endDate).format(
                            'D'
                        )
                        let dateEnd = moment(
                            subscriptionStates.endDate,
                            'YYYY/MM/DD HH:mm'
                        )
                        const dayNumberOfWeekEnd = dateEnd.day()
                        let dateStart = moment(
                            subscriptionStates.startDate,
                            'YYYY/MM/DD HH:mm'
                        )
                        const dayNumberOfWeekStart = dateStart.day()
                        let totalNumbers = endDate - startDate + 1
                        let finalEndDay = dayNumberOfWeekEnd + totalNumbers

                        if (subscriptionStates.days.length > 0) {
                            const isInsideChoseDate =
                                subscriptionStates.days.every(
                                    (item) =>
                                        item.day >= dayNumberOfWeekStart &&
                                        item.day <= finalEndDay
                                )
                            if (isInsideChoseDate) {
                                if (subscriptionOrderCount > 0) {
                                    handlePlaceOrder()
                                } else {
                                    toast(
                                        t(
                                            `Your chosen delivery ${
                                                subscriptionStates?.days
                                                    ?.length > 1
                                                    ? 'days'
                                                    : 'day'
                                            } and ${
                                                subscriptionStates?.days
                                                    ?.length > 1
                                                    ? 'times'
                                                    : 'time'
                                            } must be in between start date and end date`
                                        ),
                                        {
                                            duration: 5000,
                                            icon: '⚠️',
                                            style: {
                                                textTransform: 'none',
                                            },
                                        }
                                    )
                                }
                            } else {
                                toast(
                                    t(
                                        `Your chosen delivery ${
                                            subscriptionStates?.days?.length > 1
                                                ? 'days'
                                                : 'day'
                                        } and ${
                                            subscriptionStates?.days?.length > 1
                                                ? 'times'
                                                : 'time'
                                        } must be in between start date and end date`
                                    ),
                                    {
                                        duration: 5000,
                                        icon: '⚠️',
                                        style: {
                                            textTransform: 'none',
                                        },
                                    }
                                )
                            }
                        }
                        if (subscriptionStates.days.length === 0) {
                            toast(
                                t('You must choose delivery days and times'),
                                {
                                    duration: 5000,
                                    icon: '⚠️',
                                    style: {
                                        textTransform: 'none',
                                    },
                                }
                            )
                        }
                    }
                }
                if (subscriptionStates.type === 'monthly') {
                    let startDate = moment(subscriptionStates.startDate).format(
                        'D'
                    )
                    let endDate = moment(subscriptionStates.endDate).format('D')
                    if (subscriptionStates.days.length > 0) {
                        const isInsideChoseDate = subscriptionStates.days.every(
                            (item) =>
                                item.day >= startDate && item.day <= endDate
                        )

                        if (isInsideChoseDate) {
                            if (subscriptionOrderCount > 0) {
                                handlePlaceOrder()
                            }
                        } else {
                            toast(
                                t(
                                    `Your chosen delivery ${
                                        subscriptionStates?.days?.length > 1
                                            ? 'days'
                                            : 'day'
                                    } and ${
                                        subscriptionStates?.days?.length > 1
                                            ? 'times'
                                            : 'time'
                                    } must be in between start date and end date`
                                ),
                                {
                                    duration: 5000,
                                    icon: '⚠️',
                                    style: {
                                        textTransform: 'none',
                                    },
                                }
                            )
                        }
                    }
                }
                if (subscriptionStates.endDate === '') {
                    toast(t('You must pick an end date'), {
                        duration: 4000,
                        icon: '⚠️',
                        style: {
                            textTransform: 'none',
                        },
                    })
                }
                if (subscriptionStates.startDate === '') {
                    toast(t('You must pick a start date'), {
                        duration: 4000,
                        icon: '⚠️',
                        style: {
                            textTransform: 'none',
                        },
                    })
                }
                if (
                    subscriptionStates.type !== 'monthly' &&
                    subscriptionStates.type !== 'weekly' &&
                    subscriptionOrderCount > 0
                ) {
                    handlePlaceOrder()
                }
            } else {
                handlePlaceOrder()
            }
        } else {
            handlePlaceOrder()
        }
    }
    const counponRemove = () => {}
    if (orderSuccess) {
        if (token) {
            router.push(
                {
                    pathname: '/info',
                    query: { page: 'order', orderId: orderId },
                },
                undefined,
                { shallow: true }
            )
        } else {
            router.push(
                {
                    pathname: '/order',
                    query: { orderId: orderId },
                },
                undefined,
                { shallow: true }
            )
        }
    }

    const handleBadWeatherUi = (zoneData) => {
        const currentZoneInfo = zoneData?.find(
            (item) => item.id === restaurantData?.data?.zone_id
        )
        if (currentZoneInfo) {
            if (
                Number.parseInt(
                    currentZoneInfo?.increased_delivery_fee_status
                ) === 1
            ) {
                return (
                    <>
                        {currentZoneInfo?.increase_delivery_charge_message && (
                            <CustomStackFullWidth
                                alignItems="center"
                                justifyContent="flex-start"
                                gap="10px"
                                direction="row"
                                sx={{
                                    backgroundColor: (theme) =>
                                        alpha(theme.palette.primary.main, 0.3),
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                }}
                            >
                                <CustomImageContainer
                                    height="40px"
                                    width="40px"
                                    src={thunderstorm.src}
                                    objectFit="contained"
                                />

                                <Typography>
                                    {
                                        currentZoneInfo?.increase_delivery_charge_message
                                    }
                                </Typography>
                            </CustomStackFullWidth>
                        )}
                    </>
                )
            }
        }
    }

    const handleCutlery = (status) => {
        if (status) {
            setCutlery(1)
        } else {
            setCutlery(0)
        }
    }
    const handleItemUnavailableNote = (value) => {
        setUnavailable_item_note(value)
    }
    const handleDeliveryInstructionNote = (value) => {
        setDelivery_instruction(value)
    }
    const handlePartialPayment = () => {
        if (totalAmount > walletAmount) {
            setUsePartialPayment(true)
            dispatch(setOfflineWithPartials(true))
            setSelected({ name: '', image: null })
        } else {
            setSelected({ name: 'wallet', image: wallet })
            setPaymentMethodDetails({ name: 'wallet', image: wallet })
            setPaymenMethod('wallet')
            setSwitchToWallet(true)
        }
    }

    const removePartialPayment = () => {
        if (totalAmount > walletAmount) {
            setUsePartialPayment(false)
            dispatch(setOfflineWithPartials(false))
            setPaymentMethodDetails(null)
            setSwitchToWallet(false)
        } else {
            setPaymentMethodDetails(null)
            setSwitchToWallet(false)
        }
    }
    const handlePartialPaymentCheck = () => {
        if (subscriptionStates?.order !== '1') {
            if (global?.partial_payment_status === 1) {
                if (couponDiscount && usePartialPayment && offLineWithPartial) {
                    if (
                        totalAmount > walletAmount &&
                        !usePartialPayment &&
                        !offLineWithPartial
                    ) {
                        setOpenPartialModel(true)
                    } else {
                        if (
                            usePartialPayment &&
                            walletAmount > totalAmount &&
                            offLineWithPartial
                        ) {
                            setOpenModal(true)
                        }
                    }
                } else if (
                    (deliveryTip > 0 &&
                        usePartialPayment &&
                        offLineWithPartial) ||
                    switchToWallet
                ) {
                    if (totalAmount > walletAmount && !usePartialPayment) {
                        setOpenPartialModel(true)
                    } else {
                        if (
                            offLineWithPartial &&
                            usePartialPayment &&
                            walletAmount > totalAmount
                        ) {
                            setOpenModal(true)
                        }
                    }
                } else if (
                    orderType &&
                    usePartialPayment &&
                    offLineWithPartial
                ) {
                    if (
                        totalAmount > walletAmount &&
                        !usePartialPayment &&
                        !offLineWithPartial
                    ) {
                        setOpenPartialModel(true)
                    } else {
                        if (
                            offLineWithPartial &&
                            usePartialPayment &&
                            walletAmount > totalAmount
                        ) {
                            setOpenModal(true)
                        }
                    }
                }
            }
        }
    }
    useEffect(() => {
        handlePartialPaymentCheck()
    }, [totalAmount])

    const agreeToPartial = () => {
        setPaymentMethodDetails(null)
        setSelected({ name: '', image: '' })
        setUsePartialPayment(true)
        dispatch(setOfflineWithPartials(true))
        setOpenPartialModel(false)
        setSwitchToWallet(false)
    }
    const notAgreeToPartial = () => {
        setUsePartialPayment(false)
        dispatch(setOfflineWithPartials(false))
        setOpenPartialModel(false)
        setSwitchToWallet(false)
    }
    const agreeToWallet = () => {
        setSelected({ name: 'wallet', image: wallet })
        setPaymentMethodDetails({ name: 'wallet', image: wallet })
        setPaymenMethod('wallet')
        setSwitchToWallet(true)
        setUsePartialPayment(false)
        dispatch(setOfflineWithPartials(false))
        setOpenModal(false)
    }
    const notAgreeToWallet = () => {
        setPaymentMethodDetails(null)
        setSwitchToWallet(false)
        setUsePartialPayment(false)
        dispatch(setOfflineWithPartials(false))
        setOpenModal(false)
    }

    const handleCashbackAmount = (data) => {
        setCashbackAmount(data)
    }
    const { refetch: refetchCashbackAmount } = useGetCashBackAmount({
        amount: totalAmount,
        handleSuccess: handleCashbackAmount,
    })
    useEffect(() => {
        refetchCashbackAmount()
    }, [totalAmount])

    useEffect(() => {
        if (
            global?.extra_packaging_charge &&
            restaurantData?.data?.extra_packaging_status
        ) {
            setExtraPackagingCharge(
                restaurantData?.data?.extra_packaging_amount
            )
        }
    }, [restaurantData, global])

    const handleExtraPackaging = (e) => {
        setIsExtraPackaging(e.target.checked)
        if (e.target.checked) {
            setExtraPackagingCharge(
                restaurantData?.data?.extra_packaging_amount
            )
        } else {
            setExtraPackagingCharge(0)
        }
    }

    const hasOnlyPaymentMethod = () => {
        if (
            !global?.cash_on_delivery &&
            global?.customer_wallet_status !== 1 &&
            global?.offline_payment_status !== 1 &&
            global?.digital_payment &&
            global?.active_payment_method_list?.length === 1
        ) {
            setPaymenMethod('digital_payment')
            setSelected({
                name: global?.active_payment_method_list[0]?.gateway,
            })
            setPaymentMethodDetails({
                name: global?.active_payment_method_list[0]?.gateway,
                image: global?.active_payment_method_list[0]
                    ?.gateway_image_full_url,
            })
        }
    }

    useEffect(() => {
        hasOnlyPaymentMethod()
    }, [global])

    return (
        <Grid
            container
            spacing={3}
            mb="2rem"
            paddingTop={{ xs: '0px', md: '60px' }}
            sx={{ minHeight: '50vh' }}
        >
            <Grid item xs={12} md={7}>
                {method !== 'offline' ? (
                    <Stack spacing={3}>
                        <DeliveryDetails
                            token={token}
                            global={global}
                            restaurantData={restaurantData}
                            setOrderType={setOrderType}
                            orderType={orderType}
                            setAddress={setAddress}
                            address={address}
                            subscriptionStates={subscriptionStates}
                            subscriptionDispatch={subscriptionDispatch}
                            page={page}
                            setPaymenMethod={setPaymenMethod}
                            additionalInformationStates={
                                additionalInformationStates
                            }
                            additionalInformationDispatch={
                                additionalInformationDispatch
                            }
                            setDeliveryTip={setDeliveryTip}
                            setPaymentMethodDetails={setPaymentMethodDetails}
                            setUsePartialPayment={setUsePartialPayment}
                            setSwitchToWallet={setSwitchToWallet}
                        />
                        {orderType === 'dine_in' && (
                            <CustomPaperBigCard padding=".5rem">
                                <CustomStackFullWidth>
                                    <GuestUserInforForm
                                        key={orderType}
                                        dine_in
                                        additionalInformationDispatch={
                                            additionalInformationDispatch
                                        }
                                        configData={global}
                                        customerData={customerData}
                                    />
                                </CustomStackFullWidth>
                            </CustomPaperBigCard>
                        )}
                        {page !== 'campaign' &&
                            subscriptionStates.order === '0' &&
                            token &&
                            orderType !== 'dine_in' && (
                                <RestaurantScheduleTime
                                    restaurantData={restaurantData}
                                    handleChange={handleChange}
                                    today={today}
                                    tomorrow={tomorrow}
                                    numberOfDay={numberOfDay}
                                    global={global}
                                    setScheduleAt={setScheduleAt}
                                />
                            )}

                        {orderType === 'dine_in' && (
                            <DineInPreferableTime
                                restaurantData={restaurantData}
                                handleChange={handleChange}
                                today={today}
                                tomorrow={tomorrow}
                                numberOfDay={numberOfDay}
                                global={global}
                                setScheduleAt={setScheduleAt}
                            />
                        )}
                        {subscriptionStates.order === '0' &&
                            orderType !== 'dine_in' &&
                            orderType !== 'take_away' &&
                            Number.parseInt(global?.dm_tips_status) === 1 && (
                                <DeliveryManTips
                                    deliveryTip={deliveryTip}
                                    setDeliveryTip={setDeliveryTip}
                                    tripsData={tripsData}
                                />
                            )}
                        {subscriptionStates.order !== '1' &&
                            global?.customer_wallet_status === 1 &&
                            walletAmount > 0 &&
                            global?.partial_payment_status === 1 && (
                                <PartialPayment
                                    offLineWithPartial={offLineWithPartial}
                                    global={global}
                                    remainingBalance={
                                        walletAmount - totalAmount
                                    }
                                    handlePartialPayment={handlePartialPayment}
                                    usePartialPayment={usePartialPayment}
                                    walletBalance={walletAmount}
                                    paymentMethod={paymenMethod}
                                    switchToWallet={switchToWallet}
                                    removePartialPayment={removePartialPayment}
                                    totalAmount={totalAmount}
                                />
                            )}
                        <PaymentOptions
                            global={global}
                            paymenMethod={paymenMethod}
                            setPaymenMethod={setPaymenMethod}
                            subscriptionStates={subscriptionStates}
                            usePartialPayment={usePartialPayment}
                            setSelected={setSelected}
                            selected={selected}
                            paymentMethodDetails={paymentMethodDetails}
                            setPaymentMethodDetails={setPaymentMethodDetails}
                            setSwitchToWallet={setSwitchToWallet}
                            offlinePaymentOptions={offlinePaymentOptions}
                        />
                    </Stack>
                ) : (
                    <OfflinePaymentForm
                        key={method}
                        offlinePaymentOptions={offlinePaymentOptions}
                        paymenMethod={paymenMethod}
                        setPaymenMethod={setPaymenMethod}
                        // handleSubmitOfflineForm={handleSubmitOfflineForm}
                        totalAmount={totalAmount}
                        currencySymbolDirection={currencySymbolDirection}
                        currencySymbol={currencySymbol}
                        digitAfterDecimalPoint={digitAfterDecimalPoint}
                        walletBalance={walletAmount}
                        usePartialPayment={usePartialPayment}
                        offlineFormRef={offlineFormRef}
                        placeOrder={placeOrder}
                    />
                )}
            </Grid>

            <Grid item xs={12} md={5} height="auto">
                <CustomPaperBigCard height="auto">
                    <Stack spacing={2} justifyContent="space-between">
                        <OrderSummary variant="h4">
                            {t('Order Summary')}
                        </OrderSummary>
                        {zoneData &&
                            orderType !== 'dine_in' &&
                            orderType !== 'take_away' &&
                            handleBadWeatherUi(zoneData?.data?.zone_data)}
                        <SimpleBar
                            style={{ maxHeight: '500px', width: '100%' }}
                        >
                            <OrderSummaryDetails
                                type={type}
                                page={page}
                                global={global}
                                orderType={orderType}
                            />
                        </SimpleBar>
                        <Stack>
                            {restaurantData?.data?.cutlery &&
                                orderType === 'delivery' && (
                                    <Box mb={1}>
                                        <Cutlery
                                            isChecked={cutlery}
                                            handleChange={handleCutlery}
                                        />
                                    </Box>
                                )}
                            {orderType === 'delivery' && (
                                <Box mb={1}>
                                    <ItemSelectWithChip
                                        title="If Any product is not available"
                                        data={productUnavailableData}
                                        handleChange={handleItemUnavailableNote}
                                    />
                                </Box>
                            )}
                            {orderType === 'delivery' && (
                                <Box mb={1}>
                                    <ItemSelectWithChip
                                        title="Add More Delivery Instruction"
                                        data={deliveryInstructions}
                                        handleChange={
                                            handleDeliveryInstructionNote
                                        }
                                    />
                                </Box>
                            )}

                            {restaurantData?.data?.is_extra_packaging_active &&
                            global?.extra_packaging_charge
                                ? !restaurantData?.data
                                      ?.extra_packaging_status &&
                                  restaurantData?.data
                                      ?.extra_packaging_amount != null &&
                                  restaurantData?.data?.extra_packaging_amount >
                                      0 &&
                                  orderType !== 'dine_in' && (
                                      <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="center"
                                          boxShadow={theme.shadows2[0]}
                                          borderRadius="8px"
                                          minHeight="50px"
                                          py={0.5}
                                          px={2}
                                      >
                                          <FormControlLabel
                                              onChange={(e) =>
                                                  handleExtraPackaging(e)
                                              }
                                              control={<Checkbox />}
                                              label={
                                                  <Typography
                                                      fontWeight="700"
                                                      fontSize="14px"
                                                      color={
                                                          theme.palette.primary
                                                              .main
                                                      }
                                                  >
                                                      {t(
                                                          'Need Extra Packaging'
                                                      )}
                                                  </Typography>
                                              }
                                          />
                                          <Typography
                                              component="span"
                                              m="0"
                                              fontWeight="700"
                                              fontSize="14px"
                                              mt="6px"
                                          >
                                              {getAmount(
                                                  restaurantData.data
                                                      .extra_packaging_amount,
                                                  currencySymbolDirection,
                                                  currencySymbol,
                                                  digitAfterDecimalPoint
                                              )}
                                          </Typography>
                                      </Stack>
                                  )
                                : null}
                        </Stack>

                        <OrderCalculation
                            subscriptionStates={subscriptionStates}
                            cartList={
                                page === 'campaign' ? campFoodList : cartList
                            }
                            restaurantData={restaurantData}
                            couponDiscount={couponDiscount}
                            taxAmount={taxAmount}
                            distanceData={distanceData}
                            total_order_amount={total_order_amount}
                            global={global}
                            couponInfo={couponInfo}
                            orderType={orderType}
                            deliveryTip={deliveryTip}
                            origin={restaurantData?.data}
                            destination={address}
                            extraCharge={extraCharge}
                            additionalCharge={global?.additional_charge}
                            totalAmount={totalAmount}
                            walletBalance={walletAmount}
                            usePartialPayment={usePartialPayment}
                            placeOrder={placeOrder}
                            orderLoading={orderLoading}
                            offlinePaymentLoading={offlinePaymentLoading}
                            setCouponDiscount={setCouponDiscount}
                            counponRemove={counponRemove}
                            offlineFormRef={offlineFormRef}
                            setOfflineCheck={setOfflineCheck}
                            page={page}
                            paymentMethodDetails={paymentMethodDetails}
                            cashbackAmount={cashbackAmount}
                            extraPackagingCharge={extraPackagingCharge}
                            distanceLoading={distanceLoading}
                        />
                    </Stack>
                </CustomPaperBigCard>
            </Grid>

            {openModal && (
                <CustomModal
                    openModal={openModal}
                    bgColor={theme.palette.customColor.ten}
                    //handleClose={() => setOpenModal(false)}
                >
                    <PartialPaymentModal
                        global={global}
                        payableAmount={totalAmount}
                        agree={agreeToWallet}
                        reject={notAgreeToWallet}
                        colorTitle=" Want to pay via your wallet ? "
                        title="You can pay the full amount with your wallet."
                        remainingBalance={walletAmount - totalAmount}
                    />
                </CustomModal>
            )}
            {openPartialModel && (
                <CustomModal
                    openModal={openPartialModel}
                    bgColor={theme.palette.customColor.ten}
                >
                    <PartialPaymentModal
                        global={global}
                        payableAmount={totalAmount}
                        agree={agreeToPartial}
                        reject={notAgreeToPartial}
                        colorTitle=" Want to pay partially with wallet ? "
                        title="You do not have sufficient balance to pay full amount via wallet."
                    />
                </CustomModal>
            )}
        </Grid>
    )
}

export default CheckoutPage

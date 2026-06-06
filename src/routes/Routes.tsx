import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// All layouts containers
import DefaultLayout from '../Layouts/Default'
import VerticalLayout from '../Layouts/Vertical'
import HorizontalLayout from '../Layouts/Horizontal'

import { authProtectedFlattenRoutes, publicProtectedFlattenRoutes } from './index'
import { ThemeSettings, useAuthContext, useThemeContext } from '../common/context'

interface IRoutesProps {}

const ThemeRoutes = (props: IRoutesProps) => {
  const { settings } = useThemeContext()

  const Layout =
    settings.layout.type === ThemeSettings.layout.type.vertical ? VerticalLayout : HorizontalLayout
  const { isAuthenticated } = useAuthContext()

  // Combined full‑screen routes (existing + new hotel routes)
  const fullScreenRoutes = [
    '/apps/Tableview',
    '/apps/Billview',
    '/hotel-master/HotelBookingPanel',
    '/hotel/reservation',
    '/hotel/checkin',
    '/hotel/room-detail',
    '/hotel/amendments',
    '/hotel/reservation-summary',
    '/hotel/report',
  ]

  return (
    <React.Fragment>
      <Routes>
        <Route>
          {publicProtectedFlattenRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={<DefaultLayout {...props}>{route.element}</DefaultLayout>}
              key={idx}
            />
          ))}
        </Route>

        <Route>
          {authProtectedFlattenRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                isAuthenticated === false ? (
                  <Navigate
                    to={{
                      pathname: '/auth/minimal/login',
                      search: 'next=' + route.path,
                    }}
                  />
                ) : route.path && fullScreenRoutes.includes(route.path) ? (
                  route.element
                ) : (
                  <Layout {...props}>{route.element}</Layout>
                )
              }
              key={idx}
            />
          ))}
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </React.Fragment>
  )
}

export default ThemeRoutes
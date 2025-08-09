import React from 'react'
import { Route, Navigate } from 'react-router-dom'
import { useAuthContext } from '@/common'

/**
 * PrivateRoute component to protect routes based on authentication and roles
 * @param {object} props
 * @param {React.Component} props.component - Component to render
 * @param {string[]} [props.roles] - Allowed roles for the route
 * @param {...any} rest - Other props
 */
const PrivateRoute = ({ component: Component, roles, ...rest }: any) => {
  const { isAuthenticated, user } = useAuthContext()

  return (
    <Route
      {...rest}
      render={(props: any) => {
        if (!isAuthenticated) {
          // Not logged in, redirect to login
          return (
            <Navigate
              to={{
                pathname: '/auth/minimal/login',
                state: { from: props.location },
              }}
            />
          )
        }

        // If roles are specified, check if user role is allowed
        if (roles && roles.length > 0 && !roles.includes(user?.role_level)) {
          // Role not authorized, redirect to access denied page
          return <Navigate to={{ pathname: '/access-denied' }} />
        }

        // Authorized, render the component
        return <Component {...props} />
      }}
    />
  )
}

export default PrivateRoute

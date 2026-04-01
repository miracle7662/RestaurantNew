import { ReactNode } from 'react'
import { Helmet } from 'react-helmet'

interface PageTitleProps {
  subName?: string
  title: string
  addedChild?: ReactNode
}
const TitleHelmet = ({ title }: PageTitleProps) => {
  return (
    <>
      <Helmet>
        <title>{title} |  Miracle POS </title>
      </Helmet>
    </>
  )
}

export default TitleHelmet

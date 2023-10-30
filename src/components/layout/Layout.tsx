'use client'

import store from "@/store"
import { FC, ReactNode } from "react"
import { Provider } from "react-redux"
import MainCanva from "../MainCanva"

const Layout: FC<{
  children: ReactNode
}> = ({children}) => {
  return <Provider store={store}>
    <main className="flex h-screen min-w-[100dvw]">
      {children}
      <MainCanva />
    </main>
  </Provider>
}

export default Layout;
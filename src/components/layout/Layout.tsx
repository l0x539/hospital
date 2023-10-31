'use client'

import store from "@/store"
import { FC, ReactNode } from "react"
import { Provider } from "react-redux"
import MainCanva from "../MainCanva"
import { Leva } from "leva"
import { useSearchParams } from "next/navigation"

const Layout: FC<{
  children: ReactNode
}> = ({children}) => {
  const searchParams = useSearchParams();
  return <Provider store={store}>
    <main className="flex h-screen min-w-[100dvw]">
      {children}
      <Leva collapsed={false} hidden={!searchParams.has('controls')} />
      <MainCanva />
    </main>
  </Provider>
}

export default Layout;
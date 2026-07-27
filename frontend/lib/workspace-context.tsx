'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { listWorkspaces, getWorkspace, setDefaultWorkspace, type Workspace } from '@/lib/api'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

interface WorkspaceCtx {
  activeWsId: string | null
  setActiveWsId: (id: string | null) => void
  workspaces: Workspace[]
  refreshWorkspaces: () => Promise<void>
  myRole: WorkspaceRole | null
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceCtx>({
  activeWsId: null,
  setActiveWsId: () => {},
  workspaces: [],
  refreshWorkspaces: async () => {},
  myRole: null,
  loading: true,
})

export const useWorkspace = () => useContext(WorkspaceContext)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWsId, setActiveWsIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pullo_active_ws_id')
    }
    return null
  })
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [myRole, setMyRole] = useState<WorkspaceRole | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const setActiveWsId = useCallback((id: string | null) => {
    setActiveWsIdState(id)
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('pullo_active_ws_id', id)
        setDefaultWorkspace(id).catch(() => {})
      } else {
        localStorage.removeItem('pullo_active_ws_id')
      }
    }
  }, [])

  const refreshWorkspaces = useCallback(async () => {
    try {
      setLoading(true)
      const wsList = await listWorkspaces()
      setWorkspaces(wsList)
      setActiveWsIdState((currentId) => {
        if (wsList.length > 0) {
          const validCurrent = currentId && wsList.some((w) => w.id === currentId)
          if (validCurrent) return currentId
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('pullo_active_ws_id') : null
          const validSaved = savedId && wsList.some((w) => w.id === savedId)
          const nextId = validSaved ? savedId : wsList[0].id
          if (typeof window !== 'undefined') localStorage.setItem('pullo_active_ws_id', nextId)
          return nextId
        }
        if (typeof window !== 'undefined') localStorage.removeItem('pullo_active_ws_id')
        return null
      })
    } catch (e) {
      console.warn('failed to load workspaces', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshWorkspaces()
  }, [refreshWorkspaces])

  useEffect(() => {
    if (!activeWsId) {
      setMyRole(null)
      return
    }
    getWorkspace(activeWsId)
      .then((ws) => setMyRole(ws.my_role ?? null))
      .catch(() => setMyRole(null))
  }, [activeWsId])

  return (
    <WorkspaceContext.Provider value={{ activeWsId, setActiveWsId, workspaces, refreshWorkspaces, myRole, loading }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

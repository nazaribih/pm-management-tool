
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from './api'
import { useAuth } from './useAuth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
})

const taskSchema = z.object({
  title: z.string().min(2),
  status: z.enum(['todo','doing','done']),
  project_id: z.number().int().positive()
})

function Card({children}){
  return <div className="bg-white rounded-2xl shadow p-6">{children}</div>
}

export default function App(){
  const { token, setToken } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState({ q:'', status:'' })
  const [error, setError] = useState('')

  const loginForm = useForm({ resolver: zodResolver(loginSchema) })
  const projForm  = useForm({ resolver: zodResolver(projectSchema) })
  const taskForm  = useForm({ resolver: zodResolver(taskSchema), defaultValues: { status:'todo' }})

  async function login(values){
    setError('')
    try{
      const data = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        body: new URLSearchParams({ username: values.email, password: values.password })
      }).then(r=>r.json())
      setToken(data.access_token)
      await refreshTables(data.access_token)
    }catch(e){ setError('Login failed') }
  }

  async function refreshTables(tok = token){
    if(!tok) return
    const p = await api('/projects/?q='+encodeURIComponent(filter.q||''), { token: tok })
    const t = await api(`/tasks/?${filter.status?`status=${filter.status}&`:''}`, { token: tok })
    setProjects(p); setTasks(t)
  }

  async function createProject(values){
    try{
      await api('/projects/', { method:'POST', body: values, token })
      projForm.reset()
      refreshTables()
    }catch(e){ setError('Only manager/admin can create projects') }
  }

  async function createTask(values){
    try{
      const payload = { ...values, project_id: Number(values.project_id) }
      await api('/tasks/', { method:'POST', body: payload, token })
      taskForm.reset({ status:'todo' })
      refreshTables()
    }catch(e){ setError('Failed to create task') }
  }

  useEffect(()=>{ if(token) refreshTables() }, [token, filter])

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-4xl font-bold">Role-Based Projects</h1>
        {token ? (
          <button className="px-4 py-2 rounded-xl bg-slate-800 text-white" onClick={()=>{setToken(null)}}>Log out</button>
        ) : null}
      </header>

      {!token && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Login</h2>
          <form onSubmit={loginForm.handleSubmit(login)} className="grid gap-3 md:grid-cols-3">
            <input className="border rounded-xl p-2" placeholder="Email" {...loginForm.register('email')} />
            <input type="password" className="border rounded-xl p-2" placeholder="Password" {...loginForm.register('password')} />
            <button className="rounded-xl bg-blue-600 text-white px-4 py-2">Sign in</button>
          </form>
          {error && <p className="text-red-600 mt-2">{error}</p>}
          <p className="text-sm text-slate-600 mt-3">Demo users: admin@example.com / Admin123!; manager@example.com / Manager123!; user@example.com / User123!</p>
        </Card>
      )}

      {token && (
        <>
          <Card>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Filter Projects</h3>
                <input className="border rounded-xl p-2 w-full" placeholder="Search by name..." value={filter.q} onChange={e=>setFilter(f=>({...f,q:e.target.value}))} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Filter Tasks</h3>
                <select className="border rounded-xl p-2" value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
                  <option value="">All</option>
                  <option value="todo">To do</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-xl font-semibold mb-2">Projects</h2>
              <ul className="space-y-2 max-h-72 overflow-auto">
                {projects.map(p => (
                  <li key={p.id} className="border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-slate-600">{p.description}</div>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <form onSubmit={projForm.handleSubmit(createProject)} className="mt-4 grid gap-3 md:grid-cols-3">
                <input className="border rounded-xl p-2" placeholder="Name" {...projForm.register('name')} />
                <input className="border rounded-xl p-2" placeholder="Description" {...projForm.register('description')} />
                <button className="rounded-xl bg-emerald-600 text-white px-4 py-2">Add Project (Mgr/Admin)</button>
              </form>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-2">Tasks</h2>
              <ul className="space-y-2 max-h-72 overflow-auto">
                {tasks.map(t => (
                  <li key={t.id} className="border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-sm text-slate-600">Project #{t.project_id} • Owner #{t.owner_id}</div>
                    </div>
                    <span className="text-xs rounded-lg px-2 py-1 border">{t.status}</span>
                  </li>
                ))}
              </ul>
              <form onSubmit={taskForm.handleSubmit(createTask)} className="mt-4 grid gap-3 md:grid-cols-4">
                <input className="border rounded-xl p-2" placeholder="Title" {...taskForm.register('title')} />
                <select className="border rounded-xl p-2" {...taskForm.register('status')}>
                  <option value="todo">todo</option>
                  <option value="doing">doing</option>
                  <option value="done">done</option>
                </select>
                <input type="number" className="border rounded-xl p-2" placeholder="Project ID" {...taskForm.register('project_id', { valueAsNumber: true })} />
                <button className="rounded-xl bg-emerald-600 text-white px-4 py-2">Add Task</button>
              </form>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from './api'
import { useAuth } from './useAuth'

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email.' }),
  password: z.string().min(8, 'Password must be at least 8 characters.')
})

const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
  description: z.string().max(255, 'Description is too long.').optional()
})

const taskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters.'),
  status: z.enum(['todo', 'doing', 'done']),
  project_id: z.number({ invalid_type_error: 'Project ID is required.' }).int().positive()
})

const strongPassword = z
  .string()
  .min(8, 'New password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[0-9]/, 'Include at least one digit.')

const passwordSchema = z.object({
  current_password: z.string().min(8, 'Current password must be at least 8 characters.'),
  new_password: strongPassword
})

const roleHighlights = {
  user: [
    'Create and update personal tasks.',
    'View all projects and tasks for awareness.'
  ],
  manager: [
    'Everything a user can do.',
    'Create and update projects for the team.',
    'Delete tasks when work is reprioritised.'
  ],
  admin: [
    'Everything a manager can do.',
    'Delete any project that is obsolete.',
    'Manage team access by promoting or demoting roles.'
  ]
}

const buttonBase = 'rounded-xl px-4 py-2 font-medium transition-transform duration-150 active:translate-y-[1px] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed'
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  ghost: 'bg-white text-blue-700 border border-blue-200 hover:border-blue-400 focus:ring-blue-500'
}

function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant] || buttonVariants.primary} ${className}`}
      {...props}
    />
  )
}

function Card({ children, className = '' }) {
  return <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 ${className}`}>{children}</div>
}

const fieldClasses = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition'

export default function App() {
  const { token, setToken, user, setUser, loadingUser, authError, refreshUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState({ q: '', status: '' })
  const [loginError, setLoginError] = useState('')
  const [projectError, setProjectError] = useState('')
  const [taskError, setTaskError] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState(null)
  const [globalNotice, setGlobalNotice] = useState('')
  const [usersError, setUsersError] = useState('')

  const loginForm = useForm({ resolver: zodResolver(loginSchema) })
  const projForm = useForm({ resolver: zodResolver(projectSchema) })
  const taskForm = useForm({ resolver: zodResolver(taskSchema), defaultValues: { status: 'todo' } })
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const roleCopy = useMemo(() => roleHighlights[user?.role] || [], [user?.role])
  const isManagerOrAdmin = user && (user.role === 'manager' || user.role === 'admin')
  const isAdmin = user?.role === 'admin'

  const refreshTables = useCallback(async (tok = token) => {
    if (!tok) return
    try {
      const projectQuery = filter.q ? `?q=${encodeURIComponent(filter.q)}` : ''
      const taskParams = new URLSearchParams()
      if (filter.status) taskParams.set('status', filter.status)
      const [projectsData, tasksData] = await Promise.all([
        api(`/projects/${projectQuery}`, { token: tok }),
        api(`/tasks/${taskParams.toString() ? `?${taskParams.toString()}` : ''}`, { token: tok })
      ])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setTasks(Array.isArray(tasksData) ? tasksData : [])
    } catch (e) {
      setGlobalNotice(e.message)
    }
  }, [token, filter.q, filter.status])

  const fetchUsers = useCallback(async () => {
    if (!token || !isAdmin) return
    try {
      const list = await api('/users/', { token })
      setUsers(Array.isArray(list) ? list : [])
      setUsersError('')
    } catch (e) {
      setUsersError(e.message)
    }
  }, [token, isAdmin])

  useEffect(() => {
    if (token) {
      refreshTables(token)
    }
  }, [token, refreshTables])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (globalNotice) {
      const id = setTimeout(() => setGlobalNotice(''), 4000)
      return () => clearTimeout(id)
    }
  }, [globalNotice])

  async function login(values) {
    setLoginError('')
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        body: new URLSearchParams({ username: values.email, password: values.password })
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        const message = data.detail || data.message || 'Login failed'
        throw new Error(message)
      }
      setToken(data.access_token)
      await refreshUser(data.access_token)
      await refreshTables(data.access_token)
      setGlobalNotice('Welcome back!')
      loginForm.reset()
    } catch (e) {
      setLoginError(e.message || 'Login failed')
    }
  }

  async function createProject(values) {
    setProjectError('')
    try {
      await api('/projects/', { method: 'POST', body: values, token })
      projForm.reset()
      setGlobalNotice('Project created successfully.')
      refreshTables()
    } catch (e) {
      setProjectError(e.message)
    }
  }

  async function createTask(values) {
    setTaskError('')
    try {
      const payload = { ...values, project_id: Number(values.project_id) }
      await api('/tasks/', { method: 'POST', body: payload, token })
      taskForm.reset({ status: 'todo' })
      setGlobalNotice('Task created successfully.')
      refreshTables()
    } catch (e) {
      setTaskError(e.message)
    }
  }

  async function changePassword(values) {
    setPasswordFeedback(null)
    try {
      await api('/auth/change-password', { method: 'POST', body: values, token })
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully.' })
      passwordForm.reset()
    } catch (e) {
      setPasswordFeedback({ type: 'error', message: e.message })
    }
  }

  async function updateUserRole(uid, role) {
    try {
      const updated = await api(`/users/${uid}/role`, { method: 'PATCH', body: { role }, token })
      setUsers(list => list.map(u => (u.id === uid ? updated : u)))
      setGlobalNotice(`Updated ${updated.email} to ${updated.role}.`)
      setUsersError('')
    } catch (e) {
      setUsersError(e.message)
    }
  }

  function handleLogout() {
    setToken(null)
    setUser(null)
    setProjects([])
    setTasks([])
    setUsers([])
    setGlobalNotice('')
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="bg-[#0747A6] text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">PM-management-tool</h1>
            <p className="text-sm text-blue-100">Plan and execute projects with role-based guardrails inspired by Jira.</p>
          </div>
          {user ? (
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="text-sm text-blue-100">
                <div className="font-semibold text-white">{user.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="uppercase tracking-wider text-xs px-2 py-0.5 rounded-full bg-blue-500/40 border border-blue-200/40 text-white">{user.role}</span>
                  <span>{user.role === 'admin' ? 'Administrator' : user.role === 'manager' ? 'Manager' : 'Contributor'}</span>
                </div>
              </div>
              <Button variant="ghost" onClick={handleLogout}>Log out</Button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {!token && (
          <Card className="max-w-xl mx-auto">
            <h2 className="text-2xl font-semibold text-slate-800">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in with one of the demo accounts to explore the PM-management-tool.</p>
            <form onSubmit={loginForm.handleSubmit(login)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                <input className={fieldClasses} placeholder="you@company.com" {...loginForm.register('email')} />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                <input type="password" className={fieldClasses} placeholder="Your password" {...loginForm.register('password')} />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button type="submit" className="w-full md:w-auto">Sign in</Button>
              </div>
            </form>
            {loginError && <p className="mt-4 text-sm text-red-600">{loginError}</p>}
            {authError && <p className="mt-2 text-xs text-red-500">{authError}</p>}
            <p className="text-sm text-slate-500 mt-6">
              Demo users: admin@example.com / Admin123!; manager@example.com / Manager123!; user@example.com / User123!
            </p>
          </Card>
        )}

        {token && (
          <>
            {authError && (
              <div className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900">
                {authError}
              </div>
            )}
            {loadingUser && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Refreshing your workspace…
              </div>
            )}
            {globalNotice && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {globalNotice}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <Card>
                <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Search projects</label>
                    <input
                      className={fieldClasses}
                      placeholder="Search by project name…"
                      value={filter.q}
                      onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Filter tasks by status</label>
                    <select
                      className={fieldClasses}
                      value={filter.status}
                      onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="todo">To do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-slate-800">Role overview</h3>
                <p className="text-sm text-slate-500">
                  Managers focus on structuring work; admins take it further by managing access in addition to all manager capabilities.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {roleCopy.map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-800">Projects</h2>
                  {isAdmin && <span className="text-xs rounded-full bg-blue-100 px-3 py-1 text-blue-700">Admin can delete projects</span>}
                </div>
                <ul className="mt-4 space-y-3 max-h-72 overflow-auto pr-2">
                  {projects.map(project => (
                    <li key={project.id} className="rounded-xl border border-slate-200 px-4 py-3 bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-slate-500 mt-1">{project.description}</div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(project.created_at).toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                  {projects.length === 0 && (
                    <li className="text-sm text-slate-500">No projects yet. Managers or admins can create the first one.</li>
                  )}
                </ul>
                <form onSubmit={projForm.handleSubmit(createProject)} className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                    <input className={fieldClasses} placeholder="Project name" {...projForm.register('name')} />
                    {projForm.formState.errors.name && (
                      <p className="mt-1 text-xs text-red-600">{projForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                    <input className={fieldClasses} placeholder="Optional description" {...projForm.register('description')} />
                    {projForm.formState.errors.description && (
                      <p className="mt-1 text-xs text-red-600">{projForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="success" className="w-full">
                      Add Project (Manager/Admin)
                    </Button>
                  </div>
                </form>
                {!isManagerOrAdmin && (
                  <p className="mt-3 text-sm text-amber-600">Only managers or admins can create projects. Try logging in as manager@example.com.</p>
                )}
                {projectError && <p className="mt-3 text-sm text-red-600">{projectError}</p>}
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-800">Tasks</h2>
                <ul className="mt-4 space-y-3 max-h-72 overflow-auto pr-2">
                  {tasks.map(task => (
                    <li key={task.id} className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">{task.title}</div>
                          <div className="text-sm text-slate-500 mt-1">Project #{task.project_id} • Owner #{task.owner_id}</div>
                        </div>
                        <span className="text-xs uppercase tracking-wide rounded-full border border-slate-200 px-2 py-1 bg-slate-50">{task.status}</span>
                      </div>
                    </li>
                  ))}
                  {tasks.length === 0 && (
                    <li className="text-sm text-slate-500">No tasks yet. Create one below to get started.</li>
                  )}
                </ul>
                <form onSubmit={taskForm.handleSubmit(createTask)} className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                    <input className={fieldClasses} placeholder="Task title" {...taskForm.register('title')} />
                    {taskForm.formState.errors.title && (
                      <p className="mt-1 text-xs text-red-600">{taskForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                    <select className={fieldClasses} {...taskForm.register('status')}>
                      <option value="todo">To do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Project ID</label>
                    <input type="number" className={fieldClasses} placeholder="e.g. 1" {...taskForm.register('project_id', { valueAsNumber: true })} />
                    {taskForm.formState.errors.project_id && (
                      <p className="mt-1 text-xs text-red-600">{taskForm.formState.errors.project_id.message}</p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="success" className="w-full">Add Task</Button>
                  </div>
                </form>
                {taskError && <p className="mt-3 text-sm text-red-600">{taskError}</p>}
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="text-xl font-semibold text-slate-800">Change password</h2>
                <p className="text-sm text-slate-500">Update your credentials without leaving the app.</p>
                <form onSubmit={passwordForm.handleSubmit(changePassword)} className="mt-4 space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Current password</label>
                    <input type="password" className={fieldClasses} {...passwordForm.register('current_password')} />
                    {passwordForm.formState.errors.current_password && (
                      <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.current_password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">New password</label>
                    <input type="password" className={fieldClasses} {...passwordForm.register('new_password')} />
                    {passwordForm.formState.errors.new_password && (
                      <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.new_password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">Update password</Button>
                </form>
                {passwordFeedback && (
                  <p className={`mt-3 text-sm ${passwordFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {passwordFeedback.message}
                  </p>
                )}
              </Card>

              {isAdmin && (
                <Card>
                  <h2 className="text-xl font-semibold text-slate-800">Team management</h2>
                  <p className="text-sm text-slate-500">Admins can manage access levels directly from here.</p>
                  <ul className="mt-4 space-y-3">
                    {users.map(u => (
                      <li key={u.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{u.email}</div>
                          <div className="text-xs text-slate-500">Current role: {u.role}</div>
                        </div>
                        <select
                          className={`${fieldClasses} sm:w-40`}
                          value={u.role}
                          onChange={e => updateUserRole(u.id, e.target.value)}
                        >
                          <option value="user">user</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      </li>
                    ))}
                    {users.length === 0 && (
                      <li className="text-sm text-slate-500">No additional users yet.</li>
                    )}
                  </ul>
                  {usersError && <p className="mt-3 text-sm text-red-600">{usersError}</p>}
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

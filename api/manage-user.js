// Vercel Serverless Function — corre en el servidor, nunca en el browser
// Tiene acceso a SUPABASE_SERVICE_ROLE_KEY que el frontend no puede ver

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verificar que el que llama es un admin autenticado
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' })

  const { data: callerRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (callerRole?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden gestionar usuarios' })
  }

  const { action, email, password, userId, role } = req.body

  // ── Crear usuario con contraseña ──
  if (action === 'create') {
    if (!email || !password || !role) return res.status(400).json({ error: 'Faltan campos' })
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no requiere confirmar email
    })
    if (error) return res.status(400).json({ error: error.message })

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: data.user.id, role })

    if (roleError) return res.status(400).json({ error: roleError.message })

    return res.status(200).json({ ok: true, userId: data.user.id })
  }

  // ── Resetear contraseña (admin la cambia) ──
  if (action === 'reset_password') {
    if (!userId || !password) return res.status(400).json({ error: 'Faltan campos' })
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // ── Cambiar rol ──
  if (action === 'update_role') {
    if (!userId || !role) return res.status(400).json({ error: 'Faltan campos' })

    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // ── Eliminar usuario ──
  if (action === 'delete') {
    if (!userId) return res.status(400).json({ error: 'Falta userId' })

    // No puede eliminarse a sí mismo
    if (userId === user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Acción desconocida' })
}

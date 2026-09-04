"use client"

import * as React from 'react'
import { supabase } from '@/lib/supabase'

type FormData = {
  name: string
  sector: string
  province: string
  city: string
  whatsapp: string
  phone: string
  email: string
  description: string
  website: string
}

export default function CadastrarEmpresaPage() {
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    sector: '',
    province: '',
    city: '',
    whatsapp: '',
    phone: '',
    email: '',
    description: '',
    website: '',
  })

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({})
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {}
    
    if (!formData.name) errors.name = 'Nome é obrigatório'
    if (!formData.sector) errors.sector = 'Setor é obrigatório'
    if (!formData.province) errors.province = 'Província é obrigatória'
    if (!formData.whatsapp && !formData.phone) errors.contact = 'WhatsApp ou Phone é obrigatório'
    if (!formData.email) errors.email = 'Email é obrigatório'
    
    setErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setStatus('submitting')
    
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: formData.name,
        slug,
        sector: formData.sector,
        province: formData.province,
        city: formData.city,
        whatsapp: formData.whatsapp,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        website: formData.website,
        is_approved: false,
      })
      .select()
      .single()

    if (error) {
      setStatus('idle')
      alert('Erro ao cadastrar: ' + error.message)
      return
    }

    setStatus('success')
    setFormData({
      name: '',
      sector: '',
      province: '',
      city: '',
      whatsapp: '',
      phone: '',
      email: '',
      description: '',
      website: '',
    })
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Cadastro de Empresa</h1>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Nome da Empresa</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
          {errors.name && <p style={{ color: 'red', fontSize: '12px' }}>{errors.name}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Setor</label>
          <input
            type="text"
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
          {errors.sector && <p style={{ color: 'red', fontSize: '12px' }}>{errors.sector}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Província</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
          {errors.province && <p style={{ color: 'red', fontSize: '12px' }}>{errors.province}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Cidade</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>WhatsApp</label>
          <input
            type="text"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
          {errors.email && <p style={{ color: 'red', fontSize: '12px' }}>{errors.email}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '100px' }}
          >
          </textarea>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          {status === 'submitting' ? 'Aguardando...' : 'Enviar Cadastro'}
        </button>
      </form>

      {status === 'success' && (
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#d1fae5', borderRadius: '4px', color: '#055a32' }}>
          <p>Cadastro enviado para aprovação</p>
        </div>
      )}
    </div>
  )
}
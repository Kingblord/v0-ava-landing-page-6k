'use client'

import { useState, useEffect } from 'react'
import { getSection, DEFAULT_CONTENT } from '@/lib/content'
import type { NavbarContent } from '@/lib/content'
import { AdminField, SectionHeader, ListEditor, useSaveSection } from '@/components/admin/AdminEditor'

export default function AdminNavbar() {
  const [data, setData] = useState<NavbarContent>(DEFAULT_CONTENT.navbar)
  const { saving, handleSave, handleReset } = useSaveSection('navbar', data, DEFAULT_CONTENT.navbar, setData)

  useEffect(() => { getSection('navbar').then(setData) }, [])

  return (
    <div className="p-8 max-w-2xl">
      <SectionHeader
        title="Navbar"
        description="Brand name, navigation links, and CTA button labels."
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      <div className="flex flex-col gap-6">
        <AdminField label="Brand Name" value={data.brandName} onChange={(v) => setData({ ...data, brandName: v })} />
        <AdminField label="CTA — Sign In Text" value={data.ctaSignIn} onChange={(v) => setData({ ...data, ctaSignIn: v })} />
        <AdminField label="CTA — Sign Up Text" value={data.ctaSignUp} onChange={(v) => setData({ ...data, ctaSignUp: v })} />
        <ListEditor
          label="Navigation Links"
          items={data.links}
          fields={[
            { key: 'label', label: 'Label' },
            { key: 'href', label: 'URL / Anchor' },
          ]}
          onChange={(links) => setData({ ...data, links })}
          newItem={{ label: 'New Link', href: '#' }}
        />
      </div>
    </div>
  )
}

import React from 'react'
import { Briefcase, FileText, Mail, MapPin, Phone, Star } from 'lucide-react'

export interface CvRenderSection {
  title: string
  content: string
}

export interface CvRenderData {
  fullName: string
  title: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  sections: CvRenderSection[]
  keywords?: string[]
  lang: 'fr' | 'it'
}

type IconKind = 'phone' | 'mail' | 'location' | 'skills' | 'profile' | 'default'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function splitContent(content: string) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks: Array<{ type: 'list'; items: string[] } | { type: 'paragraph'; text: string }> = []
  let currentList: string[] = []

  const flushList = () => {
    if (currentList.length) {
      blocks.push({ type: 'list', items: currentList })
      currentList = []
    }
  }

  for (const line of lines) {
    if (/^[-â€¢]/.test(line)) {
      currentList.push(line.replace(/^[-â€¢]\s*/, ''))
      continue
    }

    flushList()
    blocks.push({ type: 'paragraph', text: line })
  }

  flushList()
  return blocks
}

function renderContentHtml(content: string, options?: { textColor?: string; listColor?: string }) {
  const textColor = options?.textColor || '#334155'
  const listColor = options?.listColor || textColor

  return splitContent(content)
    .map((block) => {
      if (block.type === 'list') {
        return `<ul style="margin:10px 0 0 18px;padding:0;color:${listColor};line-height:1.7;font-size:13px;">${block.items
          .map((item) => `<li style="margin:0 0 6px 0;">${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      }
      return `<p style="margin:0 0 10px 0;color:${textColor};line-height:1.75;font-size:13px;">${escapeHtml(block.text)}</p>`
    })
    .join('')
}

function getContactItems(data: CvRenderData) {
  return [
    data.phone ? { kind: 'phone' as const, label: data.phone } : null,
    data.email ? { kind: 'mail' as const, label: data.email } : null,
    data.location ? { kind: 'location' as const, label: data.location } : null,
  ].filter(Boolean) as Array<{ kind: 'phone' | 'mail' | 'location'; label: string }>
}

function isSidebarSection(title: string) {
  return /compet|skill|abilit|lang|lingu|certif|outil|strument|software/i.test(title)
}

function sectionIconKind(title: string): IconKind {
  if (/profil|profilo|profile|about|resume|sommario/i.test(title)) return 'profile'
  if (/compet|skill|abilit|lang|lingu|certif|outil|strument|software/i.test(title)) return 'skills'
  return 'default'
}

function splitItalianLayout(data: CvRenderData) {
  const sidebarSections = data.sections.filter((section) => isSidebarSection(section.title))
  const mainSections = data.sections.filter((section) => !isSidebarSection(section.title) && section.content !== data.summary)
  return { sidebarSections, mainSections }
}

function renderContactIcon(kind: 'phone' | 'mail' | 'location', color = 'currentColor') {
  const common = `width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
  switch (kind) {
    case 'phone':
      return `<svg ${common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.61 2.64a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.44-1.22a2 2 0 0 1 2.11-.45c.85.28 1.74.49 2.64.61A2 2 0 0 1 22 16.92z"/></svg>`
    case 'mail':
      return `<svg ${common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`
    case 'location':
      return `<svg ${common}><path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`
  }
}

function renderSectionIcon(kind: IconKind, color = 'currentColor') {
  const common = `width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
  switch (kind) {
    case 'skills':
      return `<svg ${common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`
    case 'profile':
      return `<svg ${common}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>`
    default:
      return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16l4-3 4 3 4-3 4 3V8Z"/></svg>`
  }
}

function buildDefaultCvPrintHtml(data: CvRenderData) {
  const contactItems = getContactItems(data)
  const sectionsHtml = data.sections
    .map(
      (section) => `
        <section style="padding:16px 0;border-top:1px solid #E2E8F0;">
          <h2 style="margin:0 0 10px 0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#1E3A8A;">${escapeHtml(section.title)}</h2>
          ${renderContentHtml(section.content)}
        </section>
      `,
    )
    .join('')

  const keywordsHtml = (data.keywords || [])
    .slice(0, 8)
    .map(
      (keyword) => `<span style="display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:#EFF6FF;color:#1D4ED8;font-size:11px;font-weight:700;margin:0 6px 6px 0;">${escapeHtml(keyword)}</span>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="${data.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.fullName)} - CV</title>
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #E2E8F0;
        font-family: Arial, Helvetica, sans-serif;
        color: #0F172A;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: white;
        padding: 0;
      }
      .header {
        padding: 24px 28px 20px;
        background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
        color: white;
      }
      .name {
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 6px;
      }
      .title {
        font-size: 15px;
        font-weight: 600;
        color: #BFDBFE;
        margin: 0 0 12px;
      }
      .contact {
        font-size: 12px;
        color: #E2E8F0;
        line-height: 1.6;
      }
      .content {
        padding: 22px 28px 28px;
      }
      .summary {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 14px;
        padding: 14px 16px;
        margin-bottom: 18px;
        color: #334155;
        font-size: 13px;
        line-height: 1.75;
      }
      .keywords {
        margin: 0 0 14px 0;
      }
      @media print {
        body { background: white; }
        .page { width: auto; min-height: auto; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="header">
        <h1 class="name">${escapeHtml(data.fullName)}</h1>
        <p class="title">${escapeHtml(data.title)}</p>
        <div class="contact">${contactItems.map((item) => escapeHtml(String(item.label))).join(' | ')}</div>
      </header>
      <main class="content">
        ${data.summary ? `<section class="summary">${renderContentHtml(data.summary)}</section>` : ''}
        ${keywordsHtml ? `<div class="keywords">${keywordsHtml}</div>` : ''}
        ${sectionsHtml}
      </main>
    </div>
  </body>
</html>`
}

function buildItalianCvPrintHtml(data: CvRenderData) {
  const contactItems = getContactItems(data)
  const { sidebarSections, mainSections } = splitItalianLayout(data)
  const keywordsHtml = (data.keywords || [])
    .slice(0, 8)
    .map(
      (keyword) => `<span style="display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:rgba(191,219,254,0.16);color:#DBEAFE;font-size:11px;font-weight:700;margin:0 6px 6px 0;border:1px solid rgba(191,219,254,0.14);">${escapeHtml(keyword)}</span>`,
    )
    .join('')

  const sidebarHtml = sidebarSections
    .map(
      (section) => `
        <section style="margin-top:20px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="display:inline-flex;width:26px;height:26px;border-radius:999px;align-items:center;justify-content:center;background:rgba(191,219,254,0.12);color:#BFDBFE;">${renderSectionIcon(sectionIconKind(section.title), '#BFDBFE')}</span>
            <h2 style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#DBEAFE;">${escapeHtml(section.title)}</h2>
          </div>
          ${renderContentHtml(section.content, { textColor: '#E2E8F0', listColor: '#E2E8F0' })}
        </section>
      `,
    )
    .join('')

  const mainHtml = mainSections
    .map(
      (section) => `
        <section style="padding:16px 0;border-top:1px solid #E2E8F0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="display:inline-flex;width:28px;height:28px;border-radius:999px;align-items:center;justify-content:center;background:#DBEAFE;color:#1D4ED8;">${renderSectionIcon(sectionIconKind(section.title), '#1D4ED8')}</span>
            <h2 style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#1E3A8A;">${escapeHtml(section.title)}</h2>
          </div>
          ${renderContentHtml(section.content)}
        </section>
      `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="${data.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.fullName)} - CV Italiano</title>
    <style>
      @page { size: A4; margin: 10mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #CBD5E1;
        font-family: Arial, Helvetica, sans-serif;
        color: #0F172A;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: white;
        display: grid;
        grid-template-columns: 70mm 1fr;
        overflow: hidden;
      }
      .sidebar {
        background: linear-gradient(180deg, #0F172A 0%, #172554 100%);
        color: white;
        padding: 28px 22px;
      }
      .eyebrow {
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(191,219,254,0.12);
        color: #BFDBFE;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .name {
        margin: 16px 0 6px 0;
        font-size: 25px;
        font-weight: 800;
        line-height: 1.05;
      }
      .title {
        margin: 0;
        color: #DBEAFE;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.5;
      }
      .contact-list {
        margin-top: 22px;
        display: grid;
        gap: 10px;
      }
      .contact-item {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        color: #E2E8F0;
        font-size: 12px;
        line-height: 1.6;
      }
      .icon {
        display: inline-flex;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        align-items: center;
        justify-content: center;
        background: rgba(191,219,254,0.12);
        color: #BFDBFE;
        flex: 0 0 auto;
      }
      .main {
        padding: 28px 30px 30px;
      }
      .summary {
        border: 1px solid #DBEAFE;
        background: linear-gradient(180deg, #F8FBFF 0%, #EEF6FF 100%);
        border-radius: 18px;
        padding: 18px 18px 14px;
        margin-bottom: 18px;
      }
      .summary-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .summary-head h2 {
        margin: 0;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #1D4ED8;
      }
      .summary-icon {
        display: inline-flex;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        align-items: center;
        justify-content: center;
        background: #DBEAFE;
        color: #1D4ED8;
      }
      .keywords {
        margin-top: 18px;
      }
      @media print {
        body { background: white; }
        .page { width: auto; min-height: auto; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <aside class="sidebar">
        <span class="eyebrow">Curriculum Vitae</span>
        <h1 class="name">${escapeHtml(data.fullName)}</h1>
        <p class="title">${escapeHtml(data.title)}</p>
        ${contactItems.length ? `<div class="contact-list">${contactItems
          .map(
            (item) => `
              <div class="contact-item">
                <span class="icon">${renderContactIcon(item.kind, '#BFDBFE')}</span>
                <span>${escapeHtml(item.label)}</span>
              </div>
            `,
          )
          .join('')}</div>` : ''}
        ${keywordsHtml ? `<section class="keywords"><div style="margin-bottom:10px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#DBEAFE;font-weight:700;">Competenze chiave</div><div>${keywordsHtml}</div></section>` : ''}
        ${sidebarHtml}
      </aside>
      <main class="main">
        ${data.summary ? `<section class="summary"><div class="summary-head"><span class="summary-icon">${renderSectionIcon('profile', '#1D4ED8')}</span><h2>Profilo professionale</h2></div>${renderContentHtml(data.summary)}</section>` : ''}
        ${mainHtml}
      </main>
    </div>
  </body>
</html>`
}

export function buildCvPrintHtml(data: CvRenderData) {
  if (data.lang === 'it') return buildItalianCvPrintHtml(data)
  return buildDefaultCvPrintHtml(data)
}

function renderBlocks(content: string, color: string) {
  return splitContent(content).map((block, index) =>
    block.type === 'list' ? (
      <ul key={index} style={{ margin: '0 0 0 18px', padding: 0, color, lineHeight: 1.7, fontSize: '13px' }}>
        {block.items.map((item) => (
          <li key={item} style={{ marginBottom: '6px' }}>{item}</li>
        ))}
      </ul>
    ) : (
      <p key={index} style={{ margin: '0 0 10px 0', color, lineHeight: 1.75, fontSize: '13px' }}>{block.text}</p>
    ),
  )
}

function DefaultCvProfessionalPreview({ data }: { data: CvRenderData }) {
  const contactItems = getContactItems(data)

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        style={{
          padding: '22px 24px 18px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1 }}>{data.fullName}</div>
        <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 700, color: '#BFDBFE' }}>{data.title}</div>
        {contactItems.length > 0 ? (
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#E2E8F0', lineHeight: 1.6 }}>
            {contactItems.map((item) => item.label).join(' | ')}
          </div>
        ) : null}
      </div>

      <div style={{ padding: '20px 24px 24px' }}>
        {data.summary ? (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
            {renderBlocks(data.summary, '#334155')}
          </div>
        ) : null}

        {data.keywords?.length ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {data.keywords.slice(0, 8).map((keyword) => (
              <span key={keyword} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: '999px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 700 }}>
                {keyword}
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.sections.map((section) => (
            <section key={section.title} style={{ padding: '16px 0', borderTop: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E3A8A' }}>
                {section.title}
              </h3>
              {renderBlocks(section.content, '#334155')}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function ItalianCvProfessionalPreview({ data }: { data: CvRenderData }) {
  const contactItems = getContactItems(data)
  const { sidebarSections, mainSections } = splitItalianLayout(data)

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #CBD5E1',
        borderRadius: '22px',
        overflow: 'hidden',
        boxShadow: '0 18px 44px rgba(15, 23, 42, 0.12)',
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 0.9fr) 1.6fr',
      }}
    >
      <aside
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #172554 100%)',
          color: 'white',
          padding: '26px 22px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(191,219,254,0.12)',
            color: '#BFDBFE',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          CV Italiano
        </span>
        <div style={{ marginTop: '16px', fontSize: '28px', fontWeight: 800, lineHeight: 1.02 }}>{data.fullName}</div>
        <div style={{ marginTop: '8px', color: '#DBEAFE', fontSize: '14px', fontWeight: 700, lineHeight: 1.55 }}>{data.title}</div>

        {contactItems.length > 0 ? (
          <div style={{ display: 'grid', gap: '10px', marginTop: '22px' }}>
            {contactItems.map((item) => {
              const Icon = item.kind === 'phone' ? Phone : item.kind === 'mail' ? Mail : MapPin
              return (
                <div key={`${item.kind}-${item.label}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(191,219,254,0.12)',
                      color: '#BFDBFE',
                      flex: '0 0 auto',
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span style={{ color: '#E2E8F0', fontSize: '12px', lineHeight: 1.65 }}>{item.label}</span>
                </div>
              )
            })}
          </div>
        ) : null}

        {data.keywords?.length ? (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(191,219,254,0.12)',
                  color: '#BFDBFE',
                }}
              >
                <Star size={14} />
              </span>
              <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#DBEAFE', fontWeight: 800 }}>
                Competenze chiave
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {data.keywords.slice(0, 8).map((keyword) => (
                <span
                  key={keyword}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: 'rgba(191,219,254,0.12)',
                    color: '#DBEAFE',
                    border: '1px solid rgba(191,219,254,0.12)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {sidebarSections.map((section) => (
          <section key={section.title} style={{ marginTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(191,219,254,0.12)',
                  color: '#BFDBFE',
                }}
              >
                <Star size={14} />
              </span>
              <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#DBEAFE', fontWeight: 800 }}>
                {section.title}
              </div>
            </div>
            {renderBlocks(section.content, '#E2E8F0')}
          </section>
        ))}
      </aside>

      <div style={{ padding: '26px 28px 28px' }}>
        {data.summary ? (
          <div
            style={{
              border: '1px solid #DBEAFE',
              background: 'linear-gradient(180deg, #F8FBFF 0%, #EEF6FF 100%)',
              borderRadius: '18px',
              padding: '18px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  width: '30px',
                  height: '30px',
                  borderRadius: '999px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#DBEAFE',
                  color: '#1D4ED8',
                }}
              >
                <Briefcase size={15} />
              </span>
              <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1D4ED8', fontWeight: 800 }}>
                Profilo professionale
              </div>
            </div>
            {renderBlocks(data.summary, '#334155')}
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: '12px' }}>
          {mainSections.map((section) => {
            const icon = sectionIconKind(section.title)
            const Icon = icon === 'profile' ? Briefcase : icon === 'skills' ? Star : FileText
            return (
              <section
                key={section.title}
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#DBEAFE',
                      color: '#1D4ED8',
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E3A8A', fontWeight: 800 }}>
                    {section.title}
                  </div>
                </div>
                {renderBlocks(section.content, '#334155')}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CvProfessionalPreview({ data }: { data: CvRenderData }) {
  if (data.lang === 'it') {
    return <ItalianCvProfessionalPreview data={data} />
  }

  return <DefaultCvProfessionalPreview data={data} />
}

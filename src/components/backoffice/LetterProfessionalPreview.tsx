import React from 'react'

export interface LetterRenderData {
  fullName: string
  title?: string
  email?: string
  phone?: string
  location?: string
  subject?: string
  salutation?: string
  bodyParagraphs: string[]
  closing?: string
  signature?: string
  lang: 'fr' | 'it' | 'en'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs
    .filter((paragraph) => paragraph.trim().length > 0)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px 0;color:#334155;line-height:1.8;font-size:13px;">${escapeHtml(paragraph)}</p>`,
    )
    .join('')
}

export function buildLetterPrintHtml(data: LetterRenderData) {
  const contactItems = [data.phone, data.email, data.location].filter(Boolean)

  return `<!DOCTYPE html>
<html lang="${data.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.fullName)} - Lettre de motivation</title>
    <style>
      @page { size: A4; margin: 14mm; }
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
      }
      .header {
        padding: 24px 30px 16px;
        border-bottom: 1px solid #E2E8F0;
        background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
        color: white;
      }
      .name {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
      }
      .title {
        margin: 8px 0 0;
        color: #BFDBFE;
        font-size: 14px;
        font-weight: 600;
      }
      .contact {
        margin-top: 10px;
        color: #E2E8F0;
        font-size: 12px;
        line-height: 1.7;
      }
      .content {
        padding: 26px 30px 32px;
      }
      .subject {
        display: inline-block;
        margin: 0 0 22px 0;
        padding: 8px 12px;
        border-radius: 10px;
        background: #EFF6FF;
        color: #1D4ED8;
        font-size: 12px;
        font-weight: 700;
      }
      .salutation, .closing, .signature {
        color: #0F172A;
        font-size: 13px;
        line-height: 1.8;
      }
      .salutation { margin-bottom: 18px; }
      .closing { margin-top: 18px; }
      .signature { margin-top: 18px; font-weight: 700; }
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
        ${data.title ? `<p class="title">${escapeHtml(data.title)}</p>` : ''}
        ${contactItems.length ? `<div class="contact">${contactItems.map((item) => escapeHtml(String(item))).join(' | ')}</div>` : ''}
      </header>
      <main class="content">
        ${data.subject ? `<div class="subject">${escapeHtml(data.subject)}</div>` : ''}
        ${data.salutation ? `<p class="salutation">${escapeHtml(data.salutation)}</p>` : ''}
        ${renderParagraphs(data.bodyParagraphs)}
        ${data.closing ? `<p class="closing">${escapeHtml(data.closing)}</p>` : ''}
        ${data.signature ? `<p class="signature">${escapeHtml(data.signature)}</p>` : ''}
      </main>
    </div>
  </body>
</html>`
}

export function LetterProfessionalPreview({ data }: { data: LetterRenderData }) {
  const contactItems = [data.phone, data.email, data.location].filter(Boolean)

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
        <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.1 }}>{data.fullName}</div>
        {data.title ? <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 700, color: '#BFDBFE' }}>{data.title}</div> : null}
        {contactItems.length > 0 ? (
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#E2E8F0', lineHeight: 1.6 }}>{contactItems.join(' | ')}</div>
        ) : null}
      </div>

      <div style={{ padding: '20px 24px 24px' }}>
        {data.subject ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '10px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '18px',
            }}
          >
            {data.subject}
          </div>
        ) : null}

        {data.salutation ? (
          <p style={{ margin: '0 0 16px 0', color: '#0F172A', lineHeight: 1.8, fontSize: '13px' }}>{data.salutation}</p>
        ) : null}

        {data.bodyParagraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 20)}`} style={{ margin: '0 0 14px 0', color: '#334155', lineHeight: 1.8, fontSize: '13px' }}>
            {paragraph}
          </p>
        ))}

        {data.closing ? (
          <p style={{ margin: '18px 0 0 0', color: '#0F172A', lineHeight: 1.8, fontSize: '13px' }}>{data.closing}</p>
        ) : null}
        {data.signature ? (
          <p style={{ margin: '18px 0 0 0', color: '#0F172A', lineHeight: 1.8, fontSize: '13px', fontWeight: 700 }}>{data.signature}</p>
        ) : null}
      </div>
    </div>
  )
}

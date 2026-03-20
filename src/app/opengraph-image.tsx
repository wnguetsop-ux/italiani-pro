import { SocialPreviewCard, SOCIAL_IMAGE_SIZE } from './social-preview'

export const runtime = 'edge'
export const alt = 'ItalianiPro'
export const size = SOCIAL_IMAGE_SIZE
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return SocialPreviewCard()
}

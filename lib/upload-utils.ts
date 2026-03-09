export async function uploadVenueImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'venues')

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const result = await response.json()
    return result.secure_url
  })

  return Promise.all(uploadPromises)
}

export async function uploadVenueLogo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'venues/logos')

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const result = await response.json()
  return result.secure_url
}

export async function uploadVenueDocuments(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'venues/documents')

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const result = await response.json()
    return result.secure_url
  })

  return Promise.all(uploadPromises)
}
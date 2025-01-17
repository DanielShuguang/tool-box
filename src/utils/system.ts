export function getOS() {
  const { userAgent } = navigator
  if (userAgent.includes('Mac')) {
    return 'Mac'
  } else if (userAgent.includes('Windows')) {
    return 'Windows'
  } else if (userAgent.includes('Linux')) {
    return 'Linux'
  }
  return 'Unknown'
}

export function getSep() {
  const os = getOS()
  if (os === 'Windows') {
    return '\\'
  }
  return '/'
}

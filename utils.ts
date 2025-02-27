// Current epoch time in seconds
export function getTimestamp() {
  return Math.floor(Date.now() / 1000)
}

export function formatTimestampToLocalTime(timestamp: number): string {
  const date = new Date(timestamp * 1000) // Convert to milliseconds

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jerusalem", // Handles DST changes automatically
    month: "short", // 'short' is correct here
    day: "numeric", // Numeric day of the month
    hour: "2-digit", // 2-digit hour
    minute: "2-digit", // 2-digit minute
    hour12: false // Use 24-hour format
  }

  // Format the date and time
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date)

  // Rearrange the output to match "Oct 23, 13:25"
  const [monthDay, time] = formattedDate.split(", ")
  return `${monthDay}, ${time}`
}

export function getElapsedTime(timestamp) {
    const now = getTimestamp()
    const diffInSeconds = now - timestamp
  
    const days = Math.floor(diffInSeconds / (24 * 3600))
    const hours = Math.floor((diffInSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((diffInSeconds % 3600) / 60)
  
    return `${days}d${hours}h${minutes}m`
}

// Get the current version from manifest
export function getCurrentVersion(): string {
  const ver =  chrome.runtime.getManifest().version;
  console.log(ver)
  return ver;
}

// Convert semver string to a single numeric value for comparison
// e.g. "1.2.3" -> 10230 (100*1 + 10*2 + 3)
export function getSemverValue(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  return (major * 100) + (minor * 10) + patch;
}


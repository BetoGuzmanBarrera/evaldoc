export const passwordRequirements = [
  { id: 'length', label: '8 caracteres o más', test: (value: string) => value.length >= 8 },
  { id: 'uppercase', label: 'Una mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'Una minúscula', test: (value: string) => /[a-z]/.test(value) },
  { id: 'number', label: 'Un número', test: (value: string) => /[0-9]/.test(value) },
  { id: 'symbol', label: 'Un carácter especial', test: (value: string) => [...value].some((character) => "!@#$%^&*()_+-=[]{};':\"\\|<>?,./`~".includes(character)) },
] as const

export function meetsPasswordPolicy(value: string): boolean {
  return passwordRequirements.every((requirement) => requirement.test(value))
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return confirmation.length > 0 && password === confirmation
}

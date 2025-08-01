// Validace hesla pro registraci i reset hesla
export function getPasswordValidations(password) {
  return [
    { label: '1 velké písmeno', valid: /[A-Z]/.test(password) },
    { label: '1 malé písmeno', valid: /[a-z]/.test(password) },
    { label: '1 číslice', valid: /[0-9]/.test(password) },
    { label: '1 speciální znak', valid: /[^A-Za-z0-9]/.test(password) },
    { label: '8 znaků', valid: password.length >= 8 },
    { label: 'Bez mezer', valid: !/\s/.test(password) }
  ];
}

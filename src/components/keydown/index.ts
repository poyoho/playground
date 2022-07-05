export function useKeyboard() {
  document.addEventListener('keydown', logKey)

  function logKey(e: KeyboardEvent) {
    console.log(e)
  }
}

import { useState } from 'react'
import { Button } from './components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <main className="min-h-screen min-w-screen flex flex-col gap-1 items-center justify-center">
        <h1 className="text-gray-500">Count: {count}</h1>
        <Button onClick={() => setCount(count + 1)} className="cursor-pointer">Click me!</Button>
      </main>
    </>
  )
}

export default App

import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <main className="min-h-screen min-w-screen flex flex-col gap-1 items-center justify-center">
        <h1 className="text-gray-500">Count: {count}</h1>
      </main>
    </>
  )
}

export default App

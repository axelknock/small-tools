import './App.css'
import FlakeNixGenerator from './flake-generator'
import JqBuilder from './jq-builder'
import BidirectionalConverter from './json-to-nix'

function App() {
  return (
    <>
    <div className='p-4 max-w-2xl mx-auto'>
      <h1 className="text-2xl text-center">Lucian's tools</h1>
      <FlakeNixGenerator />
      <BidirectionalConverter />
      <JqBuilder />
      </div>             
    </>
  )
}

export default App

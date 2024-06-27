import LobbyScreen from './screens/Lobby'
import './App.css'
import {Routes, Route} from 'react-router-dom'
import Roompage from './screens/Room'

function App() {
  return (
    <>
    <Routes>
      <Route path='/' element={<LobbyScreen></LobbyScreen>}/>
      <Route path="/room/:roomId" element={<Roompage></Roompage>}/>
    </Routes>
    </>
  )
}

export default App

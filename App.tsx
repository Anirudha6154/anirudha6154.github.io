
import React, { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';
import { GameMode, Player } from './types';
import * as FB from './services/firebase';

const App: React.FC = () => {
  const { status, startGame, startLocalGame, createRoom, joinRoom, roomId, players, myId, hostId, leaveRoom } = useGameStore();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<GameMode>(GameMode.CLASSIC);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
      setLoading(true);
      await createRoom(mode, name);
      setLoading(false);
  };

  const handleJoin = async () => {
      if (!joinCode) return;
      setLoading(true);
      const success = await joinRoom(joinCode.toUpperCase(), name);
      if (!success) alert("Room not found or error joining.");
      setLoading(false);
  };
  
  const handleSolo = () => {
      if (!name) return;
      startLocalGame(name, mode);
  };

  if (status === 'PLAYING' || status === 'GAME_OVER') {
    return <GameBoard />;
  }

  if (status === 'WAITING') {
      return (
          <div className="screen" id="waiting">
            <div className="panel">
                <h1>Room: <span style={{color:'var(--yellow)'}}>{roomId}</span></h1>
                <h3 style={{color: '#aaa', textTransform: 'uppercase'}}>{mode} MODE</h3>
                
                <div style={{textAlign:'left', margin:'20px', minWidth: '200px', background: 'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px'}}>
                    {players.map((p: Player) => (
                        <div key={p.id} style={{padding:'5px', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                            {p.name} {p.id === hostId ? '👑' : ''} {p.id === myId ? '(You)' : ''}
                        </div>
                    ))}
                </div>

                {myId === hostId ? (
                    <button id="btn-start" onClick={startGame}>START GAME</button>
                ) : (
                    <p className="animate-pulse">Waiting for host to start...</p>
                )}
                
                <button onClick={leaveRoom} style={{background:'#555', marginTop:'20px', fontSize:'0.9rem'}}>Leave</button>
            </div>
        </div>
      );
  }

  return (
    <div className="screen" id="lobby">
        <div className="panel">
            <h1 style={{color:'var(--yellow)', fontStyle:'italic', fontSize:'3rem', margin:0}}>UNO</h1>
            <h2 style={{marginTop:0}}>CHAOS COLLECTION</h2>
            
            <input 
              type="text" 
              placeholder="Your Nickname" 
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{border: !name ? '2px solid var(--red)' : 'none'}}
            />
            <br/>
            
            <div style={{background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', margin: '15px 0'}}>
                <label style={{fontWeight:'bold'}}>GAME MODE:</label><br/>
                <select value={mode} onChange={(e) => setMode(e.target.value as GameMode)}>
                    <option value={GameMode.CLASSIC}>Classic (Standard Rules)</option>
                    <option value={GameMode.NO_MERCY}>NO MERCY (Brutal, 0/7 Swaps)</option>
                    <option value={GameMode.FLIP}>FLIP (Light / Dark Side)</option>
                    <option value={GameMode.SPEED}>SPEED (No Turns)</option>
                </select>
            </div>

            {/* SOLO BUTTON - ALWAYS AVAILABLE */}
             <button 
                onClick={handleSolo}
                disabled={!name}
                style={{width: '100%', padding: '15px', fontSize: '1.2rem', background: 'var(--green)', color: 'white'}}
            >
                PLAY SOLO (VS BOTS)
            </button>

            {/* MULTIPLAYER SECTION */}
            <div style={{marginTop: '20px', opacity: FB.isConfigured ? 1 : 0.5, pointerEvents: FB.isConfigured ? 'all' : 'none'}}>
                <div style={{borderTop:'1px solid rgba(255,255,255,0.2)', margin:'15px 0'}}></div>
                
                {!FB.isConfigured && <p style={{color:'var(--orange)', fontSize:'0.8rem'}}>Multiplayer unavailable (Firebase Config Missing)</p>}

                <button 
                    onClick={handleCreate} 
                    disabled={!name || loading || !FB.isConfigured}
                >
                    {loading ? 'Creating...' : 'Create Room'}
                </button>
                
                <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginTop:'10px'}}>
                    <input 
                        type="text" 
                        placeholder="Room Code" 
                        style={{width:'120px'}}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <button 
                        onClick={handleJoin} 
                        disabled={!name || !joinCode || loading || !FB.isConfigured}
                    >
                        Join
                    </button>
                </div>
            </div>
            
        </div>
    </div>
  );
};

export default App;

'use client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIyMjIyMjIyMi0yMjIyLTIyMjItMjIyMi0yMjIyMjIyMjIyMjIiLCJ0ZW5hbnRJZCI6IjExMTExMTExLTExMTEtMTExMS0xMTExLTExMTExMTExMTExMSIsInJvbGUiOiJ0ZWFjaGVyIiwiaWF0IjoxNzgxODUyMzU1LCJleHAiOjE3ODQ0NDQzNTV9._F5JFyBNDVCHqrG5lGEfGkHse7vUF_XZkT2iwpWPGKw";

  function go(role) {
    document.cookie = 'access_token=' + token + '; Path=/; Max-Age=2592000; SameSite=Lax';
    if (role === 'teacher') {
      window.location.href = 'http://100.95.175.17:3001/teacher';
    } else {
      window.location.href = 'http://100.95.175.17:3001/student';
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',color:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:'-apple-system,system-ui,sans-serif'}}>
      <div style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:'16px',padding:'40px',maxWidth:'520px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        <h1 style={{margin:'0 0 6px',fontSize:'26px',background:'linear-gradient(135deg,#7dd3fc,#c084fc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Aidutech Admin</h1>
        <div style={{color:'#94a3b8',marginBottom:'28px',fontSize:'13px'}}>Tenant: IEP Institute - Role: Teacher</div>
        <Row label='Name' val='Abhinav Nehra' />
        <Row label='Phone' val='+91 99999 99999' />
        <Row label='User ID' val='22222222-2222-2222-2222-222222222222' />
        <Row label='Tenant ID' val='11111111-1111-1111-1111-111111111111' />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'24px'}}>
          <button onClick={()=>go('teacher')} style={{background:'linear-gradient(135deg,#7dd3fc,#38bdf8)',color:'#0a0a0a',border:'none',padding:'14px',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Enter Teacher Dashboard</button>
          <button onClick={()=>go('student')} style={{background:'#222',color:'#e2e8f0',border:'1px solid #333',padding:'14px',borderRadius:'8px',fontSize:'14px',fontWeight:500,cursor:'pointer'}}>Enter Student View</button>
        </div>
        <div style={{marginTop:'20px',padding:'12px',background:'#0f0f0f',borderRadius:'8px',fontSize:'12px',color:'#64748b',lineHeight:1.5}}>
          <strong style={{color:'#94a3b8'}}>One-click sign-in.</strong> Click a button above to set your session cookie and enter the dashboard. Session is valid for 30 days.
        </div>
      </div>
    </div>
  );
}

function Row({ label, val }: { label: string; val: string }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid #222',fontSize:'14px',gap:'12px'}}>
      <span style={{color:'#64748b',flexShrink:0}}>{label}</span>
      <span style={{color:'#e2e8f0',fontFamily:'ui-monospace,SF Mono,monospace',fontSize:'12px',textAlign:'right',wordBreak:'break-all'}}>{val}</span>
    </div>
  );
}

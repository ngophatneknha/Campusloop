'use client';

import {useEffect,useRef,useState} from 'react';
import {LockKeyhole,UserRound} from 'lucide-react';
import {api} from '@/lib/client';

type AuthProps={mode:'login'|'register';onDone:()=>Promise<void>;onNavigate:(view:string)=>void};
const errorMessage=(error:unknown)=>error instanceof Error?error.message:'Không thể xử lý. Vui lòng thử lại.';

export default function Auth({mode,onDone,onNavigate}:AuthProps){
  const registering=mode==='register';
  const[email,setEmail]=useState('');
  const[name,setName]=useState('');
  const[password,setPassword]=useState('');
  const[confirmation,setConfirmation]=useState('');
  const[pending,setPending]=useState(false);
  const[error,setError]=useState('');
  const submitting=useRef(false);

  useEffect(()=>{setError('');setPassword('');setConfirmation('')},[mode]);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(submitting.current)return;
    setError('');
    if(registering&&name.trim().length<2){setError('Vui lòng nhập họ tên từ 2 đến 80 ký tự.');return}
    if(registering&&password!==confirmation){setError('Mật khẩu xác nhận chưa khớp.');return}
    submitting.current=true;
    setPending(true);
    try{
      await api(registering?'auth/register':'auth/login','POST',{
        email:email.trim(),password,...(registering?{name:name.trim()}:{})
      });
      await onDone();
    }catch(error:unknown){setError(errorMessage(error))}
    finally{submitting.current=false;setPending(false)}
  }

  return <main className="container page-main auth-page">
    <section className="form-card auth-card">
      <span className="auth-icon"><UserRound size={28}/></span>
      <p className="overline">CAMPUSLOOP · CỘNG ĐỒNG SINH VIÊN</p>
      <h1>{registering?'Tạo tài khoản CampusLoop':'Chào mừng bạn trở lại'}</h1>
      <p className="muted auth-intro">{registering?'Đăng ký để đăng tin, lưu sản phẩm và kết nối với sinh viên khác.':'Đăng nhập để tiếp tục mua, bán, trao đổi và cho tặng.'}</p>
      <form onSubmit={event=>void submit(event)}>
        <fieldset disabled={pending} className="auth-fields">
          {registering&&<label>Họ và tên<input type="text" name="name" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Nhập họ và tên của bạn"/></label>}
          <label>Email<input type="email" name="email" required maxLength={254} autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="Email của bạn"/></label>
          <label>Mật khẩu<input type="password" name="password" required minLength={registering?12:undefined} maxLength={128} autoComplete={registering?'new-password':'current-password'} aria-describedby={registering?'auth-password-hint':undefined} value={password} onChange={event=>setPassword(event.target.value)}/></label>
          {registering&&<><p className="auth-help" id="auth-password-hint">Dùng mật khẩu từ 12 đến 128 ký tự.</p><label>Xác nhận mật khẩu<input type="password" name="confirmation" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)}/></label></>}
          {error&&<p className="error-banner auth-feedback" role="alert">{error}</p>}
          <button type="submit" className="btn primary auth-submit" disabled={pending}>{pending?'Đang xử lý...':registering?'Tạo tài khoản':'Đăng nhập'}</button>
        </fieldset>
      </form>
      <p className="auth-switch">{registering?'Bạn đã có tài khoản?':'Bạn chưa có tài khoản?'} <button type="button" className="text-link" disabled={pending} onClick={()=>onNavigate(registering?'login':'register')}>{registering?'Đăng nhập':'Đăng ký'}</button></p>
      {registering&&<p className="privacy-note">Tạo tài khoản chưa xác minh tư cách sinh viên. Sau khi đăng ký, bạn có thể gửi thẻ sinh viên trong hồ sơ để quản trị viên xét duyệt.</p>}
    </section>
  </main>
}

export {Auth};

export function PasswordSettings(){
  const[currentPassword,setCurrentPassword]=useState('');
  const[password,setPassword]=useState('');
  const[confirmation,setConfirmation]=useState('');
  const[pending,setPending]=useState(false);
  const[error,setError]=useState('');
  const[success,setSuccess]=useState('');
  const submitting=useRef(false);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(submitting.current)return;
    setError('');setSuccess('');
    if(password!==confirmation){setError('Mật khẩu xác nhận chưa khớp.');return}
    submitting.current=true;setPending(true);
    try{
      await api('auth/password','POST',{current_password:currentPassword,password});
      setCurrentPassword('');setPassword('');setConfirmation('');
      setSuccess('Đã đổi mật khẩu.');
    }catch(error:unknown){setError(errorMessage(error))}
    finally{submitting.current=false;setPending(false)}
  }

  return <form className="form-card password-settings" onSubmit={event=>void submit(event)}>
    <h2><LockKeyhole size={22}/>Đổi mật khẩu</h2>
    <p className="muted">Nhập mật khẩu hiện tại và chọn mật khẩu mới từ 12 đến 128 ký tự.</p>
    <fieldset disabled={pending} className="auth-fields">
      <label>Mật khẩu hiện tại<input type="password" required maxLength={128} autoComplete="current-password" value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)}/></label>
      <label>Mật khẩu mới<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)}/></label>
      <label>Xác nhận mật khẩu mới<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)}/></label>
      {error&&<p className="error-banner auth-feedback" role="alert">{error}</p>}
      {success&&<p className="auth-success auth-feedback" role="status">{success}</p>}
      <button type="submit" className="btn primary" disabled={pending}>{pending?'Đang lưu...':'Đổi mật khẩu'}</button>
    </fieldset>
  </form>
}

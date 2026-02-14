const API = "/api";
const $  = (id)=>document.getElementById(id);
let msg;

// ✅ เก็บ token, user และ role แยกชัดเจน
function setAuth(token, user){
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", user?.role || "citizen");   // <— เพิ่มบรรทัดนี้
}

function showError(text){
  console.error(text);
  if (!msg) msg = $("msg");
  msg.textContent = typeof text==="string" ? text : (text.message||"เกิดข้อผิดพลาด");
  // แสดงกล่องข้อความข้อผิดพลาด และเพิ่มคลาส error
  try{ msg.style.display = "block"; msg.className = 'notice error'; }catch(_){ }
}

document.addEventListener("DOMContentLoaded", () => {
  msg = $("msg");
  console.log("Index DOM ready");

  const btnLogin = $("btnLogin");
  const btnRegister = $("btnRegister");

  btnLogin?.addEventListener("click", async () => {
    try{
      const username = $("loginUser").value.trim();
      const password = $("loginPass").value;
      if(!username || !password) return showError("กรอก Username/Password ก่อน");

      const res  = await fetch(API+"/auth/login", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ username, password })
      });

      const text = await res.text();
      let data; try{ data = JSON.parse(text); }
      catch { throw new Error("Login: server not JSON → "+text.slice(0,120)); }

      if(!res.ok) {
        // If server returned validation errors (express-validator) they come as { errors: [{ msg, param, ... }] }
        const serverMsg = data?.error || (Array.isArray(data?.errors) ? data.errors.map(e=>e.msg).join('; ') : null);
        throw (serverMsg || "login failed");
      }

      // ✅ data.user ต้องมี { id, name, role } (ฝั่ง API ส่งมาอยู่แล้ว)
      setAuth(data.token, data.user);

      location.href = "/book.html";
    }catch(e){ showError(e); }
  });

  btnRegister?.addEventListener("click", async () => {
    try{
      const payload = {
        username: $("regUser").value.trim(),
        password: $("regPass").value,
        fullName: $("regName").value.trim(),
        phone: $("regPhone").value.trim() || null,
        email: $("regEmail").value.trim() || null
      };
      if(!payload.username || !payload.password || !payload.fullName)
        return showError("กรอก Username/Password/ชื่อ ให้ครบ");

      const res  = await fetch(API+"/auth/register", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data; try{ data = JSON.parse(text); }
      catch { throw new Error("Register: server not JSON → "+text.slice(0,120)); }

      if(!res.ok) {
        const serverMsg = data?.error || (Array.isArray(data?.errors) ? data.errors.map(e=>e.msg).join('; ') : null);
        throw (serverMsg || "register failed");
      }
      // If server returned token and user, automatically set auth and redirect to booking
      if (data && data.token && data.user) {
        setAuth(data.token, data.user);
        location.href = '/book.html';
        return;
      }

      // แสดงข้อความความสำเร็จ และเคลียร์ฟอร์มเล็กน้อย (fallback)
      msg.textContent = data?.message || "ลงทะเบียนสำเร็จ! กรุณา Login";
      try{
        msg.style.display = "block";
        msg.className = 'notice success';
      }catch(_){ }
      $("regPass").value = "";
      setTimeout(()=>{ try{ msg.style.display = 'none'; }catch(_){} }, 4000);
    }catch(e){ showError(e); }
  });
});

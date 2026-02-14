(function () {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  const navAdmin = document.getElementById('navAdmin');
  const logout = document.getElementById('logout');

  // โชว์เมนูแอดมินเฉพาะ role=admin
  if (navAdmin) {
    if (role === 'admin') navAdmin.style.display = 'inline-block';
    else navAdmin.style.display = 'none';
  }

  // ปุ่มออกจากระบบ
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      location.href = '/index.html';
    });
  }

  // ถ้าอยู่หน้า admin.html แต่ไม่ใช่ admin ให้เด้งออก
  if (location.pathname.endsWith('/admin.html')) {
    if (!token || role !== 'admin') {
      location.href = '/index.html';
    }
  }

  // Add booking count badge to the 'คิวของฉัน' nav link
  (function addQueueBadge(){
    try{
      const link = document.querySelector('.nav a[href="/status.html"]');
      if (!link) return;

      // create badge element
      let badge = link.querySelector('.nav-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.style.display = 'inline-block';
        badge.style.marginLeft = '8px';
        badge.style.background = '#0a632b';
        badge.style.color = '#fff';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '999px';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = '700';
        badge.style.minWidth = '20px';
        badge.style.textAlign = 'center';
        badge.style.lineHeight = '18px';
        badge.textContent = '0';
        link.appendChild(badge);
      }

      async function updateBadge(){
        try{
          if (!token) { badge.style.display = 'none'; return; }
          // fetch server queues
          let server = [];
          try{
            const rr = await fetch('/api/my/queues', { headers: { Authorization: 'Bearer ' + token } });
            if (rr.ok) server = await rr.json();
          }catch(_){ server = []; }

          // load local persisted queues
          let localArr = [];
          try{ localArr = JSON.parse(localStorage.getItem('localQueues') || '[]') || []; }catch(_){ localArr = []; }

          // Build a set of unique keys to avoid double-counting
          const keys = new Set();
          const makeKey = (q) => {
            try{ if (q.QueueID) return 'id:' + String(q.QueueID); }catch(_){}
            const d = (q.BookingDate||'').slice(0,10);
            return `k:${d}|${q.SlotTime||''}|${q.CenterName||q.Center||''}|${q.ServiceName||q.Service||''}`;
          };

          for (const s of (Array.isArray(server)?server:[])) keys.add(makeKey(s));
          for (const l of (Array.isArray(localArr)?localArr:[])) keys.add(makeKey(l));

          const count = keys.size;
          badge.textContent = String(count);
          badge.style.display = count>0 ? 'inline-block' : 'none';
        }catch(e){ /* ignore */ }
      }

      // Update now and subscribe to storage changes (so booking page can update badge)
      updateBadge();
      window.addEventListener('storage', (e)=>{ if (e.key === 'localQueues' || e.key === 'token') updateBadge(); });
      // also update on focus (user may have changed in other tab)
      window.addEventListener('focus', updateBadge);

      // expose for same-tab updates (storage event doesn't fire in same tab)
      try{ window.updateQueueBadge = updateBadge; }catch(_){}
    }catch(e){ /* ignore */ }
  })();
})();

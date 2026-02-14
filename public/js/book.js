// public/js/book.js
(function () {
  const API = "/api";

  const $ = (id) => document.getElementById(id);
  const els = {
    logout: $("logout"),
    center: $("center"),
    service: $("service"),
    date: $("date"),
    btnLoad: $("btnLoad"),
    slotBody: $("slotBody"),
    msg: $("msg"),
  };

  // Quick fallback data for "ทางด่วน" testing when backend has no centers/services
  const FALLBACK_CENTERS = [
    { CenterID: 999, CenterName: "ศูนย์ทดสอบ กรุงเทพ", Province: "กรุงเทพฯ" },
    { CenterID: 998, CenterName: "ศูนย์ทดสอบ ชลบุรี", Province: "ชลบุรี" },
  ];
  const FALLBACK_SERVICES = {
    999: [
      { ServiceID: 9001, ServiceName: "สอบปฏิบัติ (30 นาที)", DurationMin: 30 },
      { ServiceID: 9002, ServiceName: "สอบทฤษฎี (60 นาที)", DurationMin: 60 },
    ],
    998: [
      { ServiceID: 9801, ServiceName: "สอบปากคำ (60 นาที)", DurationMin: 60 },
    ],
  };

  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/index.html";
    return;
  }

  // small local debug capture so logs survive navigation
  function appendDebugLog(tag, obj) {
    try {
      const raw = localStorage.getItem('debugLogs') || '[]';
      const arr = JSON.parse(raw || '[]');
      arr.push({ ts: Date.now(), tag: String(tag), data: obj });
      // keep only last 200 entries
      if (arr.length > 200) arr.splice(0, arr.length - 200);
      localStorage.setItem('debugLogs', JSON.stringify(arr));
    } catch (_) { /* ignore */ }
  }

  function showMessage(text, type = "") {
    if (!els.msg) return;
    els.msg.textContent = text || "";
    try {
      els.msg.style.display = text ? "block" : "none";
      els.msg.className = text ? `notice ${type}`.trim() : "";
    } catch (e) {}
  }

  // Show a small floating button top-right to jump to "คิวของฉัน"
  function showGoToMyQueues() {
    if (document.getElementById('goto-my-queues-btn')) return;
    const btn = document.createElement('a');
    btn.id = 'goto-my-queues-btn';
    btn.href = '/status.html';
    btn.textContent = 'ไปที่ คิวของฉัน';
    btn.style.position = 'fixed';
    btn.style.top = '16px';
    btn.style.right = '16px';
    btn.style.background = '#0b63df';
    btn.style.color = '#fff';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '8px';
    btn.style.zIndex = '9999';
    btn.style.boxShadow = '0 6px 18px rgba(12,12,20,0.12)';
    document.body.appendChild(btn);
  }

  els.logout?.addEventListener("click", (e) => {
    e?.preventDefault();
    localStorage.clear();
    location.href = "/index.html";
  });

  async function fetchCenters() {
    try {
      const r = await fetch(API + "/centers");
      if (!r.ok) throw new Error("โหลดศูนย์บริการไม่สำเร็จ");
      const arr = await r.json();

      if (!Array.isArray(arr) || arr.length === 0) {
        // Use fallback centers for quick testing
        arr = FALLBACK_CENTERS;
        showMessage('(ทดสอบ) โหลดศูนย์จาก fallback สำหรับเดโม', '');
      }

      els.center.innerHTML = arr
        .map((c) => `<option value="${c.CenterID}">${c.CenterName} (${c.Province || ""})</option>`)
        .join("");
      if (els.btnLoad) els.btnLoad.disabled = false;
      showMessage("");
      await fetchServices();
    } catch (e) {
      els.center.innerHTML = `<option value="">-- ไม่สามารถโหลดศูนย์ได้ --</option>`;
      els.service.innerHTML = "";
      showMessage(e.message || "โหลดศูนย์บริการล้มเหลว", "error");
      if (els.btnLoad) els.btnLoad.disabled = true;
    }
  }

  async function fetchServices() {
    const cid = els.center?.value;
    if (!cid) {
      els.service.innerHTML = "";
      return;
    }
    try{
      const r = await fetch(API + `/services?centerId=${cid}`);
      if (!r.ok) throw new Error("โหลดบริการไม่สำเร็จ");
      let arr = await r.json();
      if (!Array.isArray(arr) || arr.length === 0) {
        // fallback services for testing if backend returned none
        const key = Number(cid);
        arr = FALLBACK_SERVICES[key] || [];
        if(arr.length > 0) showMessage('(ทดสอบ) โหลดบริการจาก fallback', '');
      }
      els.service.innerHTML = arr
        .map((s) => `<option value="${s.ServiceID}" data-dur="${s.DurationMin}">${s.ServiceName} (${s.DurationMin} นาที)</option>`)
        .join("");
    }catch(e){
      // on error, try fallback
      const key = Number(cid);
      const arr = FALLBACK_SERVICES[key] || [];
      if(arr.length>0){
        els.service.innerHTML = arr
          .map((s) => `<option value="${s.ServiceID}" data-dur="${s.DurationMin}">${s.ServiceName} (${s.DurationMin} นาที)</option>`)
          .join("");
        showMessage('(ทดสอบ) โหลดบริการจาก fallback (หลัง error)', '');
      } else {
        els.service.innerHTML = "";
        throw e;
      }
    }
  }

  els.center?.addEventListener("change", () => {
    fetchServices().catch((e) => showMessage(e.message, "error"));
  });

  els.btnLoad?.addEventListener("click", async () => {
    try {
      els.slotBody.innerHTML = "";
      showMessage("");
      const params = new URLSearchParams({
        centerId: els.center.value,
        serviceId: els.service.value,
        date: els.date.value,
      });

      // Fetch availability and user's current bookings in parallel
      const availPromise = fetch(API + `/availability?${params.toString()}`);
      const myQueuesPromise = fetch(API + `/my/queues`, { headers: { Authorization: "Bearer " + token } }).catch(() => null);

      const [r, mr] = await Promise.all([availPromise, myQueuesPromise]);
      const slots = await r.json();
      if (!Array.isArray(slots)) throw new Error(slots.error || "โหลดรอบว่างไม่สำเร็จ");

      // Build a set of user's booked keys so we can mark slots the user already booked
      const bookedById = new Set();
      const bookedByName = new Set();
      if (mr && mr.ok) {
        try {
          const myData = await mr.json();
          if (Array.isArray(myData)) {
            myData.forEach((q) => {
              const d = (q.BookingDate || '').slice(0,10);
              const t = q.SlotTime || '';
              if (q.CenterID && q.ServiceID) bookedById.add(`${d}|${t}|${q.CenterID}|${q.ServiceID}`);
              bookedByName.add(`${d}|${t}|${q.CenterName || ''}|${q.ServiceName || ''}`);
            });
          }
        } catch (_) {}
      }

      const centerVal = els.center.value;
      const serviceVal = els.service.value;
      const centerText = els.center?.options[els.center.selectedIndex]?.textContent || '';
      const serviceText = els.service?.options[els.service.selectedIndex]?.textContent || '';

      els.slotBody.innerHTML = slots
        .map((s) => {
          const dateKey = `${els.date.value}|${s.time}|${centerVal}|${serviceVal}`;
          const nameKey = `${els.date.value}|${s.time}|${centerText}|${serviceText}`;
          const userAlready = bookedById.has(dateKey) || bookedByName.has(nameKey);
          return `
        <tr>
          <td>${s.time}</td>
          <td>${s.booked}/${s.capacity}</td>
          <td>${s.remaining}</td>
          <td>${
            userAlready ? `<button disabled style="background:#d1ffd6;color:#0a632b;border:1px solid #9ee39a">คุณจองแล้ว</button>` : (s.remaining > 0 ? `<button data-time="${s.time}" class="book">จอง</button>` : "-")
          }</td>
        </tr>`;
        })
        .join("");

      document.querySelectorAll("button.book").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            const payload = {
              centerId: parseInt(els.center.value, 10),
              serviceId: parseInt(els.service.value, 10),
              bookingDate: els.date.value,
              slotTime: btn.getAttribute("data-time"),
            };

            // Client-side validation
            if (!payload.centerId || !payload.serviceId || !payload.bookingDate || !payload.slotTime) {
              showMessage("กรุณาเลือกศูนย์/บริการ/วันที่และช่วงเวลาให้ครบก่อนจอง", "error");
              return;
            }

            const rr = await fetch(API + "/queues", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
              },
              body: JSON.stringify(payload),
            });

            const text = await rr.text();
            let data;
            try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
            console.log('Booking response', rr.status, data);

            if (!rr.ok) {
              const errMsg = data?.error || (data?.raw ? String(data.raw).slice(0, 500) : 'จองไม่สำเร็จ');
              // Show server error to the user. Do NOT save a local "successful" booking when the server
              // returned an error (previous behaviour saved a local summary on RefCode errors and redirected,
              // which made the UI show bookings that were never persisted in the DB).
              showMessage(errMsg, "error");
              try { appendDebugLog('book.serverError', { status: rr.status, body: data, msg: errMsg }); } catch (_) {}
              return;
            }

            // success - store a small summary so status page can show it immediately
            try {
              const centerText = els.center?.options[els.center.selectedIndex]?.textContent || '';
              const serviceText = els.service?.options[els.service.selectedIndex]?.textContent || '';
              // server may return TicketNo or RefCode or other key; pick first available
              const ticket = data?.TicketNo || data?.RefCode || data?.Ref || data?.Code || null;
              const summary = {
                BookingDate: payload.bookingDate,
                SlotTime: payload.slotTime,
                CenterName: centerText,
                ServiceName: serviceText,
                QueueID: data?.QueueID ?? null,
                TicketNo: ticket ?? null,
              };
              // persist summary and add to local queued map so status page can show ticket persistently
              try {
                localStorage.setItem('justBooked', JSON.stringify(summary));
                console.debug('[book.js] set justBooked ->', summary);
                try{ appendDebugLog('book.setJustBooked', summary); }catch(_){ }
                const existing = JSON.parse(localStorage.getItem('localQueues') || '[]');
                // push summary if not already present (match by BookingDate+SlotTime+CenterName+ServiceName)
                const key = `${summary.BookingDate}|${summary.SlotTime}|${summary.CenterName}|${summary.ServiceName}`;
                if (!existing.some(e => e._key === key)) {
                  existing.push(Object.assign({}, summary, { _key: key, _ts: Date.now() }));
                  localStorage.setItem('localQueues', JSON.stringify(existing));
                  console.debug('[book.js] pushed to localQueues ->', key, existing);
                  try{ appendDebugLog('book.pushLocalQueues', { key, existing }); }catch(_){ }
                  try{ if (window.updateQueueBadge) window.updateQueueBadge(); }catch(_){ }
                }
              } catch(_) {}
              // keep the modal UI and show ticket modal so user sees booking + payment options
              try { showTicketModal(summary); } catch (_) { location.href = '/status.html'; }
              try{ appendDebugLog('book.showModalOrRedirect', summary); }catch(_){ }
            } catch (_) { location.href = '/status.html'; }
          } catch (e) {
            showMessage(e.message || 'เกิดข้อผิดพลาด', 'error');
          }
        });
      });
    } catch (e) {
      showMessage(e.message || "เกิดข้อผิดพลาด", 'error');
    }
  });

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().slice(0, 10);
    if (els.date) els.date.value = today;
    fetchCenters().catch((e) => showMessage(e.message, 'error'));
  });

  // --- Ticket modal helper ---
  function showTicketModal(summary) {
    // create modal elements
    let modal = document.getElementById('ticketModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'ticketModal';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';

    const box = document.createElement('div');
    box.style.width = '480px';
    box.style.maxWidth = '92%';
    box.style.background = '#fff';
    // payment controls are added into the actions block below

    const ticketWrap = document.createElement('div');
    ticketWrap.style.display = 'flex';
    ticketWrap.style.alignItems = 'center';
    ticketWrap.style.gap = '8px';
    ticketWrap.style.marginBottom = '12px';

    const ticketEl = document.createElement('div');
    ticketEl.id = 'modalTicketNo';
    ticketEl.style.padding = '10px 12px';
    ticketEl.style.border = '1px solid #e6e6e6';
    ticketEl.style.borderRadius = '6px';
    ticketEl.style.background = '#fbfbfb';
    ticketEl.style.fontFamily = 'monospace';
    ticketEl.style.letterSpacing = '0.5px';
    ticketEl.style.color = '#0a632b';
    ticketEl.textContent = summary.TicketNo || 'กำลังสร้างเลขบัตร...';
    ticketWrap.appendChild(ticketEl);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'คัดลอก';
    copyBtn.className = 'btn-inline';
    copyBtn.addEventListener('click', async () => {
      try {
        const t = ticketEl.textContent.trim();
        if (!t) return;
        try { await navigator.clipboard.writeText(t); } catch (_) { document.execCommand('copy'); }
        copyBtn.textContent = 'คัดลอกแล้ว';
        setTimeout(() => (copyBtn.textContent = 'คัดลอก'), 2000);
      } catch (_) {}
    });
    ticketWrap.appendChild(copyBtn);

    box.appendChild(ticketWrap);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.justifyContent = 'flex-end';

    const gotoBtn = document.createElement('button');
    gotoBtn.textContent = 'ไปที่คิวของฉัน';
    gotoBtn.className = 'btn-inline';
    gotoBtn.addEventListener('click', () => {
      try { localStorage.setItem('justBooked', JSON.stringify(summary)); } catch(_){}
      // small delay to ensure storage is flushed before navigation
      setTimeout(() => { location.href = '/status.html'; }, 120);
    });
    actions.appendChild(gotoBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'ปิด';
    closeBtn.className = 'btn-inline';
    closeBtn.addEventListener('click', () => { modal.remove(); });
    actions.appendChild(closeBtn);

    box.appendChild(actions);
    modal.appendChild(box);
    document.body.appendChild(modal);

    // If ticket not present, poll user's queues to find it and update the modal
    if (!summary.TicketNo) {
      let tries = 0;
      const max = 12;
      const iv = setInterval(async () => {
        tries++;
        try {
          const rr = await fetch(API + '/my/queues', { headers: { Authorization: 'Bearer ' + token } });
          if (!rr.ok) return;
          const arr = await rr.json();
          if (!Array.isArray(arr)) return;
          const found = arr.find((q) => {
            if (summary.QueueID && q.QueueID && String(q.QueueID) === String(summary.QueueID)) return true;
            return (
              (q.BookingDate || '').slice(0,10) === (summary.BookingDate || '').slice(0,10) &&
              (q.SlotTime || '') === (summary.SlotTime || '') &&
              (q.CenterName || '') === (summary.CenterName || '') &&
              (q.ServiceName || '') === (summary.ServiceName || '')
            );
          });
          if (found) {
            const ticket = found.TicketNo || found.RefCode || found.Ref || found.Code || found.Ticket || found.Number || null;
            if (ticket) {
              ticketEl.textContent = ticket;
              try { localStorage.setItem('justBooked', JSON.stringify(Object.assign({}, summary, { TicketNo: ticket }))); } catch(_){}
              // also update localQueues persisted map so table shows ticket persistently
              try {
                const key = `${summary.BookingDate}|${summary.SlotTime}|${summary.CenterName}|${summary.ServiceName}`;
                const arr = JSON.parse(localStorage.getItem('localQueues') || '[]');
                let changed = false;
                for (const it of arr) {
                  if (it._key === key) {
                    it.TicketNo = ticket; it._ts = Date.now(); changed = true; break;
                  }
                }
                if (!changed) {
                  arr.push(Object.assign({}, summary, { TicketNo: ticket, _key: key, _ts: Date.now() }));
                }
                localStorage.setItem('localQueues', JSON.stringify(arr));
                try{ if (window.updateQueueBadge) window.updateQueueBadge(); }catch(_){ }
              } catch(_){}
              clearInterval(iv);
            }
          }
        } catch (_) {}
        if (tries >= max) clearInterval(iv);
      }, 3000);
    }
  }
})();

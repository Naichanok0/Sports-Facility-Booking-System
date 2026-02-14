// public/js/admin_payments.js
(function () {
  const API = "/api";
  const $ = (id) => document.getElementById(id);
  const els = {
    logout: $("logout"),
    filterCenter: $("filterCenter"),
    filterDate: $("filterDate"),
    btnLoad: $("btnLoad"),
    paymentsBody: $("paymentsBody"),
    msg: $("msg")
  };

  const token = localStorage.getItem("token");
  if (!token) { location.href = "/index.html"; return; }

  els.logout.addEventListener("click", (e) => { e.preventDefault(); localStorage.clear(); location.href = "/index.html"; });

  async function api(path, opts = {}) {
    const r = await fetch(API + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        ...(opts.headers || {}),
      },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || JSON.stringify(data) || "Request failed");
    return data;
  }

  async function loadCentersForFilter() {
    try {
      const list = await api("/admin/centers");
      els.filterCenter.innerHTML = `<option value="">ทุกศูนย์</option>` + list.map(c => `<option value="${c.CenterID}">${c.CenterName}</option>`).join("");
    } catch (e) { els.msg.textContent = e.message; }
  }

  // detect cancelled state (some rows may include Status or IsActive/IsCanceled flags)
  function isCanceled(row) {
    return row.IsCanceled === 1 || row.IsCanceled === true || String(row.Status).toLowerCase() === 'cancelled' || String(row.Status).toLowerCase() === 'cancel' || String(row.Status).toLowerCase() === 'canceled';
  }

  async function loadPayments(dateOverride) {
    try {
      els.msg.textContent = '';
      const date = dateOverride ?? els.filterDate.value;
      // if no date and not explicitly asking for 'all', require date
      if (!date) { els.msg.textContent = "กรุณาเลือกวันที่"; return; }
      const cid = els.filterCenter.value || "";
      const url = (String(date).toLowerCase() === 'all')
        ? `/admin/payments?date=all${cid ? `&centerId=${cid}` : ""}`
        : `/admin/payments?date=${encodeURIComponent(date)}${cid ? `&centerId=${cid}` : ""}`;
      const list = await api(url);

      if (!list || list.length === 0) {
        els.paymentsBody.innerHTML = `<tr><td colspan=9 class="muted">ไม่พบรายการ</td></tr>`;
        return;
      }

      els.paymentsBody.innerHTML = list.map(row => {
  const canceled = isCanceled(row);
  const paid = !!row.RefCode && !canceled;
  const statusHtml = canceled ? `<span class="canceled-badge">ยกเลิกรายการ</span>` : (paid ? `<span class="paid-badge">ชำระเสร็จแล้ว</span>` : `<span class="pending-badge">รอการชำระ</span>`);
        const refCell = paid ? `<div class="muted">${row.RefCode}</div>` : `<input class="ref-input" placeholder="ref code" />`;
        const actions = canceled ? '' : (paid ? '' : `<button class="btn save-ref">บันทึก</button> <button class="btn cancel-ref">ยกเลิก</button>`);

        return `
        <tr data-id="${row.QueueID}">
          <td>${row.BookingDate}</td>
          <td>${row.SlotTime}</td>
          <td>${row.CenterName || '-'}</td>
          <td>${row.ServiceName || '-'}</td>
          <td>${row.FullName || row.Username || '-'}</td>
          <td>${row.TicketNo || '-'}</td>
          <td>${statusHtml}</td>
          <td>${refCell}</td>
          <td>${actions}</td>
        </tr>
      `;
      }).join("");

      // bind save buttons
      document.querySelectorAll("button.save-ref").forEach(btn => {
        btn.onclick = async (ev) => {
          const tr = ev.target.closest('tr');
          const id = tr.dataset.id;
          const input = tr.querySelector('input.ref-input');
          const ref = input && input.value.trim();
          if (!ref) { els.msg.textContent = 'กรุณากรอก Ref code'; return; }
          try {
            await api('/admin/payments', { method: 'POST', body: JSON.stringify({ QueueID: id, RefCode: ref }) });
            els.msg.textContent = 'บันทึกเรียบร้อย';
            loadPayments();
          } catch (e) { els.msg.textContent = e.message; }
        };
      });

      // bind cancel buttons
      document.querySelectorAll("button.cancel-ref").forEach(btn => {
        btn.onclick = async (ev) => {
          if (!confirm('ยืนยันการยกเลิกรายการนี้?')) return;
          const tr = ev.target.closest('tr');
          const id = tr.dataset.id;
          try {
            await api('/admin/payments/cancel', { method: 'POST', body: JSON.stringify({ QueueID: id }) });
            els.msg.textContent = 'ยกเลิกรายการเรียบร้อย';
            loadPayments();
          } catch (e) { els.msg.textContent = e.message; }
        };
      });

    } catch (e) { els.msg.textContent = e.message; }
  }

  (function init(){
    const today = new Date().toISOString().slice(0,10);
    els.filterDate.value = today;
    loadCentersForFilter();
    els.btnLoad.addEventListener('click', () => loadPayments());
    const btnAll = document.getElementById('btnLoadAll');
    if (btnAll) btnAll.addEventListener('click', () => loadPayments('all'));
  })();
})();

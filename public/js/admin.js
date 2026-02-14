// public/js/admin.js
(function () {
  const API = "/api";
  const $ = (id) => document.getElementById(id);
  const els = {
    logout: $("logout"),
    filterCenter: $("filterCenter"),
    filterDate: $("filterDate"),
    btnLoadSummary: $("btnLoadSummary"),
    summaryArea: $("summaryArea"),
    msg: $("msg"),

    // centers
    cCode: $("cCode"), cName: $("cName"), cProv: $("cProv"), cActive: $("cActive"),
    btnReloadCenters: $("btnReloadCenters"), btnAddCenter: $("btnAddCenter"),
    centersBody: $("centersBody"),

    // services
    sCenterId: $("sCenterId"), sName: $("sName"),
    sDur: $("sDur"), sCap: $("sCap"), sFee: $("sFee"),
    sPay: $("sPay"), sActive: $("sActive"),
    btnReloadServices: $("btnReloadServices"), btnAddService: $("btnAddService"),
    servicesBody: $("servicesBody"),
  };

  const token = localStorage.getItem("token");
  if (!token) { location.href = "/index.html"; return; }

  els.logout.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    location.href = "/index.html";
  });

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
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  /* ====== โหลด Centers (เพื่อเลือก filter + ตาราง) ====== */
  async function loadCentersForFilter() {
    const list = await api("/admin/centers");
    els.filterCenter.innerHTML = `<option value="">ทุกศูนย์</option>` +
      list.map(c => `<option value="${c.CenterID}">${c.CenterName}</option>`).join("");
  }

  async function reloadCentersTable() {
    const list = await api("/admin/centers");
    els.centersBody.innerHTML = list.map(c => `
      <tr>
        <td>${c.CenterID}</td>
        <td>${c.CenterCode}</td>
        <td>${c.CenterName}</td>
        <td>${c.Province ?? "-"}</td>
        <td>${c.IsActive ? "✅" : "❌"}</td>
        <td>
          <button class="softdel-center" data-id="${c.CenterID}">ปิดใช้งาน</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll("button.softdel-center").forEach(btn => {
      btn.onclick = async () => {
        try {
          await api(`/admin/centers/${btn.dataset.id}`, { method: "DELETE" });
          reloadCentersTable();
        } catch (e) { els.msg.textContent = e.message; }
      };
    });
  }

  /* ====== เพิ่ม Center ====== */
  els.btnAddCenter.onclick = async () => {
    try {
      await api("/admin/centers", {
        method: "POST",
        body: JSON.stringify({
          CenterCode: els.cCode.value.trim(),
          CenterName: els.cName.value.trim(),
          Province: els.cProv.value.trim() || null,
          IsActive: els.cActive.checked ? 1 : 0
        }),
      });
      els.cCode.value = els.cName.value = els.cProv.value = "";
      els.cActive.checked = true;
      await loadCentersForFilter();
      await reloadCentersTable();
      els.msg.textContent = "เพิ่มศูนย์สำเร็จ";
    } catch (e) { els.msg.textContent = e.message; }
  };

  els.btnReloadCenters.onclick = reloadCentersTable;

  /* ====== Services table ====== */
  async function reloadServicesTable() {
    const list = await api("/admin/services");
    els.servicesBody.innerHTML = list.map(s => `
      <tr>
        <td>${s.ServiceID}</td>
        <td>[${s.CenterID}] ${s.CenterName}</td>
        <td>${s.ServiceName}</td>
        <td>${s.DurationMin}</td>
        <td>${s.SlotCapacity}</td>
        <td>${s.Fee}</td>
        <td>${s.RequiresPayment ? "✅" : "❌"}</td>
        <td>${s.IsActive ? "✅" : "❌"}</td>
        <td>
          <button class="softdel-service" data-id="${s.ServiceID}">ปิดใช้งาน</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll("button.softdel-service").forEach(btn => {
      btn.onclick = async () => {
        try {
          await api(`/admin/services/${btn.dataset.id}`, { method: "DELETE" });
          reloadServicesTable();
        } catch (e) { els.msg.textContent = e.message; }
      };
    });
  }

  els.btnAddService.onclick = async () => {
    try {
      await api("/admin/services", {
        method: "POST",
        body: JSON.stringify({
          CenterID: parseInt(els.sCenterId.value),
          ServiceName: els.sName.value.trim(),
          DurationMin: parseInt(els.sDur.value),
          SlotCapacity: parseInt(els.sCap.value),
          Fee: parseFloat(els.sFee.value || "0"),
          RequiresPayment: els.sPay.checked ? 1 : 0,
          IsActive: els.sActive.checked ? 1 : 0
        }),
      });
      els.sCenterId.value = els.sName.value = els.sDur.value = els.sCap.value = els.sFee.value = "";
      els.sPay.checked = els.sActive.checked = false;
      await reloadServicesTable();
      els.msg.textContent = "เพิ่มบริการสำเร็จ";
    } catch (e) { els.msg.textContent = e.message; }
  };

  els.btnReloadServices.onclick = reloadServicesTable;

  /* ====== Summary ====== */
  els.btnLoadSummary.onclick = async () => {
    try {
      const date = els.filterDate.value;
      if (!date) { els.msg.textContent = "กรุณาเลือกวันที่"; return; }
      const cid = els.filterCenter.value || "";
      const data = await api(`/admin/summary?date=${encodeURIComponent(date)}${cid ? `&centerId=${cid}` : ""}`);

      if (!data.summaries || data.summaries.length === 0) {
        els.summaryArea.innerHTML = `<p class="muted">ไม่พบข้อมูลบริการที่ Active</p>`;
        return;
      }

      els.summaryArea.innerHTML = data.summaries.map(s => `
        <div class="subcard">
          <div class="row space">
            <h3>${s.centerName} — ${s.serviceName} (Dur ${s.durationMin}m, Cap ${s.slotCapacity})</h3>
            <small>${data.date}</small>
          </div>
          <table>
            <thead><tr><th>เวลา</th><th>จองแล้ว</th><th>คงเหลือ</th></tr></thead>
            <tbody>
              ${s.rows.map(r => `
                <tr>
                  <td>${r.time}</td>
                  <td>${r.booked}/${r.capacity}</td>
                  <td>${r.remaining}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `).join("");
    } catch (e) { els.msg.textContent = e.message; }
  };

  /* ====== init ====== */
  (function init() {
    const today = new Date().toISOString().slice(0,10);
    els.filterDate.value = today;
    loadCentersForFilter();
    reloadCentersTable();
    reloadServicesTable();
  })();
})();

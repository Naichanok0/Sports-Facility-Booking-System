// public/js/status.js
(function () {
  const API = "/api";
  const $ = (id) => document.getElementById(id);

  const els = {
    logout: $("logout"),
    myBody: $("myBody"),
    msg: $("msg"),
  };

  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/index.html";
    return;
  }

  els.logout.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    location.href = "/index.html";
  });

  async function loadMyQueues() {
    try{
      console.debug('[status.js] loadMyQueues start, justBooked=', localStorage.getItem('justBooked'), 'localQueues=', localStorage.getItem('localQueues'));
      // if any persisted debug logs exist, print them (they survive navigation)
      try{
        const dbg = JSON.parse(localStorage.getItem('debugLogs') || '[]');
        if (Array.isArray(dbg) && dbg.length>0) {
          console.groupCollapsed('[debugLogs] persisted logs ('+dbg.length+')');
          dbg.slice(-50).forEach((d)=>{ try{ console.log(new Date(d.ts).toISOString(), d.tag, d.data); }catch(_){ console.log(d); } });
          console.groupEnd();
          // also render a visible debug panel on the page so logs aren't lost on navigation
          try{
            let panel = document.getElementById('debugLogsPanel');
            if (!panel) {
              panel = document.createElement('div');
              panel.id = 'debugLogsPanel';
              panel.style.marginTop = '12px';
              panel.style.padding = '10px';
              panel.style.border = '1px dashed #c9d3e6';
              panel.style.background = '#fbfdff';
              panel.style.maxHeight = '220px';
              panel.style.overflow = 'auto';
              panel.style.fontSize = '13px';
              panel.style.borderRadius = '8px';
              const heading = document.createElement('div');
              heading.style.fontWeight = '700';
              heading.style.marginBottom = '8px';
              heading.textContent = 'Debug logs (persisted)';
              panel.appendChild(heading);
              const clearBtn = document.createElement('button');
              clearBtn.textContent = 'ล้าง debug logs';
              clearBtn.className = 'btn-inline';
              clearBtn.style.marginBottom = '8px';
              clearBtn.addEventListener('click', () => { localStorage.removeItem('debugLogs'); panel.remove(); });
              panel.appendChild(clearBtn);
              const list = document.createElement('div');
              list.id = 'debugLogsList';
              panel.appendChild(list);
              const container = document.querySelector('.card') || document.body;
              container.insertBefore(panel, container.firstChild?.nextSibling || container.firstChild);
            }
            const list = document.getElementById('debugLogsList');
            if (list) {
              list.innerHTML = '';
              dbg.slice(-50).reverse().forEach((d)=>{
                const row = document.createElement('div');
                row.style.padding = '6px 0';
                row.style.borderBottom = '1px solid #eef3fb';
                const time = document.createElement('div'); time.style.fontSize='12px'; time.style.color='#556'; time.textContent = new Date(d.ts).toLocaleString();
                const tag = document.createElement('div'); tag.style.fontWeight='700'; tag.textContent = d.tag;
                const data = document.createElement('pre'); data.style.margin='6px 0 0'; data.style.whiteSpace='pre-wrap'; data.style.fontSize='13px'; data.textContent = typeof d.data === 'string' ? d.data : JSON.stringify(d.data, null, 2);
                row.appendChild(time); row.appendChild(tag); row.appendChild(data);
                list.appendChild(row);
              });
            }
          }catch(_){ }
        }
      }catch(_){ }
    }catch(_){ }
    // Only clear previous transient messages if they are not marked persistent
    try {
      if (!els.msg.dataset.persistent) {
        els.msg.textContent = "";
        els.msg.style.display = "none";
      }
    } catch (_) {}

    // Clean up localQueues entries that have been satisfied (server now provides ticket)
    try {
      const localRaw2 = localStorage.getItem('localQueues');
      if (localRaw2) {
        let localArr2 = JSON.parse(localRaw2) || [];
        localArr2 = localArr2.filter((l) => {
          const found = data.find((q) => {
            if (l.QueueID && q.QueueID && String(l.QueueID) === String(q.QueueID)) return true;
            return (
              (q.BookingDate || '').slice(0,10) === (l.BookingDate || '').slice(0,10) &&
              (q.SlotTime || '') === (l.SlotTime || '') &&
              (q.CenterName || '') === (l.CenterName || '') &&
              (q.ServiceName || '') === (l.ServiceName || '')
            );
          });
          if (!found) return true; // keep it
          const ticket = found.TicketNo || found.RefCode || found.Ref || found.Code || found.Ticket || found.Number || null;
          // remove local entry if server has ticket
          return !ticket;
        });
        localStorage.setItem('localQueues', JSON.stringify(localArr2));
      }
    } catch (_) {}
    els.myBody.innerHTML = "";

    // Will hold a parsed justBooked summary (if present) so we can inject/dedupe
    let pendingJustBooked = null;

    // ถ้ามาพร้อมกับการจองใหม่ ให้แสดงข้อความสำเร็จชั่วคราว
    try {
      const just = localStorage.getItem('justBooked');
      let justObj = null;
      if (just) {
        try {
          justObj = JSON.parse(just);
        } catch (_) {
          // not JSON (legacy boolean), ignore parsing
          justObj = null;
        }

        // Build a friendly notice and a small summary header for the booked item
          const title = 'จองสำเร็จ — แสดงรายการคิวของคุณด้านล่าง';
          let extra = '';
          if (justObj) {
            const ticket = justObj.TicketNo || justObj.RefCode || justObj.Ref || justObj.Code || null;
            extra = `<div class="just-booked-summary" style="margin-top:8px;padding:10px;background:#f8fff3;border:1px solid #e0f0d9;border-radius:6px">` +
              `<strong>${justObj.CenterName || ''}</strong> — ${justObj.ServiceName || ''}` +
              `<div style="font-size:.95em;color:#334">วันที่: ${justObj.BookingDate || '-'} เวลา: ${justObj.SlotTime || '-'} ` +
              `${ticket ? ' | เลขบัตรคิว: <span id="justBookedTicket">' + ticket + '</span>' : ''}</div>` +
              `</div>`;
        }

        // Always include a 'ไปที่คิวของฉัน' button so user can jump to/refresh their table
    els.msg.innerHTML = title + (extra ? extra + ' <button id="msgGoto" class="btn-inline">ไปที่คิวของฉัน</button> <button id="msgRefresh" class="btn-inline">รีเฟรชเลขบัตร</button> <button id="msgCopy" class="btn-inline">คัดลอกเลขบัตรคิว</button> <button id="msgDismiss" class="btn-inline">ปิด</button>' : ' <button id="msgGoto" class="btn-inline">ไปที่คิวของฉัน</button> <button id="msgRefresh" class="btn-inline">รีเฟรชเลขบัตร</button> <button id="msgDismiss" class="btn-inline">ปิด</button>');
        try {
          els.msg.className = 'notice success';
          els.msg.style.display = '';
        } catch (_) {}
        els.msg.dataset.persistent = 'true';

  // remove the stored flag so it doesn't re-show on later navigations
  localStorage.removeItem('justBooked');
  pendingJustBooked = justObj;

        // If we have a justObj, inject it as the first row in the table so user sees it immediately
        if (justObj && els.myBody) {
          // detect ticket in justObj if not explicitly set
          let justTicket = justObj.TicketNo || justObj.RefCode || justObj.Ref || justObj.Code || null;
          if (!justTicket) {
            try {
              for (const v of Object.values(justObj)) {
                if (typeof v === 'string' && v.length >= 8 && /[-].*\d/.test(v)) {
                  justTicket = v; break;
                }
              }
            } catch (_) {}
          }
          const tempRow = `
            <tr data-id="${justObj.QueueID || ''}" data-local="true" data-fee="${justObj.Fee || justObj.fee || 0}">
              <td>${(justObj.BookingDate || '').slice(0,10)}</td>
              <td>${justObj.SlotTime || '-'}</td>
              <td>${justObj.CenterName || '-'}</td>
              <td>${justObj.ServiceName || '-'}</td>
              <td>${justObj.Status || 'Booked'}</td>
              <td>${justTicket ?? '-'}</td>
              <td style="white-space:nowrap; display:flex; gap:8px;">
                ${justObj.Status && ["Booked","CheckedIn"].includes(justObj.Status) ? `<button class="cancel">ยกเลิก</button>` : ""}
                <button class="remove" style="background:#fff;border:1px solid #d0d5dd;color:#344054;">ลบ</button>
              </td>
            </tr>`;
          // place it temporarily; when the fetch completes we'll dedupe
          els.myBody.innerHTML = tempRow;
        }

  // Add dismiss handler
        const dismissBtn = document.getElementById('msgDismiss');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', () => {
            try {
              delete els.msg.dataset.persistent;
              els.msg.style.display = 'none';
              els.msg.textContent = '';
            } catch (_) {}
          });
        }

        // Add a small spinner/indicator for ticket polling
        try {
          let spinner = document.getElementById('ticketSpinner');
          if (!spinner) {
            spinner = document.createElement('span');
            spinner.id = 'ticketSpinner';
            spinner.style.marginLeft = '8px';
            spinner.style.fontSize = '0.95em';
            spinner.style.color = '#0a632b';
            spinner.textContent = '';
            els.msg.appendChild(spinner);
          }
        } catch (_) {}

        // Add refresh button handler: force reload of table (immediate)
        const refreshBtn = document.getElementById('msgRefresh');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', () => {
            try {
              // show a quick indicator
              const sp = document.getElementById('ticketSpinner');
              if (sp) sp.textContent = 'กำลังรีเฟรช...';
              loadMyQueues();
              setTimeout(() => { if (sp) sp.textContent = ''; }, 2500);
            } catch (_) {}
          });
        }

        // Add 'goto my queues' handler: scroll to table and refresh
        const gotoBtn = document.getElementById('msgGoto');
        if (gotoBtn) {
          gotoBtn.addEventListener('click', (ev) => {
            try {
              // smooth scroll to the table body
              const tbl = document.getElementById('myBody');
              if (tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // re-run load to refresh server data
              // small delay to allow smooth scroll to start
              setTimeout(() => {
                try { loadMyQueues(); } catch (_) {}
              }, 150);
            } catch (_) {}
          });
        }

        // Add copy ticket handler if present
        const copyBtn = document.getElementById('msgCopy');
        if (copyBtn) {
          copyBtn.addEventListener('click', async () => {
            try {
              const ticketEl = document.getElementById('justBookedTicket');
              if (ticketEl && ticketEl.textContent) {
                try { await navigator.clipboard.writeText(ticketEl.textContent.trim()); } catch (_) {
                  // navigator.clipboard may be unavailable (insecure context); fallback to select+execCommand
                  const range = document.createRange();
                  range.selectNodeContents(ticketEl);
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(range);
                  document.execCommand('copy');
                  sel.removeAllRanges();
                }
                copyBtn.textContent = 'คัดลอกแล้ว';
                setTimeout(() => (copyBtn.textContent = 'คัดลอกเลขบัตรคิว'), 2000);
              } else {
                copyBtn.textContent = 'ไม่มีเลขบัตร';
                setTimeout(() => (copyBtn.textContent = 'คัดลอกเลขบัตรคิว'), 2000);
              }
            } catch (e) {
              try { copyBtn.textContent = 'ไม่สามารถคัดลอก'; } catch(_){}
            }
          });
        }

        // Auto-hide after 8s if not dismissed
        setTimeout(() => {
          try {
            if (els.msg.dataset.persistent) {
              delete els.msg.dataset.persistent;
              els.msg.style.display = 'none';
              // keep the summary row visible even if notice hides
            }
          } catch (_) {}
        }, 8000);
      }
    } catch (_) {}

    const r = await fetch(API + "/my/queues", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await r.json();
    if (!r.ok) {
      els.msg.textContent = data.error || "ดึงรายการคิวไม่สำเร็จ";
      return;
    }

    // If server returned no rows but we have a just-booked summary, keep the temp row.
    if (!Array.isArray(data) || data.length === 0) {
      if (!pendingJustBooked) {
        els.myBody.innerHTML =
          '<tr><td colspan="7" style="text-align:center;opacity:.7">ยังไม่มีคิว</td></tr>';
      }
      return;
    }

    // If we have a pendingJustBooked, dedupe: insert it at top if server didn't include it
    if (pendingJustBooked && Array.isArray(data) && data.length > 0) {
      const exists = data.some((q) => {
        if (pendingJustBooked.QueueID && q.QueueID && String(q.QueueID) === String(pendingJustBooked.QueueID)) return true;
        // fallback: match by date/slot/center/service
        return (
          (q.BookingDate || '').slice(0,10) === (pendingJustBooked.BookingDate || '').slice(0,10) &&
          (q.SlotTime || '') === (pendingJustBooked.SlotTime || '') &&
          (q.CenterName || '') === (pendingJustBooked.CenterName || '') &&
          (q.ServiceName || '') === (pendingJustBooked.ServiceName || '')
        );
      });
      if (!exists) {
        // create a synthetic record to place at the top
        data.unshift({
          QueueID: pendingJustBooked.QueueID || null,
          BookingDate: pendingJustBooked.BookingDate || null,
          SlotTime: pendingJustBooked.SlotTime || null,
          CenterName: pendingJustBooked.CenterName || null,
          ServiceName: pendingJustBooked.ServiceName || null,
          Status: pendingJustBooked.Status || 'Booked',
          TicketNo: pendingJustBooked.TicketNo || null,
        });
      }
    }

    // Merge any locally persisted queue tickets (from localQueues) into server data so ticket shows persistently
    try {
      const localRaw = localStorage.getItem('localQueues');
      if (localRaw) {
        const localArr = JSON.parse(localRaw);
        if (Array.isArray(localArr) && localArr.length > 0) {
          for (const l of localArr) {
            // try to find matching server item
            const found = data.find((q) => {
              if (l.QueueID && q.QueueID && String(l.QueueID) === String(q.QueueID)) return true;
              return (
                (q.BookingDate || '').slice(0,10) === (l.BookingDate || '').slice(0,10) &&
                (q.SlotTime || '') === (l.SlotTime || '') &&
                (q.CenterName || '') === (l.CenterName || '') &&
                (q.ServiceName || '') === (l.ServiceName || '')
              );
            });
            if (found) {
              // copy ticket into server item if missing
              const ticket = found.TicketNo || found.RefCode || found.Ref || found.Code || found.Ticket || found.Number || null;
              if (!ticket && l.TicketNo) {
                found.TicketNo = l.TicketNo;
              }
              // copy payment info if present in local store
              if (l.Paid) {
                found.Paid = l.Paid;
                if (l.PaymentRef) found.PaymentRef = l.PaymentRef;
              }
            } else {
              // no matching server row: insert the local one so it shows persistently
              data.unshift({
                QueueID: l.QueueID || null,
                BookingDate: l.BookingDate || null,
                SlotTime: l.SlotTime || null,
                CenterName: l.CenterName || null,
                ServiceName: l.ServiceName || null,
                Status: l.Status || 'Booked',
                TicketNo: l.TicketNo || null,
                Paid: l.Paid || false,
                PaymentRef: l.PaymentRef || null,
                _local: true,
              });
            }
          }
        }
      }
    } catch (_) {}

    // Prune very old localQueues entries (older than 7 days)
    try {
      const raw = localStorage.getItem('localQueues');
      if (raw) {
        const arr = JSON.parse(raw || '[]');
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const kept = (arr || []).filter((x) => !x._ts || x._ts >= cutoff);
        localStorage.setItem('localQueues', JSON.stringify(kept));
      }
    } catch (_) {}

    els.myBody.innerHTML = data
      .map((q) => {
        const canCancel = ["Booked", "CheckedIn"].includes(q.Status);
        // Ticket number might be under different property names depending on backend
        let ticket = q.TicketNo || q.RefCode || q.Ref || q.Code || q.Ticket || q.Number || null;
        // If still not found, try to discover a ticket-like value from any field (heuristic)
        if (!ticket) {
          try {
            const vals = Object.values(q);
            for (const v of vals) {
              if (typeof v !== 'string') continue;
              // heuristic: contains a dash and a digit and is reasonably long
              if (v.length >= 8 && /[-].*\d/.test(v)) {
                ticket = v;
                break;
              }
            }
          } catch (_) { ticket = ticket; }
        }
  const paidBadge = (q.Paid || q.PaymentRef) ? `<div class="paid-badge">ชำระเสร็จแล้ว</div>` : '';
        return `
          <tr data-id="${q.QueueID}" data-fee="${(q.Fee || q.fee || 0)}">
            <td>${(q.BookingDate || '').slice(0, 10)}</td>
            <td>${q.SlotTime || '-'}</td>
            <td>${q.CenterName || '-'}</td>
            <td>${q.ServiceName || '-'}</td>
            <td>${q.Status || ''}</td>
            <td>${ticket ? `<div class="ticket-no">${ticket}</div>` : "-"}${paidBadge}</td>
            <td style="white-space:nowrap; display:flex; gap:8px;">
              ${canCancel ? `<button class="cancel">ยกเลิก</button>` : ""}
              ${ (q.Paid || q.PaymentRef) ? '' : `<button class="pay">ชำระเงิน</button>` }
              <button class="remove" style="background:#fff;border:1px solid #d0d5dd;color:#344054;">ลบ</button>
            </td>
          </tr>`;
      })
      .join("");

    // If we inserted a pendingJustBooked and the ticket/เลขบัตรคิว is missing,
    // poll the server a few times in case backend generates it asynchronously.
    (function maybePollForTicket(pending) {
      if (!pending) return;
  let attempts = 0;
  const maxAttempts = 12; // up to ~36 seconds with 3s interval
  const interval = 3000;

      const matchPredicate = (q) => {
        // match by QueueID if present, else by date/slot/center/service
        if (pending.QueueID && q.QueueID && String(pending.QueueID) === String(q.QueueID)) return true;
        return (
          (q.BookingDate || '').slice(0,10) === (pending.BookingDate || '').slice(0,10) &&
          (q.SlotTime || '') === (pending.SlotTime || '') &&
          (q.CenterName || '') === (pending.CenterName || '') &&
          (q.ServiceName || '') === (pending.ServiceName || '')
        );
      };

      const tick = async () => {
        attempts++;
        try {
          const rr = await fetch(API + '/my/queues', { headers: { Authorization: 'Bearer ' + token } });
          if (!rr.ok) throw new Error('reload failed');
          const arr = await rr.json();
          if (Array.isArray(arr)) {
            const found = arr.find(matchPredicate);
            if (found) {
              const ticket = found.TicketNo || found.RefCode || found.Ref || found.Code || found.Ticket || found.Number || null;
              if (ticket) {
                // update notice ticket span if present
                try {
                  const tkEl = document.getElementById('justBookedTicket');
                  if (tkEl) tkEl.textContent = ticket;
                } catch (_) {}
                // update table cell for that QueueID or matching row
                try {
                  const rows = Array.from(els.myBody.querySelectorAll('tr'));
                  for (const tr of rows) {
                    try {
                      const id = tr.getAttribute('data-id') || (tr.getAttribute('data-local') ? (pending.QueueID || '') : null);
                      if (id && found.QueueID && String(id) === String(found.QueueID)) {
                        const td = tr.querySelector('td:nth-child(6)');
                        if (td) td.textContent = ticket;
                        break;
                      }
                      // fallback match by cells: date + slot + center + service
                      const cells = tr.querySelectorAll('td');
                      if (cells.length >= 5) {
                        const d = cells[0].textContent.trim();
                        const t = cells[1].textContent.trim();
                        const c = cells[2].textContent.trim();
                        const s = cells[3].textContent.trim();
                        if (d === (pending.BookingDate || '').slice(0,10) && t === (pending.SlotTime || '') && c === (pending.CenterName || '') && s === (pending.ServiceName || '')) {
                          const td = tr.querySelector('td:nth-child(6)');
                          if (td) td.textContent = ticket;
                          // clear spinner if present
                          try { const sp = document.getElementById('ticketSpinner'); if (sp) sp.textContent = ''; } catch(_){}
                          // update copy button label back to default
                          try { const cb = document.getElementById('msgCopy'); if (cb) cb.textContent = 'คัดลอกเลขบัตรคิว'; } catch(_){}
                          break;
                        }
                      }
                    } catch (_) {}
                  }
                } catch (_) {}

                // found and updated — stop polling
                return;
              }
            }
          }
        } catch (_) {}
        if (attempts < maxAttempts) setTimeout(tick, interval);
      };

      // start polling after a short delay so DB has time to commit
      setTimeout(tick, 1500);
    })(pendingJustBooked);
  }

  // ใช้ event delegation เพื่อไม่ต้อง bind ใหม่ทุกครั้ง
  els.myBody.addEventListener("click", async (evt) => {
    const tr = evt.target.closest("tr[data-id]");
    if (!tr) return;
    const id = tr.getAttribute("data-id");

    // ยกเลิก
    if (evt.target.classList.contains("cancel")) {
      try {
        const rr = await fetch(`${API}/queues/${id}/cancel`, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token },
        });
        const res = await rr.json();
        if (!rr.ok) throw new Error(res.error || "ยกเลิกไม่สำเร็จ");
        els.msg.textContent = "ยกเลิกคิวสำเร็จ";
        await loadMyQueues();
      } catch (e) {
        els.msg.textContent = e.message;
      }
      return;
    }

    // ลบ
    if (evt.target.classList.contains("remove")) {
      if (!confirm("ยืนยันลบคิวนี้ออกจากประวัติ?")) return;
      try {
        const rr = await fetch(`${API}/queues/${id}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        });
        let res;
        try {
          res = await rr.json();
        } catch (_err) {
          // response wasn't JSON (or empty) - capture raw text
          const txt = await rr.text().catch(() => '');
          res = { error: txt || null };
        }
        if (!rr.ok) {
          const msg = res && (res.error || JSON.stringify(res)) ? (res.error || JSON.stringify(res)) : `ลบไม่สำเร็จ (status ${rr.status})`;
          console.error('DELETE', `${API}/queues/${id}`, 'status', rr.status, 'body', res);
          throw new Error(msg);
        }
        els.msg.textContent = "ลบคิวออกจากประวัติแล้ว";
        // เอาแถวออกทันที ไม่ต้องรีเฟรชทั้งตารางก็ได้
        tr.remove();
        // ถ้าอยากรีเฟรชทั้งหมด: await loadMyQueues();
      } catch (e) {
        // Show status + message and keep a console trace for debugging
        els.msg.textContent = e.message || 'ลบไม่สำเร็จ';
        console.warn('Remove failed', e);
      }
    }

    // ชำระเงิน (เปิด modal ในหน้าเดียว)
    if (evt.target.classList.contains('pay')) {
      try {
        // Build a simple modal
        const existing = document.getElementById('paymentModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.background = 'rgba(0,0,0,0.4)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '20000';

        const box = document.createElement('div');
        box.style.width = '360px';
        box.style.maxWidth = '92%';
        box.style.background = '#fff';
        box.style.padding = '18px';
        box.style.borderRadius = '8px';
        box.style.boxShadow = '0 8px 30px rgba(12,12,20,0.12)';

        const title = document.createElement('h3');
        title.textContent = 'ชำระเงิน';
        title.style.marginTop = '0';
        box.appendChild(title);

        const info = document.createElement('div');
  info.style.margin = '12px 0';
  info.style.fontSize = '15px';
  // Read fee from the row's data-fee attribute (fallback to 0)
  let fee = parseFloat(tr.dataset.fee || '0') || 0;
  // render fee area and a small status element for live updates
  info.innerHTML = `<div>ยอดที่ต้องชำระ</div><div id="feeValue" style="font-weight:700;font-size:20px;color:#0a632b;margin-top:6px">${fee.toFixed(2)} บาท</div>`;
  const feeStatus = document.createElement('div');
  feeStatus.style.fontSize = '13px';
  feeStatus.style.color = '#556';
  feeStatus.style.marginTop = '8px';
  // append status element (empty unless we start fetching)
  info.appendChild(feeStatus);
  box.appendChild(info);

  // If fee is 0 (or missing), try to fetch a more accurate fee from the server for this QueueID
  // Best-effort: try /api/queues/:id first; if that fails (404 or no price), fall back to fetching /api/my/queues and find matching QueueID
  if (!fee) {
    (async () => {
      try {
        feeStatus.textContent = 'กำลังตรวจสอบราคา...';

        // First try per-queue endpoint
        let obj = null;
        try {
          const rr = await fetch(`${API}/queues/${id}`, { headers: { Authorization: 'Bearer ' + token } });
          if (rr.ok) {
            obj = await rr.json();
          }
        } catch (_) {
          // ignore network errors and try fallback
          obj = null;
        }

        // If per-queue endpoint didn't return useful data, try listing and matching
        if (!obj) {
          try {
            const r2 = await fetch(`${API}/my/queues`, { headers: { Authorization: 'Bearer ' + token } });
            if (r2.ok) {
              const arr = await r2.json();
              if (Array.isArray(arr)) {
                const found = arr.find((q) => String(q.QueueID) === String(id));
                if (found) obj = found;
              }
            }
          } catch (_) { obj = null; }
        }

        if (obj) {
          // check common property names for fee/price
          const candidates = [obj.Fee, obj.fee, obj.Amount, obj.Price, obj.Total, obj.serviceFee, obj.ServiceFee];
          let found = null;
          for (const c of candidates) {
            if (typeof c === 'number' && !isNaN(c) && c > 0) { found = c; break; }
            if (typeof c === 'string' && c.trim() !== '' && !isNaN(parseFloat(c))) { found = parseFloat(c); break; }
          }
          // also look inside nested service object if present
          if (!found && obj.service && (obj.service.Fee || obj.service.fee)) {
            const s = obj.service.Fee || obj.service.fee;
            if (typeof s === 'number' && s > 0) found = s;
            if (typeof s === 'string' && !isNaN(parseFloat(s))) found = parseFloat(s);
          }
          if (found && Number(found) > 0) {
            fee = Number(found);
            try {
              const feeValueEl = info.querySelector('#feeValue');
              if (feeValueEl) feeValueEl.textContent = `${fee.toFixed(2)} บาท`;
              tr.dataset.fee = String(fee);
            } catch (_) {}
          }
        }
      } catch (_) {
        // ignore
      } finally {
        try { feeStatus.textContent = ''; } catch (_) {}
      }
    })();
  }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '8px';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'ยกเลิก';
        cancelBtn.className = 'btn-inline';
        cancelBtn.addEventListener('click', () => { modal.remove(); });
        actions.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'ชำระ';
        confirmBtn.className = 'btn-inline';
        confirmBtn.style.background = '#0a632b';
        confirmBtn.style.color = '#fff';
        confirmBtn.addEventListener('click', async () => {
          try {
                // mark as paid locally (price 0 -> no backend call) and try to persist to server
                const key = `${tr.querySelector('td:first-child').textContent.trim()}|${tr.querySelector('td:nth-child(2)').textContent.trim()}|${tr.querySelector('td:nth-child(3)').textContent.trim()}|${tr.querySelector('td:nth-child(4)').textContent.trim()}`;
                const paymentRef = 'local-' + Date.now();
                try {
                  const arr = JSON.parse(localStorage.getItem('localQueues') || '[]');
                  let found = false;
                  for (const it of arr) {
                    if (it._key === key) { it.Paid = true; it.PaymentRef = paymentRef; it._ts = Date.now(); found = true; break; }
                  }
                  if (!found) {
                    // push a minimal record so the status table persists the paid state
                    arr.push({ BookingDate: tr.querySelector('td:first-child').textContent.trim(), SlotTime: tr.querySelector('td:nth-child(2)').textContent.trim(), CenterName: tr.querySelector('td:nth-child(3)').textContent.trim(), ServiceName: tr.querySelector('td:nth-child(4)').textContent.trim(), QueueID: id, Paid: true, PaymentRef: paymentRef, _key: key, _ts: Date.now() });
                  }
                  localStorage.setItem('localQueues', JSON.stringify(arr));
                } catch (_) {}

                // best-effort: persist paymentRef to server so admin can see it
                (async () => {
                  try {
                    await fetch(`${API}/queues/${id}/pay`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                      body: JSON.stringify({ paymentRef })
                    });
                    // ignore response body; admin view will now show RefCode
                  } catch (e) {
                    // persist failure is non-fatal; keep local marker
                    console.warn('persist paymentRef failed', e);
                  }
                })();

            // update UI row: add paid badge and remove pay button
            try {
              const td6 = tr.querySelector('td:nth-child(6)');
              if (td6) {
                const badge = document.createElement('div'); badge.className = 'paid-badge'; badge.textContent = 'ชำระเสร็จแล้ว';
                td6.appendChild(badge);
              }
              const payBtnEl = tr.querySelector('button.pay'); if (payBtnEl) payBtnEl.remove();
            } catch (_) {}

            try { els.msg.textContent = 'ชำระเรียบร้อย '; } catch(_){}
            modal.remove();
          } catch (e) {
            console.warn(e);
            try { els.msg.textContent = 'เกิดข้อผิดพลาดขณะบันทึกการชำระ'; } catch(_){}
            modal.remove();
          }
        });
        actions.appendChild(confirmBtn);

        box.appendChild(actions);
        modal.appendChild(box);
        document.body.appendChild(modal);
      } catch (e) { console.warn(e); }
      return;
    }
  });

  document.addEventListener("DOMContentLoaded", loadMyQueues);
})();

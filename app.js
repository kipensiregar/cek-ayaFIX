// Variabel global
const itemForm = document.getElementById('item-form');
const nameInput = document.getElementById('item-name');
const priceInput = document.getElementById('item-price');
const qtyInput = document.getElementById('item-qty');
const tableBody = document.getElementById('item-table-body');
const totalDisplay = document.getElementById('grand-total');
const resetBtn = document.getElementById('reset-all-btn');
const buyerTbody = document.getElementById('buyer-table-body');
const tambahKeKeranjangBtn = document.getElementById('tambah-ke-keranjang');
const simpanTransaksiBtn = document.getElementById('simpan-transaksi');
const keranjangList = document.getElementById('keranjang-items');

let itemList = JSON.parse(localStorage.getItem('kasirItemList')) || [];
let buyerList = JSON.parse(localStorage.getItem('kasirBuyerList')) || [];
let keranjangSementara = [];
let menuSummaryElement = null; // Untuk menyimpan referensi elemen summary

// Fungsi untuk menampilkan section
function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => {
    sec.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.textContent.toLowerCase().includes(id));
  });
}

// ==================== MANAJEMEN BARANG ====================
function renderItemTable() {
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  let total = 0;

  itemList.forEach((item, index) => {
    if (!item) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="No">${index + 1}</td>
      <td data-label="Nama">${item.name || ''}</td>
      <td data-label="Harga">Rp ${(item.price || 0).toLocaleString()}</td>
      <td data-label="Jumlah">${item.qty || 0}</td>
      <td data-label="Subtotal">Rp ${((item.price || 0) * (item.qty || 0)).toLocaleString()}</td>
      <td data-label="Aksi"><button onclick="deleteItem(${item.id || 0})">Hapus</button></td>
    `;
    tableBody.appendChild(row);
    total += (item.price || 0) * (item.qty || 0);
  });

  if (totalDisplay) {
    totalDisplay.textContent = `Rp ${total.toLocaleString()}`;
  }
  
  localStorage.setItem('kasirItemList', JSON.stringify(itemList));
  renderBarangOptions();
}

function deleteItem(id) {
  if (!id) return;
  
  itemList = itemList.filter(item => item && item.id !== id);
  renderItemTable();
}

if (itemForm) {
  itemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? parseFloat(priceInput.value) : 0;
    const qty = qtyInput ? parseInt(qtyInput.value) : 0;

    if (!name || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
      alert('Lengkapi data dan pastikan harga/jumlah lebih dari 0');
      return;
    }

    itemList.push({ id: Date.now(), name, price, qty });
    renderItemTable();
    
    if (itemForm.reset) {
      itemForm.reset();
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (confirm('Yakin reset semua data barang?')) {
      itemList = [];
      localStorage.removeItem('kasirItemList');
      renderItemTable();
    }
  });
}

// Render dropdown barang
function renderBarangOptions() {
  const select = document.getElementById('select-barang');
  if (!select) return;
  
  select.innerHTML = '<option value="">Pilih Barang</option>';
  
  itemList.forEach(item => {
    if (!item) return;
    
    const opt = document.createElement('option');
    opt.value = item.name || '';
    opt.textContent = `${item.name || ''} - Rp ${(item.price || 0).toLocaleString()}`;
    opt.dataset.harga = item.price || 0;
    select.appendChild(opt);
  });
}

// ==================== MANAJEMEN PEMBELI ====================
if (tambahKeKeranjangBtn) {
  tambahKeKeranjangBtn.addEventListener('click', tambahKeKeranjang);
}

function tambahKeKeranjang() {
  const namaInput = document.getElementById('nama-pembeli');
  const barangSelect = document.getElementById('select-barang');
  const jumlahInput = document.getElementById('jumlah-barang');
  
  const nama = namaInput ? namaInput.value : '';
  const barang = barangSelect ? barangSelect.value : '';
  const harga = barangSelect && barangSelect.options[barangSelect.selectedIndex] 
    ? parseFloat(barangSelect.options[barangSelect.selectedIndex].dataset.harga) 
    : 0;
  const jumlah = jumlahInput ? parseInt(jumlahInput.value) : 0;

  if (!nama) {
    alert('Nama pembeli harus diisi');
    return;
  }
  
  if (!barang || isNaN(jumlah) || jumlah <= 0) {
    alert('Barang dan jumlah harus valid');
    return;
  }

  const item = itemList.find(i => i && i.name === barang);
  if (!item || (item.qty || 0) < jumlah) {
    alert(`Stok tidak cukup! Stok tersedia: ${item ? item.qty : 0}`);
    return;
  }

  keranjangSementara.push({
    namaBarang: barang,
    hargaBarang: harga,
    jumlahBarang: jumlah
  });

  renderKeranjangSementara();
  
  if (jumlahInput) {
    jumlahInput.value = '1';
  }
}

function renderKeranjangSementara() {
  if (!keranjangList) return;
  
  keranjangList.innerHTML = '';
  
  keranjangSementara.forEach((item, index) => {
    if (!item) return;
    
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.namaBarang || ''} (${item.jumlahBarang || 0}) 
      <button onclick="hapusDariKeranjang(${index})">×</button>
    `;
    keranjangList.appendChild(li);
  });
}

function hapusDariKeranjang(index) {
  if (isNaN(index)) return;
  
  keranjangSementara.splice(index, 1);
  renderKeranjangSementara();
}

if (simpanTransaksiBtn) {
  simpanTransaksiBtn.addEventListener('click', simpanTransaksi);
}

function updateRekapPenjualan() {
  // Hitung semua statistik
  const totalPembeli = buyerList.length;
  
  const totalBarang = buyerList.reduce((sum, buyer) => {
    if (!buyer || !Array.isArray(buyer.items)) return sum;
    return sum + buyer.items.reduce((subSum, item) => {
      return subSum + (item.jumlahBarang || 0);
    }, 0);
  }, 0);
  
  const totalUang = buyerList.reduce((sum, buyer) => {
    if (!buyer || !Array.isArray(buyer.items) || !buyer.sudahTransfer) return sum;
    return sum + buyer.items.reduce((subSum, item) => {
      return subSum + ((item.hargaBarang || 0) * (item.jumlahBarang || 0));
    }, 0);
  }, 0);
  
  const totalKirim = buyerList.filter(b => b && b.sudahDikirim).length;

  // Update tampilan
  const updateIfExists = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  updateIfExists('rekap-total-pembeli', totalPembeli);
  updateIfExists('rekap-total-barang', totalBarang);
  updateIfExists('rekap-total-uang', `Rp ${totalUang.toLocaleString()}`);
  updateIfExists('rekap-total-kirim', totalKirim);
}

function simpanTransaksi() {
  const namaInput = document.getElementById('nama-pembeli');
  const catatanInput = document.getElementById('catatan-pembeli');
  
  const nama = namaInput ? namaInput.value : '';
  const catatan = catatanInput ? catatanInput.value.trim() : '';

  if (!nama) {
    alert('Nama pembeli harus diisi');
    return;
  }
  
  if (keranjangSementara.length === 0) {
    alert('Keranjang belanja kosong');
    return;
  }

  // Validasi dan format items sebelum disimpan
  const items = keranjangSementara.map(item => ({
    namaBarang: item.namaBarang || 'Unknown',
    hargaBarang: item.hargaBarang || 0,
    jumlahBarang: item.jumlahBarang || 0
  }));

  // Kurangi stok
  items.forEach(itemKeranjang => {
    const item = itemList.find(i => i && i.name === itemKeranjang.namaBarang);
    if (item) {
      item.qty = (item.qty || 0) - (itemKeranjang.jumlahBarang || 0);
    }
  });

  buyerList.push({
    id: Date.now(),
    namaPembeli: nama,
    items: items,
    catatan: catatan,
    sudahTransfer: false,
    sudahDikirim: false
  });

  localStorage.setItem('kasirItemList', JSON.stringify(itemList));
  localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
  
  keranjangSementara = [];
  renderKeranjangSementara();
  renderItemTable();
  renderBuyerTable();
  updateRekapPenjualan();
  
  if (namaInput) namaInput.value = '';
  if (catatanInput) catatanInput.value = '';
}

function renderMenuSummary() {
  // Hapus summary sebelumnya jika ada
  if (menuSummaryElement) {
    menuSummaryElement.remove();
  }

  // Hitung total pesanan per menu dari semua transaksi dengan error handling
  const menuSummary = {};
  
  buyerList.forEach(transaction => {
    // Pastikan transaksi valid dan memiliki items
    if (!transaction || !Array.isArray(transaction.items)) {
      console.warn('Transaksi tidak valid:', transaction);
      return; // Lewati transaksi ini
    }

    transaction.items.forEach(item => {
      // Pastikan item valid
      if (!item || !item.namaBarang || !item.jumlahBarang) {
        console.warn('Item tidak valid:', item);
        return; // Lewati item ini
      }

      if (!menuSummary[item.namaBarang]) {
        menuSummary[item.namaBarang] = 0;
      }
      menuSummary[item.namaBarang] += item.jumlahBarang;
    });
  });

  // Buat elemen baru untuk summary
  menuSummaryElement = document.createElement('div');
  menuSummaryElement.className = 'menu-summary card';
  
  const title = document.createElement('h3');
  title.textContent = 'Total Pesanan per Menu';
  menuSummaryElement.appendChild(title);

  // Urutkan dari yang paling banyak dipesan
  const sortedMenu = Object.entries(menuSummary)
    .sort((a, b) => b[1] - a[1]);

  // Buat tabel summary hanya jika ada data
  if (sortedMenu.length > 0) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Menu</th>
        <th>Total Pesanan</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sortedMenu.forEach(([menuName, totalQty]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${menuName}</td>
        <td>${totalQty} porsi </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    menuSummaryElement.appendChild(table);
  } else {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Belum ada data pesanan';
    menuSummaryElement.appendChild(emptyMessage);
  }

  // Tempatkan setelah tabel transaksi
  const buyerTable = document.querySelector('#buyer-table-body')?.parentElement?.parentElement;
  if (buyerTable) {
    buyerTable.parentNode.insertBefore(menuSummaryElement, buyerTable.nextSibling);
  }
}

function renderBuyerTable() {
  const filterTransfer = document.getElementById('filter-transfer');
  const filterKirim = document.getElementById('filter-kirim');
  
  const transferValue = filterTransfer ? filterTransfer.value : '';
  const kirimValue = filterKirim ? filterKirim.value : '';

  if (!buyerTbody) return;
  
  buyerTbody.innerHTML = '';
  
  buyerList
    .filter(buyer => {
      if (!buyer || !Array.isArray(buyer.items)) return false;
      
      const transferMatch = !transferValue || 
        (buyer.sudahTransfer || false).toString() === transferValue;
      const kirimMatch = !kirimValue || 
        (buyer.sudahDikirim || false).toString() === kirimValue;
      
      return transferMatch && kirimMatch;
    })
    .forEach((buyer, index) => {
      if (!buyer) return;
      
      const totalTransaksi = (buyer.items || []).reduce((sum, item) => {
        if (!item) return sum;
        return sum + ((item.hargaBarang || 0) * (item.jumlahBarang || 0));
      }, 0);

      const daftarBarang = (buyer.items || [])
        .map(item => item ? item.namaBarang : '')
        .filter(Boolean)
        .join(', ');
        
      const jumlahBarang = (buyer.items || [])
        .map(item => item ? item.jumlahBarang : 0)
        .join('/');

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${buyer.namaPembeli || ''}</td>
        <td>${daftarBarang}</td>
        <td>${jumlahBarang}</td>
        <td>${buyer.catatan || '-'}</td>
        <td>Rp ${totalTransaksi.toLocaleString()}</td>
        <td>
          <button onclick="toggleTransfer(${buyer.id || 0})"
            class="status-transfer ${buyer.sudahTransfer ? 'sudah' : 'belum'}">
            ${buyer.sudahTransfer ? '✅ Transfer' : '❌ Transfer'}
          </button>
        </td>
        <td>
          <button onclick="toggleKirim(${buyer.id || 0})"
            class="status-kirim ${buyer.sudahDikirim ? 'sudah' : 'belum'}">
            ${buyer.sudahDikirim ? '🚚 Kirim' : '❌ Kirim'}
          </button>
        </td>
        <td>
          <button onclick="cetakStrukCanvas(${buyer.id || 0})" class="struk-btn">
            🧾 Struk
          </button>
        </td>
      `;
      
      row.addEventListener('dblclick', () => {
        if (confirm(`Hapus data pembeli: ${buyer.namaPembeli || ''}?`)) {
          buyerList.splice(index, 1);
          localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
          renderBuyerTable();
        }
      });

      buyerTbody.appendChild(row);
    });

  updateRekapPenjualan();
  renderMenuSummary(); // Render summary setelah tabel
}

// ... [Fungsi lainnya tetap sama]

function toggleTransfer(id) {
  if (!id) return;

  const buyer = buyerList.find(b => b && b.id === id);
  if (buyer) {
    buyer.sudahTransfer = !buyer.sudahTransfer;
    localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
    renderBuyerTable();
  }
}

function toggleKirim(id) {
  if (!id) return;

  const buyer = buyerList.find(b => b && b.id === id);
  if (buyer) {
    buyer.sudahDikirim = !buyer.sudahDikirim;
    localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
    renderBuyerTable();
  }
}

const resetBuyerBtn = document.getElementById('reset-buyer-btn');
if (resetBuyerBtn) {
  resetBuyerBtn.addEventListener('click', () => {
    if (confirm('Yakin reset semua transaksi pembeli?')) {
      buyerList = [];
      localStorage.removeItem('kasirBuyerList');
      renderBuyerTable();
    }
  });
}

function updateRekapPenjualan() {
  const totalPembeli = buyerList.length;

  const totalBarang = buyerList.reduce((sum, buyer) => {
    if (!buyer || !buyer.items) return sum;
    return sum + (buyer.items || []).reduce((subSum, item) => {
      return subSum + (item.jumlahBarang || 0);
    }, 0);
  }, 0);

  const totalUang = buyerList.reduce((sum, buyer) => {
    if (!buyer || !buyer.items || !buyer.sudahTransfer) return sum;
    return sum + (buyer.items || []).reduce((subSum, item) => {
      return subSum + ((item.hargaBarang || 0) * (item.jumlahBarang || 0));
    }, 0);
  }, 0);

  const totalKirim = buyerList.filter(b => b && b.sudahDikirim).length;

  const rekapPembeli = document.getElementById('rekap-total-pembeli');
  const rekapBarang = document.getElementById('rekap-total-barang');
  const rekapUang = document.getElementById('rekap-total-uang');
  const rekapKirim = document.getElementById('rekap-total-kirim');

  if (rekapPembeli) rekapPembeli.textContent = totalPembeli;
  if (rekapBarang) rekapBarang.textContent = totalBarang;
  if (rekapUang) rekapUang.textContent = `Rp ${totalUang.toLocaleString()}`;
  if (rekapKirim) rekapKirim.textContent = totalKirim;
}

function cetakStrukCanvas(id) {
  const buyer = buyerList.find(b => b.id === id);
  if (!buyer) return;

  const canvas = document.getElementById('struk-canvas');
  const ctx = canvas.getContext('2d');

  // Warna tema
  const colors = {
    primary: '#000000', // Merah utama
    secondary: '#333', // Hitam
    accent: '#555', // Abu-abu gelap
    light: '#777', // Abu-abu
    background: '#fdfdfd' // Merah muda sangat muda
  };

  // Ukuran canvas
  canvas.width = 350;
  // Tinggi dinamis berdasarkan jumlah item dan catatan
  const estimatedHeight = 450 + (buyer.items.length * 25) +
                         (buyer.catatan ? Math.ceil(buyer.catatan.length / 30) * 20 : 0);
  canvas.height = Math.max(estimatedHeight, 500); // Minimum 500px

  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Style dasar
  ctx.fillStyle = colors.secondary;
  let y = 40;
  const margin = 20;
  const maxWidth = canvas.width - (margin * 2);
  const columnWidth = 80; // Lebar kolom QTY dan Subtotal

  // Fungsi untuk text wrapping
  function drawWrappedText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);

      if ((metrics.width > maxWidth && n > 0) || words[n].length > 20) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
  }

  // Fungsi untuk menggambar garis pemisah
  function drawDivider(yPos) {
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, yPos);
    ctx.lineTo(canvas.width - margin, yPos);
    ctx.stroke();
    return yPos + 20;
  }


  // Header struk
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Cek Aya 08", canvas.width / 2, y);
  y += 30;

  ctx.fillStyle = colors.accent;
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Jl. Sukarela / batujajar Komp Griya Mutiara Blok F 2", canvas.width / 2, y);
  y += 18;
  ctx.fillText("Sukarami Palembang", canvas.width / 2, y);
  y += 18;
  ctx.fillText("Telp: 085382668094", canvas.width / 2, y);
  y = drawDivider(y + 10);

  // Info pembeli
  ctx.textAlign = "left";
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`TRANSAKSI #${id}`, margin, y);
  y += 22;

  const now = new Date();
  ctx.fillStyle = colors.secondary;
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`Tanggal: ${now.toLocaleDateString()} ${now.toLocaleTimeString().substring(0,5)}`, margin, y);
  y += 18;

  ctx.fillText(`Nama Pembeli: ${buyer.namaPembeli || "-"}`, margin, y);
  y += 18;

  // Catatan dengan text wrapping
  if (buyer.catatan) {
    ctx.fillStyle = colors.accent;
    y = drawWrappedText(`Catatan: ${buyer.catatan}`, margin, y, maxWidth, 16);
    y += 10;
  }

  y = drawDivider(y);

  // Header daftar item
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("ITEM", margin, y);
  ctx.textAlign = "right";
  ctx.fillText("QTY", canvas.width - margin - columnWidth - 10, y);
  ctx.fillText("SUBTOTAL", canvas.width - margin, y);
  ctx.textAlign = "left";
  y += 20;

  // Daftar item
  ctx.fillStyle = colors.secondary;
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";

  buyer.items.forEach(item => {
    const itemName = item.namaBarang || "";
    const itemQty = item.jumlahBarang || 0;
    const itemPrice = item.hargaBarang || 0;
    const subtotal = itemQty * itemPrice;

    // Nama item dengan wrapping
    const nameY = drawWrappedText(itemName, margin, y, maxWidth - columnWidth * 2, 16);

    // QTY dan Subtotal
    ctx.textAlign = "right";
    ctx.fillText(itemQty.toString(), canvas.width - margin - columnWidth - 10, y);
    ctx.fillText(`Rp${subtotal.toLocaleString()}`, canvas.width - margin, y);
    ctx.textAlign = "left";

    y = Math.max(nameY, y + 20); // Ambil yang lebih besar antara text wrap atau baris normal
  });

  y = drawDivider(y + 5);

  // Total
  const total = buyer.items.reduce((sum, item) => sum + ((item.hargaBarang || 0) * (item.jumlahBarang || 0)), 0);
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("TOTAL BAYAR:", margin, y);
  ctx.textAlign = "right";
  ctx.fillText(`Rp${total.toLocaleString()}`, canvas.width - margin, y);
  ctx.textAlign = "left";
  y += 30;

  // Payment info
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("PEMBAYARAN", margin, y);
  y += 20;

  ctx.fillStyle = colors.secondary;
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("ERISSA DWI FUTRI", margin + 10, y);
  y += 18;
  ctx.fillText("Bank BNI", margin + 10, y);
  y += 18;
  ctx.fillText("1664526054", margin + 10, y);
  y += 18;
  ctx.fillText("Bantu bukti TF biar kita list ya", margin + 10, y);
  y += 30;

  // Footer - pastikan tidak melebihi canvas
  const footerY = Math.min(y, canvas.height - 30);
  ctx.fillStyle = colors.primary;
  ctx.font = "italic 12px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Terima kasih 🙏", canvas.width / 2, footerY);
  ctx.fillText("~ Cek Aya 08 ~", canvas.width / 2, footerY + 20);

  // Download struk
  const image = canvas.toDataURL("image/png");
  const link = document.createElement('a');
  link.download = `struk-${buyer.namaPembeli || 'customer'}.png`;
  link.href = image;
  link.click();
}

// Event listener untuk filter
const filterTransfer = document.getElementById('filter-transfer');
const filterKirim = document.getElementById('filter-kirim');

if (filterTransfer) {
  filterTransfer.addEventListener('change', renderBuyerTable);
}

if (filterKirim) {
  filterKirim.addEventListener('change', renderBuyerTable);
}

// Inisialisasi
renderItemTable();
renderBuyerTable();
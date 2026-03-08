// =============================================
// API
// =============================================
const API = '/api';

async function apiCall(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Lỗi không xác định');
  }
  return res.json();
}

// =============================================
// State
// =============================================
let menuItems = [];
let orders = [];
let currentEditingItem = null;
let newOrderItems = [];
let searchTimeout = null;

// =============================================
// Init
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadAllData();
});

async function loadAllData() {
  try {
    const search = document.getElementById('menuSearch')?.value || '';
    const sort = document.getElementById('menuSort')?.value || '';

    let menuUrl = '/menu';
    const params = [];
    if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
    if (sort) params.push(`sort=${sort}`);
    if (params.length) menuUrl += '?' + params.join('&');

    [menuItems, orders] = await Promise.all([
      apiCall(menuUrl),
      apiCall('/orders'),
    ]);

    updateDashboardStats();
    renderMenuItems();
    renderOrders();
    initializeStatistics();
  } catch (err) {
    console.error(err);
    alert('Không thể kết nối server. Hãy chắc chắn backend đang chạy!');
  }
}

// Chỉ load lại menu (khi search/sort)
async function loadMenu() {
  try {
    const search = document.getElementById('menuSearch')?.value || '';
    const sort = document.getElementById('menuSort')?.value || '';

    let url = '/menu';
    const params = [];
    if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
    if (sort) params.push(`sort=${sort}`);
    if (params.length) url += '?' + params.join('&');

    menuItems = await apiCall(url);
    renderMenuItems();
    updateDashboardStats();

    // Toggle clear button
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = search.trim() ? 'flex' : 'none';
  } catch (err) {
    console.error(err);
  }
}

// =============================================
// Event Listeners
// =============================================
function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  document.getElementById('menuForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveMenuItem();
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('active');
    });
  });

  // Rating preview khi nhập số
  const ratingInput = document.getElementById('menuRating');
  if (ratingInput) {
    ratingInput.addEventListener('input', () => {
      updateRatingPreview(parseFloat(ratingInput.value) || 0);
    });
  }
}

// =============================================
// Search & Sort
// =============================================
function onSearchOrSort() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadMenu(), 300);
}

function clearSearch() {
  document.getElementById('menuSearch').value = '';
  document.getElementById('searchClear').style.display = 'none';
  loadMenu();
}

// =============================================
// Tabs
// =============================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// =============================================
// Dashboard
// =============================================
function updateDashboardStats() {
  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + Number(o.total), 0);
  document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('pendingOrders').textContent = orders.filter((o) => o.status === 'pending').length;
  document.getElementById('completedOrders').textContent = orders.filter((o) => o.status === 'completed').length;
  document.getElementById('totalMenuItems').textContent = menuItems.length;
}

// =============================================
// Format Helpers
// =============================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
function formatNumber(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}
function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('vi-VN');
}

// =============================================
// Star Rating HTML
// =============================================
function renderStars(rating) {
  const r = parseFloat(rating) || 0;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (r >= i) {
      html += '<i class="fas fa-star star-filled"></i>';
    } else if (r >= i - 0.5) {
      html += '<i class="fas fa-star-half-alt star-filled"></i>';
    } else {
      html += '<i class="far fa-star star-empty"></i>';
    }
  }
  return `<span class="stars">${html}</span> <span class="rating-number">${r.toFixed(1)}</span>`;
}

function updateRatingPreview(val) {
  const container = document.getElementById('ratingPreview');
  if (!container) return;
  const r = Math.min(5, Math.max(0, val));
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (r >= i) html += '<i class="fas fa-star star-filled"></i>';
    else if (r >= i - 0.5) html += '<i class="fas fa-star-half-alt star-filled"></i>';
    else html += '<i class="far fa-star star-empty"></i>';
  }
  container.innerHTML = html;
}

// =============================================
// Menu Rendering
// =============================================
function renderMenuItems() {
  const container = document.getElementById('menuContainer');
  const emptyState = document.getElementById('menuEmpty');
  const sort = document.getElementById('menuSort')?.value || '';

  if (menuItems.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  // Nếu đang sort → hiển thị flat list, không nhóm theo category
  if (sort && sort !== '') {
    container.innerHTML = `
      <div class="category-section">
        <div class="category-header">
          <h3 class="category-title">Kết quả (${menuItems.length} món)</h3>
        </div>
        <div class="menu-grid">
          ${menuItems.map((item) => createMenuItemCard(item)).join('')}
        </div>
      </div>
    `;
    return;
  }

  // Mặc định: nhóm theo category
  const grouped = {};
  menuItems.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  container.innerHTML = '';
  Object.entries(grouped).forEach(([category, items]) => {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `
      <div class="category-header">
        <h3 class="category-title">${category}</h3>
        <span class="category-badge">${items.length} món</span>
      </div>
      <div class="menu-grid">
        ${items.map((item) => createMenuItemCard(item)).join('')}
      </div>
    `;
    container.appendChild(section);
  });
}

function createMenuItemCard(item) {
  return `
    <div class="menu-item ${!item.available ? 'unavailable' : ''}">
      <div class="menu-item-image">
        <img src="${item.image || ''}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#f1f5f9;color:#94a3b8;">
          <i class="fas fa-image fa-3x"></i>
        </div>
        ${!item.available ? '<div class="unavailable-overlay">Hết hàng</div>' : ''}
      </div>
      <div class="menu-item-content">
        <div class="menu-item-header">
          <h4 class="menu-item-name">${item.name}</h4>
          <span class="menu-item-price">${formatNumber(item.price)}</span>
        </div>
        <div class="menu-item-rating">${renderStars(item.rating)}</div>
        <p class="menu-item-description">${item.description || ''}</p>
        <div class="menu-item-actions">
          <button class="btn ${item.available ? 'btn-outline' : 'btn-success'} btn-sm"
                  onclick="toggleAvailability(${item.id})">
            ${item.available ? 'Hết hàng' : 'Còn hàng'}
          </button>
          <div class="btn-group">
            <button class="btn btn-outline btn-sm" onclick="editMenuItem(${item.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline btn-sm btn-danger-outline" onclick="deleteMenuItem(${item.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// Menu CRUD
// =============================================
function openAddMenuModal() {
  currentEditingItem = null;
  document.getElementById('menuModalTitle').textContent = 'Thêm Món Ăn Mới';
  document.getElementById('menuForm').reset();
  document.getElementById('menuItemId').value = '';
  document.getElementById('menuRating').value = '0';
  updateRatingPreview(0);
  document.getElementById('menuModal').classList.add('active');
}

function editMenuItem(id) {
  const item = menuItems.find((i) => i.id === id);
  if (!item) return;

  currentEditingItem = item;
  document.getElementById('menuModalTitle').textContent = 'Chỉnh Sửa Món Ăn';
  document.getElementById('menuItemId').value = item.id;
  document.getElementById('menuName').value = item.name;
  document.getElementById('menuPrice').value = item.price;
  document.getElementById('menuRating').value = item.rating || 0;
  document.getElementById('menuCategory').value = item.category;
  document.getElementById('menuDescription').value = item.description || '';
  document.getElementById('menuImage').value = item.image || '';
  updateRatingPreview(parseFloat(item.rating) || 0);
  document.getElementById('menuModal').classList.add('active');
}

async function saveMenuItem() {
  const formData = {
    name: document.getElementById('menuName').value,
    price: parseFloat(document.getElementById('menuPrice').value),
    category: document.getElementById('menuCategory').value,
    description: document.getElementById('menuDescription').value,
    image: document.getElementById('menuImage').value || null,
    rating: parseFloat(document.getElementById('menuRating').value) || 0,
  };

  if (!formData.name || !formData.price || !formData.category) {
    alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
    return;
  }

  try {
    if (currentEditingItem) {
      await apiCall(`/menu/${currentEditingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...formData, available: currentEditingItem.available }),
      });
    } else {
      await apiCall('/menu', { method: 'POST', body: JSON.stringify(formData) });
    }
    closeMenuModal();
    await loadMenu();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;
  try {
    await apiCall(`/menu/${id}`, { method: 'DELETE' });
    await loadMenu();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

async function toggleAvailability(id) {
  try {
    await apiCall(`/menu/${id}/toggle`, { method: 'PATCH' });
    await loadMenu();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

function closeMenuModal() {
  document.getElementById('menuModal').classList.remove('active');
  currentEditingItem = null;
}

// =============================================
// Orders
// =============================================
function renderOrders() {
  const container = document.getElementById('ordersContainer');
  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>Chưa có đơn hàng nào</p></div>';
    return;
  }
  container.innerHTML = orders.map((o) => createOrderCard(o)).join('');
}

function createOrderCard(order) {
  return `
    <div class="order-card">
      <div class="order-header">
        <div class="order-info">
          <h3>
            Đơn hàng #${String(order.id).padStart(4, '0')}
            <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
          </h3>
          <p class="order-meta">Khách hàng: ${order.customer_name} • Bàn: ${order.table_number}</p>
        </div>
        <div class="order-total">
          <div class="order-total-amount">${formatNumber(order.total)}</div>
          <div class="order-date">${formatDateTime(order.created_at)}</div>
        </div>
      </div>
      <div class="order-content">
        <div class="order-items">
          ${(order.items || []).slice(0, 3).map((i) => `<span class="order-item-badge">${i.name} x${i.quantity}</span>`).join('')}
          ${(order.items || []).length > 3 ? `<span class="order-item-badge">+${order.items.length - 3} món khác</span>` : ''}
        </div>
        <div class="order-actions">
          <button class="btn btn-outline btn-sm" onclick="viewOrder(${order.id})">
            <i class="fas fa-eye"></i> Xem
          </button>
          ${getOrderActionButtons(order)}
        </div>
      </div>
    </div>`;
}

function getStatusText(s) {
  return { pending: 'Chờ xử lý', preparing: 'Đang chuẩn bị', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[s] || s;
}

function getOrderActionButtons(order) {
  if (order.status === 'pending') {
    return `
      <button class="btn btn-outline btn-sm" onclick="updateOrderStatus(${order.id},'preparing')"><i class="fas fa-clock"></i> Chuẩn bị</button>
      <button class="btn btn-outline btn-sm btn-danger-outline" onclick="updateOrderStatus(${order.id},'cancelled')"><i class="fas fa-times-circle"></i> Hủy</button>`;
  }
  if (order.status === 'preparing') {
    return `<button class="btn btn-outline btn-sm" onclick="updateOrderStatus(${order.id},'completed')"><i class="fas fa-check-circle"></i> Hoàn thành</button>`;
  }
  return '';
}

function openNewOrderModal() {
  newOrderItems = [];
  document.getElementById('customerName').value = '';
  document.getElementById('tableNumber').value = '';
  renderSelectedItems();
  renderMenuSelection();
  document.getElementById('orderModal').classList.add('active');
}

function renderSelectedItems() {
  const container = document.getElementById('selectedItems');
  const totalEl = document.getElementById('orderTotal');
  if (newOrderItems.length === 0) {
    container.innerHTML = '<p style="color:#6b7280;font-style:italic;">Chưa chọn món nào</p>';
    totalEl.textContent = '0đ';
    return;
  }
  container.innerHTML = newOrderItems.map((item) => `
    <div class="selected-item">
      <span>${item.name}</span>
      <div class="item-controls">
        <button class="quantity-btn" onclick="removeItemFromOrder(${item.menu_item_id})"><i class="fas fa-minus"></i></button>
        <span style="margin:0 .5rem;font-weight:500;">${item.quantity}</span>
        <button class="quantity-btn" onclick="addItemToOrder(${item.menu_item_id})"><i class="fas fa-plus"></i></button>
        <span style="margin-left:1rem;font-weight:500;min-width:80px;text-align:right;">${formatNumber(item.price * item.quantity)}</span>
      </div>
    </div>`).join('');
  totalEl.textContent = formatNumber(newOrderItems.reduce((s, i) => s + i.price * i.quantity, 0));
}

function renderMenuSelection() {
  const container = document.getElementById('menuSelection');
  container.innerHTML = menuItems.filter((i) => i.available).map((item) => `
    <div class="menu-selection-item" onclick="addItemToOrder(${item.id})">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${formatNumber(item.price)}</div>
      </div>
      <button class="btn btn-outline btn-sm"><i class="fas fa-plus"></i></button>
    </div>`).join('');
}

function addItemToOrder(menuItemId) {
  const menuItem = menuItems.find((i) => i.id === menuItemId);
  if (!menuItem || !menuItem.available) return;
  const existing = newOrderItems.find((i) => i.menu_item_id === menuItemId);
  if (existing) { existing.quantity += 1; }
  else { newOrderItems.push({ menu_item_id: menuItem.id, name: menuItem.name, price: Number(menuItem.price), quantity: 1 }); }
  renderSelectedItems();
}

function removeItemFromOrder(menuItemId) {
  const existing = newOrderItems.find((i) => i.menu_item_id === menuItemId);
  if (existing) {
    if (existing.quantity > 1) existing.quantity -= 1;
    else newOrderItems = newOrderItems.filter((i) => i.menu_item_id !== menuItemId);
  }
  renderSelectedItems();
}

async function createOrder() {
  const name = document.getElementById('customerName').value;
  const table = document.getElementById('tableNumber').value;
  if (!name || !table || newOrderItems.length === 0) {
    alert('Vui lòng điền đầy đủ thông tin và chọn ít nhất một món!');
    return;
  }
  try {
    await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify({ customer_name: name, table_number: parseInt(table), items: newOrderItems }),
    });
    closeOrderModal();
    orders = await apiCall('/orders');
    renderOrders();
    updateDashboardStats();
    alert('Đơn hàng đã được tạo thành công!');
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await apiCall(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    orders = await apiCall('/orders');
    renderOrders();
    updateDashboardStats();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

async function viewOrder(orderId) {
  try {
    const order = await apiCall(`/orders/${orderId}`);
    document.getElementById('viewOrderTitle').textContent = `Chi Tiết Đơn Hàng #${String(order.id).padStart(4, '0')}`;
    document.getElementById('orderDetails').innerHTML = `
      <div class="order-detail-section">
        <div class="order-detail-grid">
          <div class="detail-item"><span class="detail-label">Khách hàng</span><span class="detail-value">${order.customer_name}</span></div>
          <div class="detail-item"><span class="detail-label">Số bàn</span><span class="detail-value">${order.table_number}</span></div>
        </div>
        <div class="detail-item mb-3"><span class="detail-label">Trạng thái</span><span class="order-status status-${order.status}">${getStatusText(order.status)}</span></div>
      </div>
      <div class="order-detail-section">
        <h4>Món ăn</h4>
        <div class="order-items-list">
          ${(order.items || []).map((i) => `
            <div class="order-item-row">
              <div class="item-details">
                <div class="item-name-qty">${i.name}</div>
                <div class="item-unit-price">${formatNumber(i.price)} x ${i.quantity}</div>
              </div>
              <div class="item-total-price">${formatNumber(i.price * i.quantity)}</div>
            </div>`).join('')}
          <div class="order-item-row total"><span>Tổng cộng:</span><span style="color:#059669;">${formatNumber(order.total)}</span></div>
        </div>
      </div>
      <div class="order-detail-section">
        <div class="order-detail-grid">
          <div class="detail-item"><span class="detail-label">Thời gian tạo</span><span class="detail-value">${formatDateTime(order.created_at)}</span></div>
          <div class="detail-item"><span class="detail-label">Cập nhật lần cuối</span><span class="detail-value">${formatDateTime(order.updated_at)}</span></div>
        </div>
      </div>`;
    document.getElementById('viewOrderModal').classList.add('active');
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('active');
  newOrderItems = [];
}
function closeViewOrderModal() {
  document.getElementById('viewOrderModal').classList.remove('active');
}

// =============================================
// Statistics
// =============================================
function initializeStatistics() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('statsDate').value = today;
  updateStatistics();
}

async function updateStatistics() {
  const type = document.getElementById('statsType').value;
  const date = document.getElementById('statsDate').value;
  try {
    const data = await apiCall(`/statistics?type=${type}&date=${date}`);

    document.getElementById('periodRevenue').textContent = formatNumber(data.current.revenue);
    document.getElementById('periodOrders').textContent = data.current.orderCount;
    document.getElementById('avgOrderValue').textContent = formatNumber(data.current.avgOrderValue);

    updateChangeEl('revenueChange', calcChange(data.current.revenue, data.previous.revenue));
    updateChangeEl('ordersChange', calcChange(data.current.orderCount, data.previous.orderCount));
    updateChangeEl('avgChange', calcChange(data.current.avgOrderValue, data.previous.avgOrderValue));

    if (data.topItems.length > 0) {
      document.getElementById('topItem').textContent = data.topItems[0].name;
      document.getElementById('topItemCount').textContent = `${data.topItems[0].count} lần`;
    } else {
      document.getElementById('topItem').textContent = '-';
      document.getElementById('topItemCount').textContent = '0 lần';
    }

    renderRevenueChart(data.chartData);
    renderTopItemsList(data.topItems);
    renderCategoryAnalysis(data.categoryAnalysis);
    renderTimeDetails(data.chartData);
  } catch (err) {
    console.error('Lỗi thống kê:', err);
  }
}

function calcChange(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

function updateChangeEl(id, change) {
  const el = document.getElementById(id);
  const sign = change > 0 ? '+' : change < 0 ? '-' : '';
  el.textContent = `${sign}${Math.abs(change).toFixed(1)}%`;
  el.className = 'stat-change ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');
}

function renderRevenueChart(chartData) {
  const c = document.getElementById('revenueChart');
  if (!chartData || chartData.length === 0) { c.innerHTML = '<p class="text-center" style="color:#64748b;padding:2rem;">Không có dữ liệu</p>'; return; }
  const max = Math.max(...chartData.map((d) => d.value));
  c.innerHTML = chartData.map((d) => {
    const h = max > 0 ? (d.value / max) * 250 : 0;
    return `<div class="chart-bar" style="height:${h}px;" title="${d.label}: ${formatNumber(d.value)}">
      <div class="chart-bar-value">${formatNumber(d.value)}</div><div class="chart-bar-label">${d.label}</div></div>`;
  }).join('');
}

function renderTimeDetails(chartData) {
  const c = document.getElementById('timeDetails');
  const filtered = (chartData || []).filter((d) => d.value > 0);
  if (filtered.length === 0) { c.innerHTML = '<p style="color:#64748b;text-align:center;">Không có dữ liệu</p>'; return; }
  c.innerHTML = filtered.map((d) => `
    <div class="time-detail-item">
      <span class="time-detail-date">${d.label}</span>
      <span class="time-detail-revenue">${formatNumber(d.value)}</span>
    </div>`).join('');
}

function renderTopItemsList(items) {
  const c = document.getElementById('topItems');
  if (!items || items.length === 0) { c.innerHTML = '<p style="color:#64748b;text-align:center;">Không có dữ liệu</p>'; return; }
  c.innerHTML = items.map((i) => `
    <div class="top-item">
      <div class="top-item-info"><div class="top-item-name">${i.name}</div><div class="top-item-category">${i.category}</div></div>
      <div class="top-item-stats"><span class="top-item-count">${i.count} lần</span><span class="top-item-revenue">${formatNumber(i.revenue)}</span></div>
    </div>`).join('');
}

function renderCategoryAnalysis(categories) {
  const c = document.getElementById('categoryAnalysis');
  if (!categories || categories.length === 0) { c.innerHTML = '<p style="color:#64748b;text-align:center;">Không có dữ liệu</p>'; return; }
  const total = categories.reduce((s, cat) => s + Number(cat.revenue), 0);
  c.innerHTML = categories.map((cat) => {
    const pct = total > 0 ? (Number(cat.revenue) / total) * 100 : 0;
    return `<div class="category-item">
      <div class="category-header"><span class="category-name">${cat.category}</span><span class="category-revenue">${formatNumber(cat.revenue)}</span></div>
      <div class="category-bar"><div class="category-bar-fill" style="width:${pct}%"></div></div></div>`;
  }).join('');
}

function exportStatistics() {
  const type = document.getElementById('statsType').value;
  const date = document.getElementById('statsDate').value;
  const blob = new Blob([JSON.stringify({ type, date, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-${type}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('Báo cáo đã được xuất thành công!');
}
